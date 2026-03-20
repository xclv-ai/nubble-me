/**
 * Request Watcher — polls Supabase nubble_requests for pending jobs.
 * Run via: npx tsx server/request-watcher.ts
 *
 * Fetches URL content, chunks it, generates NLM depth levels,
 * uploads result JSON to Supabase Storage, and updates the request row.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { chunkText, type ChunkedSection } from "./chunking";

const exec = promisify(execFile);

const NLM_PATH =
  process.env.NLM_PATH ||
  path.join(process.env.HOME || "/root", ".local/bin/nlm");

const POLL_INTERVAL_MS = 60_000;
const MAX_DAILY_REQUESTS = 10;
const STORAGE_BUCKET = "nubble-documents";

// ── Supabase client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Logging ─────────────────────────────────────────────────────────────────

function log(msg: string, tag = "watcher") {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${tag}] ${msg}`);
}

// ── NLM helpers (same pattern as notebooklm.ts) ────────────────────────────

async function runNLM(args: string[], timeoutMs = 60000): Promise<string> {
  try {
    const { stdout, stderr } = await exec(NLM_PATH, args, { timeout: timeoutMs });
    if (stderr) log(`nlm stderr: ${stderr}`, "nlm");
    const raw = stdout.trim();

    // nlm notebook query returns JSON with { value: { answer: "..." } }
    if (args[0] === "notebook" && args[1] === "query") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.value?.answer) return parsed.value.answer;
      } catch { /* not JSON, return raw */ }
    }

    return raw;
  } catch (err: any) {
    log(`nlm error: ${err.message}`, "nlm");
    throw new Error(`nlm command failed: ${args.join(" ")}: ${err.message}`);
  }
}

function parseId(output: string, label: string): string {
  const match = output.match(/([a-zA-Z0-9_-]{10,})/);
  if (!match) throw new Error(`Could not parse ${label} ID from: ${output}`);
  return match[1];
}

function buildDepthPrompt(sectionTitle: string, sectionIndex: number): string {
  return `For section ${sectionIndex + 1} of this document (about "${sectionTitle}"), produce three versions at different depth levels. Output EXACTLY in this format:

---SUMMARY---
One sentence, max 20 words capturing the core idea.

---CONDENSED---
2-3 sentences with key points only.

---EXPANDED---
Expanded version with examples and context, 50-100% more content. Do not fabricate facts.`;
}

function parseDepthResponse(raw: string): {
  summary: string;
  condensed: string;
  expanded: string;
} {
  const summaryMatch = raw.match(/---SUMMARY---\s*([\s\S]*?)(?=---CONDENSED---|$)/);
  const condensedMatch = raw.match(/---CONDENSED---\s*([\s\S]*?)(?=---EXPANDED---|$)/);
  const expandedMatch = raw.match(/---EXPANDED---\s*([\s\S]*?)$/);

  const summary = summaryMatch?.[1]?.trim();
  const condensed = condensedMatch?.[1]?.trim();
  const expanded = expandedMatch?.[1]?.trim();

  if (!summary || !condensed || !expanded) {
    throw new Error("LLM response did not contain all three depth levels");
  }

  return { summary, condensed, expanded };
}

// ── URL content extraction ──────────────────────────────────────────────────

async function extractUrlContent(url: string): Promise<{ title: string; text: string }> {
  log(`Fetching URL: ${url}`, "extract");

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NubbleBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, header, footer, aside, iframe, noscript, .sidebar, .comments, .ad, .advertisement").remove();

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "Imported Article";

  // Extract text from article body or main content
  const article = $("article, main, [role='main'], .post-content, .entry-content, .article-body");
  const root = article.length ? article.first() : $("body");

  let text = "";

  // Try structured extraction first (p, h*, li)
  root.find("h1, h2, h3, h4, h5, h6, p, li, blockquote, pre").each((_, el) => {
    const tag = (el as any).tagName?.toLowerCase() || "";
    const content = $(el).text().trim();
    if (!content) return;

    if (tag.startsWith("h")) {
      const level = parseInt(tag[1]) || 2;
      text += `\n${"#".repeat(level)} ${content}\n\n`;
    } else if (tag === "li") {
      text += `- ${content}\n`;
    } else {
      text += `${content}\n\n`;
    }
  });

  text = text.trim();
  if (!text || text.split(/\s+/).length < 100) {
    // Fallback: get HTML, convert <br><br> to paragraph breaks, strip tags
    let html2 = root.html() || "";
    // Normalize br tags to newlines
    html2 = html2.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n");
    html2 = html2.replace(/<br\s*\/?>/gi, "\n");
    // Convert headings
    html2 = html2.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, content) => {
      const clean = cheerio.load(content).text().trim();
      return `\n${"#".repeat(parseInt(level))} ${clean}\n\n`;
    });
    // Strip remaining tags
    text = cheerio.load(html2).text();
    // Clean up whitespace
    text = text.replace(/\n{3,}/g, "\n\n").trim();
  }

  log(`Extracted: "${title}" (${text.split(/\s+/).length} words)`, "extract");
  return { title, text };
}

// ── Generate depths for all chunks ──────────────────────────────────────────

