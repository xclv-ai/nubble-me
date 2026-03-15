import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractFile } from "./extract";
import { chunkText, generateAlgorithmicDepths, type ChunkedSection } from "./chunking";
import { isNLMAvailable, processWithNotebookLM } from "./notebooklm";
import { log } from "./index";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".epub", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Accepted: ${allowed.join(", ")}`));
    }
  },
});

// In-memory store for converted documents
const documents = new Map<string, {
  id: string;
  title: string;
  author: string;
  sections: ChunkedSection[];
  createdAt: Date;
  source: string;
  nlmEnhanced: boolean;
}>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Check if NotebookLM (nlm) is available
  app.get("/api/nlm/status", async (_req, res) => {
    const available = await isNLMAvailable();
    res.json({ available });
  });

  // Upload and convert a PDF/ePub file
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase();
      const tempPath = req.file.path;

      // Rename to preserve extension (pdf-parse and jszip need it)
      const filePath = tempPath + ext;
      fs.renameSync(tempPath, filePath);

      log(`Processing file: ${originalName} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`, "upload");

      // 1. Extract text from file
      log("Extracting text...", "upload");
      const extracted = await extractFile(filePath);
      log(`Extracted: "${extracted.title}" by ${extracted.author} (${extracted.text.split(/\s+/).length} words)`, "upload");

      // 2. Chunk into sections
      log("Chunking into sections...", "upload");
      const chunks = chunkText(extracted.text);
      log(`Created ${chunks.length} sections`, "upload");

      // 3. Generate algorithmic depths (instant, no AI)
      let sections = generateAlgorithmicDepths(chunks);

      // 4. Try NotebookLM enhancement if available
      let nlmEnhanced = false;
      const useNLM = req.body?.useNLM !== "false";

      if (useNLM) {
        const nlmAvailable = await isNLMAvailable();
        if (nlmAvailable) {
          log("NotebookLM available, enhancing depths...", "upload");
          const nlmResult = await processWithNotebookLM(filePath, extracted.title);
          if (nlmResult) {
            // Merge NLM results into sections
            // NLM gives us a document-level summary and expansion
            // We use these to enhance the algorithmic depths
            sections = enhanceWithNLM(sections, nlmResult.summary, nlmResult.expanded);
            nlmEnhanced = true;
            log("NotebookLM enhancement complete", "upload");
          }
        } else {
          log("NotebookLM not available, using algorithmic depths", "upload");
        }
      }

      // 5. Store the converted document
      const docId = `doc_${Date.now()}`;
      const doc = {
        id: docId,
        title: extracted.title,
        author: extracted.author,
        sections,
        createdAt: new Date(),
        source: originalName,
        nlmEnhanced,
      };
      documents.set(docId, doc);

      // Cleanup temp file
      try { fs.unlinkSync(filePath); } catch {}

      log(`Document ready: ${docId} (${sections.length} sections, NLM: ${nlmEnhanced})`, "upload");

      res.json({
        id: docId,
        title: extracted.title,
        author: extracted.author,
        sectionCount: sections.length,
        wordCount: extracted.text.split(/\s+/).length,
        nlmEnhanced,
      });
    } catch (err: any) {
      log(`Upload error: ${err.message}`, "upload");
      // Cleanup temp file on error
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
        try { fs.unlinkSync(req.file.path + path.extname(req.file.originalname)); } catch {}
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Get a converted document by ID
  app.get("/api/documents/:id", (req, res) => {
    const doc = documents.get(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({
      title: doc.title,
      author: doc.author,
      sections: doc.sections,
    });
  });

  // List all converted documents
  app.get("/api/documents", (_req, res) => {
    const docs = Array.from(documents.values()).map(d => ({
      id: d.id,
      title: d.title,
      author: d.author,
      sectionCount: d.sections.length,
      source: d.source,
      nlmEnhanced: d.nlmEnhanced,
      createdAt: d.createdAt,
    }));
    res.json(docs);
  });

  return httpServer;
}

/**
 * Enhance algorithmic sections with NotebookLM summary/expansion.
 * NLM gives document-level output — we split and map back to sections.
 */
function enhanceWithNLM(
  sections: ChunkedSection[],
  nlmSummary: string,
  nlmExpanded: string
): ChunkedSection[] {
  // Split NLM output into paragraphs and try to map to sections
  const summaryParagraphs = nlmSummary.split(/\n\s*\n/).filter(p => p.trim());
  const expandedParagraphs = nlmExpanded.split(/\n\s*\n/).filter(p => p.trim());

  return sections.map((section, i) => {
    return {
      ...section,
      // Use NLM summary paragraph if available, else keep algorithmic
      summary: summaryParagraphs[i]
        ? extractFirstSentence(summaryParagraphs[i])
        : section.summary,
      condensed: summaryParagraphs[i] || section.condensed,
      // Use NLM expanded paragraph if available
      expanded: expandedParagraphs[i] || section.expanded,
    };
  });
}

function extractFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.slice(0, 100);
}
