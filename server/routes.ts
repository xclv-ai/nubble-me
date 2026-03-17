import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractFile } from "./extract";
import { chunkText, type ChunkedSection } from "./chunking";
import { isNLMAvailable, generateDepths } from "./notebooklm";
import { registerFeedRoutes } from "./feed-routes";
import { FeedAggregator } from "./feed";
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
}>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register feed routes (NLM-powered daily feed)
  registerFeedRoutes(app);

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

      // Require nlm — all depth generation is LLM-powered
      const nlmAvailable = await isNLMAvailable();
      if (!nlmAvailable) {
        return res.status(503).json({
          error: "NotebookLM (nlm) is not available or not authenticated. Run `nlm auth` to set up.",
        });
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

      // 3. Generate all depth levels via LLM (nlm generate-chat per section)
      log("Generating depth levels via NotebookLM...", "upload");
      const sections = await generateDepths(filePath, extracted.title, chunks);

      // 4. Store the converted document
      const docId = `doc_${Date.now()}`;
      const doc = {
        id: docId,
        title: extracted.title,
        author: extracted.author,
        sections,
        createdAt: new Date(),
        source: originalName,
      };
      documents.set(docId, doc);

      // Cleanup temp file
      try { fs.unlinkSync(filePath); } catch {}

      log(`Document ready: ${docId} (${sections.length} sections)`, "upload");

      res.json({
        id: docId,
        title: extracted.title,
        author: extracted.author,
        sectionCount: sections.length,
        wordCount: extracted.text.split(/\s+/).length,
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
      createdAt: d.createdAt,
    }));
    res.json(docs);
  });

  // ── iOS RSS News Feed API ─────────────────────────────────────────────────

  const feedAggregator = new FeedAggregator();

  // Initial feed fetch on startup
  feedAggregator.refreshAll().catch((err) => {
    log(`Initial feed refresh failed: ${err.message}`, "feed");
  });

  // Auto-refresh every 15 minutes
  feedAggregator.startAutoRefresh(15);

  // Get aggregated news feed
  app.get("/api/feed", (req, res) => {
    const topics = req.query.topics
      ? String(req.query.topics).split(",")
      : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const result = feedAggregator.getArticles({ topics, limit, offset });
    res.json(result);
  });

  // Manually trigger feed refresh
  app.post("/api/feed/refresh", async (_req, res) => {
    try {
      const result = await feedAggregator.refreshAll();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get available feed sources
  app.get("/api/feed/sources", (_req, res) => {
    res.json(feedAggregator.getSources());
  });

  // Get available topics
  app.get("/api/feed/topics", (_req, res) => {
    res.json(feedAggregator.getTopics());
  });

  return httpServer;
}