async function generateDepthsForChunks(
  title: string,
  text: string,
  chunks: ReturnType<typeof chunkText>
): Promise<ChunkedSection[]> {
  let notebookId: string | null = null;

  try {
    // Create notebook and add the full text as a source
    log(`Creating depth notebook for: ${title}`, "nlm");
    const createOutput = await runNLM(["notebook", "create", `Nubble: ${title}`], 30000);
    notebookId = parseId(createOutput, "notebook");

    // Write text to temp file and add as source
    const tmpFile = path.join(process.cwd(), "uploads", `tmp_${Date.now()}.txt`);
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, text);

    await runNLM(["source", "add", notebookId, "--file", tmpFile, "--wait"], 120000);
    log("Source added and indexed", "nlm");

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch {}

    // Generate depths per section
    log(`Generating depths for ${chunks.length} sections...`, "nlm");
    const sections: ChunkedSection[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      log(`  Section ${i + 1}/${chunks.length}: "${chunk.title}"`, "nlm");

      const prompt = buildDepthPrompt(chunk.title, i);
      const raw = await runNLM(
        ["notebook", "query", notebookId, prompt],
        180000
      );
      const depths = parseDepthResponse(raw);

      sections.push({
        id: `s${i + 1}`,
        title: chunk.title,
        summary: depths.summary,
        condensed: depths.condensed,
        standard: chunk.body,
        expanded: depths.expanded,
      });
    }

    log("All depths generated", "nlm");
    return sections;
  } finally {
    if (notebookId) {
      try {
        await runNLM(["notebook", "delete", notebookId, "-y"], 15000);
        log(`Cleaned up depth notebook: ${notebookId}`, "nlm");
      } catch {
        log(`Failed to cleanup depth notebook: ${notebookId}`, "nlm");
      }
    }
  }
}

// ── Process a single request ────────────────────────────────────────────────

async function processRequest(request: {
  id: string;
  source_type: string;
  source_value: string;
  email: string;
}): Promise<void> {
  log(`Processing request ${request.id} (${request.source_type}: ${request.source_value})`, "process");

  // Claim the job
  await supabase
    .from("nubble_requests")
    .update({ status: "processing" })
    .eq("id", request.id);

  try {
    // 1. Extract content from URL
    const { title, text } = await extractUrlContent(request.source_value);
    log(`Extracted: "${title}" (${text.split(/\s+/).length} words)`, "process");

    // 2. Chunk into sections (cap at 10 for beta — each takes ~2 min via NLM)
    const MAX_SECTIONS = 10;
    let chunks = chunkText(text);
    log(`Chunked into ${chunks.length} sections`, "process");

    if (chunks.length === 0) {
      throw new Error("No meaningful content could be extracted from this URL");
    }

    if (chunks.length > MAX_SECTIONS) {
      log(`Capping to ${MAX_SECTIONS} sections (was ${chunks.length})`, "process");
      chunks = chunks.slice(0, MAX_SECTIONS);
    }

    // 3. Generate depth levels
    const sections = await generateDepthsForChunks(title, text, chunks);

    // 4. Build document JSON
    const document = {
      title,
      author: new URL(request.source_value).hostname.replace("www.", ""),
      sections,
    };

    // 5. Upload to Supabase Storage
    const jsonData = JSON.stringify(document, null, 2);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${request.id}.json`, jsonData, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // 6. Mark as completed
    await supabase
      .from("nubble_requests")
      .update({
        status: "completed",
        result_id: request.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    log(`Completed request ${request.id}: "${title}" (${sections.length} sections)`, "process");
  } catch (err: any) {
    log(`Failed request ${request.id}: ${err.message}`, "process");
    await supabase
      .from("nubble_requests")
      .update({
        status: "failed",
        error_message: err.message,
        processed_at: new Date().toISOString(),
      })
      .eq("id", request.id);
  }
}

// ── Main poll loop ──────────────────────────────────────────────────────────

let dailyCount = 0;
let lastResetDate = new Date().toDateString();

async function poll() {
  // Reset daily counter
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyCount = 0;
    lastResetDate = today;
  }

  if (dailyCount >= MAX_DAILY_REQUESTS) {
    log(`Daily limit reached (${MAX_DAILY_REQUESTS}). Skipping poll.`);
    return;
  }

  // Fetch oldest pending request
  const { data: requests, error } = await supabase
    .from("nubble_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    log(`Poll error: ${error.message}`);
    return;
  }

  if (!requests || requests.length === 0) return;

  const request = requests[0];
  dailyCount++;
  await processRequest(request);
}

// ── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  log("Request watcher started");
  log(`NLM path: ${NLM_PATH}`);
  log(`Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  log(`Daily limit: ${MAX_DAILY_REQUESTS}`);

  // Check NLM availability
  try {
    await exec(NLM_PATH, ["notebook", "list"], { timeout: 10000 });
    log("NLM CLI is available and authenticated");
  } catch {
    log("WARNING: NLM CLI is not available. Requests will fail.", "nlm");
  }

  // Initial poll
  await poll();

  // Start polling loop
  setInterval(poll, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Watcher fatal error:", err);
  process.exit(1);
});
