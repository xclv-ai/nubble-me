/**
 * Text extraction from PDF and ePub files.
 * Returns plain text with heading markers for the chunking engine.
 */

import fs from "fs";
import path from "path";

interface ExtractedDocument {
  title: string;
  author: string;
  text: string;
}

/** Extract text from a PDF file using pdf-parse v2 */
export async function extractPDF(filePath: string): Promise<ExtractedDocument> {
  // pdf-parse v2 has broken type declarations — use dynamic import with any cast
  const pdfMod: any = await import("pdf-parse");
  const parser = new pdfMod.PDFParse({});
  await parser.load(filePath);

  const info = parser.getInfo() || {};
  const text: string = await parser.getText();

  return {
    title: info.Title || path.basename(filePath, ".pdf"),
    author: info.Author || "Unknown",
    text,
  };
}

/** Extract text from an ePub file using jszip + cheerio */
export async function extractEPub(filePath: string): Promise<ExtractedDocument> {
  const JSZip = (await import("jszip")).default;
  const cheerio = await import("cheerio");

  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find OPF file via container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("Invalid ePub: missing container.xml");

  const container$ = cheerio.load(containerXml, { xml: true });
  const opfPath = container$("rootfile").attr("full-path");
  if (!opfPath) throw new Error("Invalid ePub: no OPF path found");

  // 2. Parse OPF for metadata + spine order
  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) throw new Error("Invalid ePub: missing OPF file");

  const opf$ = cheerio.load(opfXml, { xml: true });
  const opfDir = path.dirname(opfPath);

  const title = opf$("dc\\:title, title").first().text() || "Untitled";
  const author = opf$("dc\\:creator, creator").first().text() || "Unknown";

  // 3. Get spine order → manifest href mapping
  const idToHref: Record<string, string> = {};
  opf$("manifest item").each((_, el) => {
    const id = opf$(el).attr("id") || "";
    const href = opf$(el).attr("href") || "";
    const mediaType = opf$(el).attr("media-type") || "";
    if (mediaType.includes("html")) {
      idToHref[id] = href;
    }
  });

  const spineIds: string[] = [];
  opf$("spine itemref").each((_, el) => {
    const idref = opf$(el).attr("idref") || "";
    if (idToHref[idref]) spineIds.push(idref);
  });

  // 4. Extract text from each chapter in spine order
  const chapters: string[] = [];

  for (const idref of spineIds) {
    const href = idToHref[idref];
    const chapterPath = opfDir === "." ? href : `${opfDir}/${href}`;
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) continue;

    const html = await chapterFile.async("string");
    const ch$ = cheerio.load(html);

    // Remove nav/TOC elements
    ch$("nav, .toc, #toc").remove();

    const body = ch$("body");
    if (!body.length) continue;

    let chapterText = "";

    body.children().each((_, el) => {
      const tag = (el as any).tagName?.toLowerCase() || "";
      const text = ch$(el).text().trim();
      if (!text) return;

      if (tag === "h1") chapterText += `\n# ${text}\n\n`;
      else if (tag === "h2") chapterText += `\n## ${text}\n\n`;
      else if (tag === "h3") chapterText += `\n### ${text}\n\n`;
      else chapterText += `${text}\n\n`;
    });

    const plainText = body.text().trim();
    // Skip very short chapters (cover, copyright, etc.)
    if (plainText.split(/\s+/).length > 30) {
      chapters.push(chapterText.trim());
    }
  }

  return {
    title,
    author,
    text: chapters.join("\n\n"),
  };
}

/** Detect file type and extract accordingly */
export async function extractFile(filePath: string): Promise<ExtractedDocument> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    return extractPDF(filePath);
  } else if (ext === ".epub") {
    return extractEPub(filePath);
  } else if (ext === ".txt") {
    const text = fs.readFileSync(filePath, "utf-8");
    return {
      title: path.basename(filePath, ext),
      author: "Unknown",
      text,
    };
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
