/**
 * AI News Feed Pipeline — standalone script.
 * Run via: npx tsx server/feed-pipeline.ts
 *
 * Automates the NotebookLM research pipeline to generate a daily
 * curated AI news feed with multiple depth levels per story.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const exec = promisify(execFile);

const NLM_PATH = process.env.NLM_PATH || path.join(process.env.HOME || "/root", ".local/bin/nlm");

// Parse --category and --query flags from CLI args
const args = process.argv.slice(2);
function getArg(flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const CATEGORY = getArg("--category", "ai-news");
const CUSTOM_QUERY = getArg("--query", "");
const DATA_DIR_SERVER = path.join(process.cwd(), "server/data/feed", CATEGORY);
const DATA_DIR_PUBLIC = path.join(process.cwd(), "client/public/data/feed", CATEGORY);

// ---------- logging ----------

function log(message: string, source = "feed") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ---------- nlm helpers ----------

async function runNLM(args: string[], timeoutMs = 60000): Promise<string> {
  try {
    const { stdout, stderr } = await exec(NLM_PATH, args, { timeout: timeoutMs });
    if (stderr) log(`nlm stderr: ${stderr}`, "nlm");
    return stdout.trim();
  } catch (err: any) {
    log(`nlm error: ${err.message}`, "nlm");
    throw new Error(`nlm command failed: ${args.join(" ")}: ${err.message}`);
  }
}

/** Extract a UUID from nlm output */
function parseUUID(output: string, label: string): string {
  // Try standard UUID pattern first
  const uuidMatch = output.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];
  // Fallback: any long alphanumeric ID
  const idMatch = output.match(/([a-zA-Z0-9_-]{10,})/);
  if (idMatch) return idMatch[1];
  throw new Error(`Could not parse ${label} ID from: ${output}`);
}

/** Extract task ID from research start output (looks for "Task ID:" line) */
function parseTaskId(output: string): string {
  const taskLine = output.match(/Task\s*ID[:\s]+([a-zA-Z0-9_-]+)/i);
  if (taskLine) return taskLine[1];
  // Fallback: try UUID
  return parseUUID(output, "task");
}

/** Parse a number from output (e.g. sources count) */
function parseNumber(output: string): number {
  const match = output.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ---------- sleep ----------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------- studio polling ----------

/**
 * Poll `nlm studio status --json` until the specified artifact type is complete.
 * Parses JSON output to find artifacts matching the given type.
 */
async function pollArtifactReady(notebookId: string, artifactType: string, timeoutMs: number): Promise<void> {
  const POLL_INTERVAL = 30000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await sleep(POLL_INTERVAL);
    const raw = await runNLM(["studio", "status", notebookId, "--json"], 30000);
    log(`Studio status (${artifactType}): ${raw.substring(0, 120)}`, "studio");

    try {
      const artifacts = JSON.parse(raw);
      const matching = (Array.isArray(artifacts) ? artifacts : []).filter(
        (a: any) => a.type?.toLowerCase() === artifactType.toLowerCase()
      );
      const completed = matching.find((a: any) => a.status?.toLowerCase() === "completed");
      if (completed) {
        log(`${artifactType} artifact ready`, "studio");
        return;
      }
      const failed = matching.find((a: any) =>
        a.status?.toLowerCase() === "failed" || a.status?.toLowerCase() === "error"
      );
      if (failed) {
        throw new Error(`${artifactType} artifact failed: ${JSON.stringify(failed)}`);
      }
    } catch (parseErr: any) {
      // If JSON parse fails, fall back to text matching
      if (parseErr.message.includes("artifact failed")) throw parseErr;
      log(`Could not parse studio status JSON, retrying...`, "studio");
    }
  }

  throw new Error(`${artifactType} timed out after ${Math.round(timeoutMs / 60000)} minutes`);
}

// ---------- pipeline ----------

interface FeedStory {
  id: string;
  rank: number;
  title: string;
  source: string;
  source_url: string;
  why_it_matters: string;
  sections: {
    id: string;
    title: string;
    summary: string;
    condensed: string;
    standard: string;
    expanded: string;
  }[];
}

interface FeedOutput {
  date: string;
  generated_at: string;
  notebook_id: string;
  sources_found: number;
  stories: FeedStory[];
  audioUrl?: string;
  infographicUrl?: string;
}

async function runPipeline(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let notebookId: string | null = null;

  try {
    // 1. Create notebook
    const notebookNames: Record<string, string> = { "ai-news": "AI News", "ai-branding": "AI Branding", "ai-ecommerce": "AI Ecommerce", "a16z-portfolio": "a16z Portfolio" };
    const notebookName = `${notebookNames[CATEGORY] || CATEGORY} - ${today}`;
    log(`Creating notebook: "${notebookName}" (category: ${CATEGORY})`);
    const createOutput = await runNLM(["notebook", "create", notebookName]);
    notebookId = parseUUID(createOutput, "notebook");
    log(`Notebook created: ${notebookId}`);

    // 2. Start deep research
    const defaultQueries: Record<string, string> = {
      "ai-branding": "AI adoption at major branding agencies WPP Landor FutureBrand Interbrand Superunion, AI tools for brand strategists and marketers, M&A in branding and creative industry, new AI marketing tools announcements this week",
      "ai-ecommerce": "AI transforming ecommerce, DTC brands using AI, Amazon AI tools for sellers, Shopify AI features, AI product photography, AI pricing optimization, AI personalization for online retail, AI supply chain ecommerce this week",
      "a16z-portfolio": "Latest news updates from a16z Andreessen Horowitz portfolio AI startups: Nexthop AI, Mind Robotics, Replit, Lio procurement, Ease Health, QuiverAI, Chariot Defense, Heron Power, Temporal, Shizuku AI, Inferact vLLM, Mirelo audio AI, Unconventional analog chips, Keycard AI security, Reducto document AI",
    };
    const defaultQuery = defaultQueries[CATEGORY] || "most important AI news, LLM releases, AI breakthroughs and industry updates this week";
    const researchQuery = CUSTOM_QUERY || defaultQuery;
    log(`Starting deep research: "${researchQuery}"`);
    const researchOutput = await runNLM(
      ["research", "start", researchQuery, "-n", notebookId, "-m", "deep"],
      120000,
    );
    const taskId = parseTaskId(researchOutput);
    log(`Research started, task: ${taskId}`);

    // 3. Poll research status (every 30s, timeout 10min)
    const POLL_INTERVAL = 30000;
    const POLL_TIMEOUT = 10 * 60 * 1000;
    const pollStart = Date.now();
    let researchComplete = false;
    let statusOutput = "";

    while (Date.now() - pollStart < POLL_TIMEOUT) {
      await sleep(POLL_INTERVAL);
      statusOutput = await runNLM(["research", "status", notebookId, "--max-wait", "0"], 30000);
      log(`Research status: ${statusOutput.split("\n")[0]}`);

      if (
        statusOutput.toLowerCase().includes("complete") ||
        statusOutput.toLowerCase().includes("done") ||
        statusOutput.toLowerCase().includes("finished")
      ) {
        researchComplete = true;
        break;
      }
    }

    if (!researchComplete) {
      throw new Error("Research timed out after 10 minutes");
    }
    log("Research complete");

    // 4. Import all discovered sources
    log("Importing discovered sources...");
    const importOutput = await runNLM(["research", "import", notebookId, taskId], 300000);
    const sourcesFound = parseNumber(importOutput);
    log(`Imported sources (${sourcesFound} found)`);

    // Wait for indexing
    await sleep(10000);

    // 5. Query for top 10 stories
    log("Querying for top 10 stories...");
    const focusPrompts: Record<string, string> = {
      "ai-branding": `Focus on: how large branding agencies (WPP, Landor, FutureBrand, Interbrand, Superunion, Siegel+Gale, Wolff Olins, Pentagram) are adopting AI in their daily work. Include M&A moves in the creative/branding industry, new AI tools specifically useful for brand strategists and marketers, and shifts in how brands are built with AI. De-prioritize pure tech stories unless they directly impact branding work.`,
      "ai-ecommerce": `Focus on: how AI is transforming ecommerce operations — new AI tools for Amazon sellers, Shopify merchants, DTC brands. Include AI product photography, listing optimization, pricing intelligence, personalization engines, supply chain AI, and conversational commerce. Prioritize stories that change how ecommerce teams work daily. De-prioritize pure tech stories unless they directly impact online retail.`,
      "a16z-portfolio": `Focus on: the latest product updates, partnerships, customer wins, and milestones from these specific a16z-backed AI startups: Nexthop AI, Mind Robotics, Replit, Lio, Ease Health, QuiverAI, Chariot Defense, Heron Power, Temporal, Shizuku AI, Inferact, Mirelo, Unconventional, Keycard, Reducto. Each story should be about ONE specific company. Prioritize product launches, major customer announcements, technical breakthroughs, and strategic partnerships over funding news.`,
    };
    const categoryFocus = focusPrompts[CATEGORY] || `Focus on: what's genuinely NEW and how it changes something — new capabilities, new limitations exposed, new ways people will work or build, shifts in who has power. De-prioritize funding rounds and valuations unless the money itself changes the game. Prioritize stories where something actually shifted — not just announcements.`;

    const categoryLabels: Record<string, string> = {
      "ai-branding": "AI and strategic branding",
      "ai-ecommerce": "AI and ecommerce",
      "a16z-portfolio": "a16z AI portfolio startup",
    };
    const categoryLabel = categoryLabels[CATEGORY] || "AI";

    const rankPrompt = `Based on all sources in this notebook, rank the top 10 most important ${categoryLabel} stories. For each story output EXACTLY in this format:

---STORY 1---
TITLE: [headline]
SOURCE: [publication name]
URL: [source URL if available, otherwise "unknown"]
WHY: [one sentence about what this CHANGES — not what it costs, but what's different now]

---STORY 2---
TITLE: ...
(continue through STORY 10)

${categoryFocus}

IMPORTANT: Do NOT include citation numbers like [1], [2], [3] anywhere in your response. Write clean text only.`;

    const rankOutput = await runNLM(["notebook", "query", notebookId, rankPrompt], 120000);
    const stories = parseStoryList(rankOutput);
    log(`Parsed ${stories.length} stories`);

    // 6. Generate depth levels for each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      log(`Generating depths for story ${i + 1}/${stories.length}: "${story.title}"`);

      const depthPrompt = `For the story "${story.title}" from ${story.source}, produce three depth versions. Output EXACTLY in this format:

---SUMMARY---
(One sentence, max 20 words. What changed and why it matters — not dollar amounts.)

---CONDENSED---
(2-3 sentences. What's new, what it changes, who it affects. No filler.)

---EXPANDED---
Write in the style of Richard Feynman — clear, provocative, no jargon without explanation. Say what things ACTUALLY mean. If something is uncertain, say so. Use this exact structure with bold markdown headers:

**WHAT'S GOING ON**
(Plain English. What happened. No throat-clearing. Start with the concrete fact.)

**WHY THIS IS A BIG DEAL**
(Context. What led here. The numbers that matter. Why anyone outside the industry should care.)

**UNCOMFORTABLE TRUTH**
(The thing nobody wants to say. The real friction, the hidden cost, the part that makes people squirm.)

**SO WHAT**
(One sentence. The punchline. What changes tomorrow.)

Total 300-500 words. No fabricated facts. No corporate speak.

IMPORTANT: Do NOT include citation numbers like [1], [2], [3] anywhere in your response. Do NOT include source references. Write clean, readable prose only.`;

      const depthOutput = await runNLM(["notebook", "query", notebookId, depthPrompt], 120000);
      const depths = parseDepthResponse(depthOutput);

      // standard = condensed + why_it_matters
      const standard = `${depths.condensed}\n\n**Why it matters:** ${story.why_it_matters}`;

      story.sections = [
        {
          id: `s${i + 1}-1`,
          title: "Main Story",
          summary: depths.summary,
          condensed: depths.condensed,
          standard,
          expanded: depths.expanded,
        },
      ];
    }

    // 7. Save output JSON
    const output: FeedOutput = {
      date: today,
      generated_at: new Date().toISOString(),
      notebook_id: notebookId,
      sources_found: sourcesFound,
      stories,
    };

    // Save to both server and public directories
    for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const outputPath = path.join(dir, `${today}.json`);
      const latestPath = path.join(dir, "latest.json");
      const jsonData = JSON.stringify(output, null, 2);
      fs.writeFileSync(outputPath, jsonData);
      fs.writeFileSync(latestPath, jsonData);
      log(`Feed saved to: ${outputPath}`);
    }

    // 7b. Save to Supabase (nubble_feed table on pokpok project)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseKey) {
      log("Saving to Supabase...");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const rows = stories.map((s) => ({
        date: today,
        category: CATEGORY,
        story_rank: s.rank,
        title: s.title,
        source: s.source,
        source_url: s.source_url,
        why_it_matters: s.why_it_matters,
        summary: s.sections[0]?.summary || "",
        condensed: s.sections[0]?.condensed || "",
        standard: s.sections[0]?.standard || "",
        expanded: s.sections[0]?.expanded || "",
      }));
      const { error } = await supabase
        .from("nubble_feed")
        .upsert(rows, { onConflict: "date,category,story_rank" });
      if (error) {
        log(`Supabase upsert error: ${error.message}`, "supabase");
      } else {
        log(`Saved ${rows.length} stories to Supabase`, "supabase");
      }
    } else {
      log("Skipping Supabase save (no SUPABASE_URL/SUPABASE_SERVICE_KEY)", "supabase");
    }

    // 8. Generate podcast audio (graceful — failure doesn't block feed)
    try {
      log("Configuring chat tone for podcast...");
      const feynmanPrompt = `You are two friends who are deeply curious about technology — like Richard Feynman having coffee with a sharp journalist. Explain things in plain English, be provocative when something doesn't add up, never use marketing jargon. When something is uncertain, say so. When something is genuinely exciting, say why without hype. Keep it conversational, interrupt each other, disagree when you see it differently. No corporate speak. No "exciting developments." Just two people trying to figure out what actually matters.`;
      await runNLM(["chat", "configure", notebookId, "-g", "custom", "--prompt", feynmanPrompt], 30000);
      log("Chat tone configured");

      log("Creating audio podcast...");
      await runNLM(["audio", "create", notebookId, "-f", "debate", "-l", "short", "-y"], 120000);
      log("Audio creation started, polling status...");

      await pollArtifactReady(notebookId, "audio", 15 * 60 * 1000);

      // Download audio (nlm outputs .m4a) → decode to wav → encode to mp3 via lame
      const podcastDir = path.join(DATA_DIR_PUBLIC, "podcasts");
      if (!fs.existsSync(podcastDir)) {
        fs.mkdirSync(podcastDir, { recursive: true });
      }
      const m4aPath = path.join(podcastDir, `${today}_raw.m4a`);
      const wavPath = path.join(podcastDir, `${today}_raw.wav`);
      const audioFilename = `${today}.mp3`;
      const audioPath = path.join(podcastDir, audioFilename);
      log(`Downloading audio to: ${m4aPath}`);
      await runNLM(["download", "audio", notebookId, "-o", m4aPath, "--no-progress"], 120000);
      log("Audio downloaded, converting to mp3...");
      await exec("ffmpeg", ["-i", m4aPath, "-ac", "1", "-ar", "44100", wavPath, "-y"], { timeout: 60000 });

      const LAME_PATH = process.env.LAME_PATH || path.join(process.env.HOME || "/root", ".local/bin/lame");
      const lamePaths = [LAME_PATH, "/tmp/lame-install/bin/lame", "/usr/local/bin/lame", "lame"];
      let lameUsed = false;
      for (const lame of lamePaths) {
        try {
          await exec(lame, ["--preset", "voice", wavPath, audioPath], { timeout: 60000 });
          lameUsed = true;
          break;
        } catch { continue; }
      }
      if (!lameUsed) {
        // Fallback: keep as compressed m4a
        await exec("ffmpeg", ["-i", m4aPath, "-codec:a", "aac", "-b:a", "64k", "-ac", "1", audioPath.replace(".mp3", ".m4a"), "-y"], { timeout: 60000 });
        log("lame not found, fell back to compressed m4a");
      }
      // Cleanup temp files
      if (fs.existsSync(m4aPath)) fs.unlinkSync(m4aPath);
      if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
      const finalPath = fs.existsSync(audioPath) ? audioPath : audioPath.replace(".mp3", ".m4a");
      const audioSize = (fs.statSync(finalPath).size / (1024 * 1024)).toFixed(1);
      log(`Audio compressed: ${audioSize}MB`);

      // Update feed JSON with audioUrl
      const audioUrl = `/data/feed/${CATEGORY}/podcasts/${audioFilename}`;
      output.audioUrl = audioUrl;

      for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
        const outputPath = path.join(dir, `${today}.json`);
        const latestPath = path.join(dir, "latest.json");
        const jsonData = JSON.stringify(output, null, 2);
        fs.writeFileSync(outputPath, jsonData);
        fs.writeFileSync(latestPath, jsonData);
      }
      log(`Feed JSON updated with audioUrl: ${audioUrl}`);
    } catch (podcastErr: any) {
      log(`Podcast generation failed (feed still published): ${podcastErr.message}`, "podcast");
    }

    // 8b. Generate 8-bit infographics — landscape (for web) + portrait (archive)
    // Both saved locally, only landscape referenced in feed JSON
    for (const orientation of ["landscape", "portrait"] as const) {
      try {
        log(`Creating ${orientation} infographic...`);
        await runNLM(["infographic", "create", notebookId, "--style", "bricks", "-o", orientation, "-d", "concise", "-y"], 120000);
        log(`${orientation} infographic creation started, polling...`);

        await pollArtifactReady(notebookId, "infographic", 15 * 60 * 1000);

        const suffix = orientation === "landscape" ? "_landscape" : "";
        for (const dir of [DATA_DIR_PUBLIC, DATA_DIR_SERVER]) {
          const infographicDir = path.join(dir, "infographics");
          if (!fs.existsSync(infographicDir)) fs.mkdirSync(infographicDir, { recursive: true });

          const pngPath = path.join(infographicDir, `${today}${suffix}.png`);
          const jpgPath = path.join(infographicDir, `${today}${suffix}.jpg`);

          await runNLM(["download", "infographic", notebookId, "-o", pngPath, "--no-progress"], 120000);
          await exec("sips", ["-Z", "1400", pngPath, "-s", "format", "jpeg", "-s", "formatOptions", "75", "--out", jpgPath], { timeout: 30000 });
          fs.unlinkSync(pngPath);
        }
        const sampleJpg = path.join(DATA_DIR_PUBLIC, "infographics", `${today}${suffix}.jpg`);
        const jpgSize = (fs.statSync(sampleJpg).size / 1024).toFixed(0);
        log(`${orientation} infographic saved: ${jpgSize}KB`);

        // Only landscape goes into feed JSON (shown on web)
        if (orientation === "landscape") {
          const infographicUrl = `/data/feed/${CATEGORY}/infographics/${today}_landscape.jpg`;
          output.infographicUrl = infographicUrl;
          for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
            fs.writeFileSync(path.join(dir, `${today}.json`), JSON.stringify(output, null, 2));
            fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(output, null, 2));
          }
          log(`Feed JSON updated with infographicUrl: ${infographicUrl}`);
        }
      } catch (err: any) {
        log(`${orientation} infographic failed: ${err.message}`, "infographic");
      }
    }

    // 9. Cleanup notebook
    log("Cleaning up notebook...");
    await runNLM(["notebook", "delete", notebookId, "-y"], 30000);
    log("Notebook deleted");
    notebookId = null; // prevent double-delete in finally

    log(`Pipeline complete! ${stories.length} stories generated for ${today}`);
  } finally {
    if (notebookId) {
      try {
        await runNLM(["notebook", "delete", notebookId, "-y"], 30000);
        log(`Cleaned up notebook: ${notebookId}`, "cleanup");
      } catch {
        log(`Failed to cleanup notebook: ${notebookId}`, "cleanup");
      }
    }
  }
}

// ---------- parsers ----------

/** Strip NotebookLM metadata, literal \n, unicode escapes, citations from text */
function cleanText(s: string): string {
  return s
    // Strip leaked NLM API metadata (conversation_id, sources_used, citations)
    .replace(/[",]\s*"conversation_id"\s*:[\s\S]*$/, "")
    .replace(/[",]\s*"sources_used"\s*:[\s\S]*$/, "")
    .replace(/[",]\s*"citations"\s*:[\s\S]*$/, "")
    // Unicode escapes
    .replace(/\\u2014/g, "—").replace(/\\u2013/g, "–")
    .replace(/\\u2018/g, "'").replace(/\\u2019/g, "'")
    .replace(/\\u201c/g, '"').replace(/\\u201d/g, '"')
    .replace(/\\"/g, '"')
    // Literal \n → real newline
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // Remove [1], [1-3], [1, 2] citation markers
    .replace(/\s*\[[\d,\s\-–]+\]\s*/g, " ")
    // Fix spacing before punctuation
    .replace(/\s+([.,;:!?])/g, "$1")
    // Collapse spaces
    .replace(/  +/g, " ")
    // Strip trailing JSON junk
    .replace(/[\s{}]+$/, "")
    .trim();
}

function parseStoryList(raw: string): FeedStory[] {
  const stories: FeedStory[] = [];
  const storyBlocks = raw.split(/---STORY\s+\d+---/i).filter(b => b.trim());

  for (let i = 0; i < storyBlocks.length && i < 10; i++) {
    const block = storyBlocks[i];
    const rawTitle = block.match(/TITLE:\s*(.+)/i)?.[1]?.trim() || `Story ${i + 1}`;
    // Clean title: strip anything after \nSOURCE, remove citations, collapse whitespace
    const title = cleanText(rawTitle.split(/\\n/)[0]);
    const source = block.match(/SOURCE:\s*(.+)/i)?.[1]?.trim() || "Unknown";
    const url = block.match(/URL:\s*(.+)/i)?.[1]?.trim() || "unknown";
    const rawWhy = block.match(/WHY:\s*(.+)/i)?.[1]?.trim() || "";
    const why = cleanText(rawWhy.split(/\\n/)[0]);

    stories.push({
      id: `s${i + 1}`,
      rank: i + 1,
      title,
      source,
      source_url: url,
      why_it_matters: why,
      sections: [],
    });
  }

  return stories;
}

function parseDepthResponse(raw: string): {
  summary: string;
  condensed: string;
  expanded: string;
} {
  const summaryMatch = raw.match(/---SUMMARY---\s*([\s\S]*?)(?=---CONDENSED---|$)/);
  const condensedMatch = raw.match(/---CONDENSED---\s*([\s\S]*?)(?=---EXPANDED---|$)/);
  const expandedMatch = raw.match(/---EXPANDED---\s*([\s\S]*?)$/);

  const summary = cleanText(summaryMatch?.[1] || "Summary unavailable.");
  const condensed = cleanText(condensedMatch?.[1] || "Details unavailable.");
  const expanded = cleanText(expandedMatch?.[1] || "Full analysis unavailable.");

  return { summary, condensed, expanded };
}

// ---------- main ----------

runPipeline().catch(err => {
  log(`Pipeline failed: ${err.message}`, "error");
  process.exit(1);
});
