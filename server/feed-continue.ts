/**
 * Continue feed pipeline from an existing notebook (skips create + research + import).
 * Usage: npx tsx server/feed-continue.ts --notebook <id> --category <cat>
 */
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const exec = promisify(execFile);
const NLM_PATH = process.env.NLM_PATH || path.join(process.env.HOME || "/root", ".local/bin/nlm");

const args = process.argv.slice(2);
function getArg(flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const CATEGORY = getArg("--category", "ai-news");
const NOTEBOOK_ID = getArg("--notebook", "");
if (!NOTEBOOK_ID) { console.error("--notebook <id> required"); process.exit(1); }

const DATA_DIR_SERVER = path.join(process.cwd(), "server/data/feed", CATEGORY);
const DATA_DIR_PUBLIC = path.join(process.cwd(), "client/public/data/feed", CATEGORY);

function log(message: string, source = "feed") {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [${source}] ${message}`);
}

async function runNLM(args: string[], timeoutMs = 60000): Promise<string> {
  const { stdout, stderr } = await exec(NLM_PATH, args, { timeout: timeoutMs });
  if (stderr) log(`nlm stderr: ${stderr}`, "nlm");
  const raw = stdout.trim();
  if (args[0] === "notebook" && args[1] === "query") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.value?.answer) return parsed.value.answer;
    } catch {}
  }
  return raw;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function cleanText(s: string): string {
  return s
    .replace(/[",]\s*"conversation_id"\s*:[\s\S]*$/, "")
    .replace(/[",]\s*"sources_used"\s*:[\s\S]*$/, "")
    .replace(/[",]\s*"citations"\s*:[\s\S]*$/, "")
    .replace(/\\u2014/g, "—").replace(/\\u2013/g, "–")
    .replace(/\\u2018/g, "'").replace(/\\u2019/g, "'")
    .replace(/\\u201c/g, '"').replace(/\\u201d/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n").replace(/\n{3,}/g, "\n\n")
    .replace(/\s*\[[\d,\s\-–]+\]\s*/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/  +/g, " ")
    .replace(/[\s{}]+$/, "")
    .trim();
}

interface FeedStory {
  id: string; rank: number; title: string; source: string; source_url: string;
  why_it_matters: string;
  sections: { id: string; title: string; summary: string; condensed: string; standard: string; expanded: string; }[];
}

interface FeedOutput {
  date: string; generated_at: string; notebook_id: string; sources_found: number;
  stories: FeedStory[]; audioUrl?: string; infographicUrl?: string;
}

async function pollArtifactReady(notebookId: string, artifactType: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(30000);
    const raw = await runNLM(["studio", "status", notebookId, "--json"], 30000);
    log(`Studio status (${artifactType}): ${raw.substring(0, 120)}`, "studio");
    try {
      const artifacts = JSON.parse(raw);
      const matching = (Array.isArray(artifacts) ? artifacts : []).filter((a: any) => a.type?.toLowerCase() === artifactType.toLowerCase());
      if (matching.find((a: any) => a.status?.toLowerCase() === "completed")) { log(`${artifactType} ready`, "studio"); return; }
      if (matching.find((a: any) => ["failed","error"].includes(a.status?.toLowerCase()))) throw new Error(`${artifactType} failed`);
    } catch (e: any) { if (e.message.includes("failed")) throw e; }
  }
  throw new Error(`${artifactType} timed out`);
}

async function run() {
  const today = new Date().toISOString().slice(0, 10);
  const notebookId = NOTEBOOK_ID;

  // Category prompts
  const focusPrompts: Record<string, string> = {
    "ai-branding": `Focus on: how large branding agencies (WPP, Landor, FutureBrand, Interbrand, Superunion, Siegel+Gale, Wolff Olins, Pentagram) are adopting AI in their daily work. Include M&A moves in the creative/branding industry, new AI tools specifically useful for brand strategists and marketers, and shifts in how brands are built with AI.`,
    "ai-ecommerce": `Focus on: how AI is transforming ecommerce operations — new AI tools for Amazon sellers, Shopify merchants, DTC brands. Include AI product photography, listing optimization, pricing intelligence, personalization engines, supply chain AI, and conversational commerce.`,
    "a16z-portfolio": `Focus on: the latest product updates, partnerships, customer wins from a16z-backed AI startups.`,
  };
  const categoryFocus = focusPrompts[CATEGORY] || `Focus on: what's genuinely NEW and how it changes something — new capabilities, new limitations exposed, new ways people will work or build, shifts in who has power. De-prioritize funding rounds and valuations unless the money itself changes the game.`;
  const categoryLabels: Record<string, string> = { "ai-branding": "AI and strategic branding", "ai-ecommerce": "AI and ecommerce", "a16z-portfolio": "a16z AI portfolio startup" };
  const categoryLabel = categoryLabels[CATEGORY] || "AI";

  // Query for top 10
  log("Querying for top 10 stories...");
  const rankPrompt = `Based on all sources in this notebook, rank the top 10 most important ${categoryLabel} stories. For each story output EXACTLY in this format:

---STORY 1---
TITLE: [short headline, max 10 words]
WHY: [one sentence about what this CHANGES]

---STORY 2---
TITLE: ...
(continue through STORY 10)

${categoryFocus}

IMPORTANT: Do NOT include citation numbers, source names, URLs, or references. Just clean headlines and one-sentence explanations.`;

  const rankOutput = await runNLM(["notebook", "query", notebookId, rankPrompt], 120000);
  const stories = parseStoryList(rankOutput);
  log(`Parsed ${stories.length} stories`);

  // Generate depths
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    log(`Generating depths for story ${i + 1}/${stories.length}: "${story.title}"`);
    const depthPrompt = `For the story "${story.title}", produce three depth versions. Output EXACTLY in this format:

---SUMMARY---
(One sentence, max 20 words. What changed and why it matters — not dollar amounts.)

---CONDENSED---
(2-3 sentences. What's new, what it changes, who it affects. No filler.)

---EXPANDED---
Write in the style of Richard Feynman — clear, provocative, no jargon without explanation. Use this exact structure with bold markdown headers:

**WHAT'S GOING ON**
(Plain English. What happened. No throat-clearing. Start with the concrete fact.)

**WHY THIS IS A BIG DEAL**
(Context. What led here. The numbers that matter. Why anyone outside the industry should care.)

**UNCOMFORTABLE TRUTH**
(The thing nobody wants to say. The real friction, the hidden cost, the part that makes people squirm.)

**SO WHAT**
(One sentence. The punchline. What changes tomorrow.)

Total 300-500 words. No fabricated facts. No corporate speak.

IMPORTANT: Do NOT include citation numbers like [1], [2], [3] anywhere. Write clean, readable prose only.`;

    let depthOutput: string;
    try {
      depthOutput = await runNLM(["notebook", "query", notebookId, depthPrompt], 180000);
    } catch {
      log(`Retry depth for story ${i + 1}...`);
      await sleep(5000);
      depthOutput = await runNLM(["notebook", "query", notebookId, depthPrompt], 180000);
    }
    const depths = parseDepthResponse(depthOutput);
    const standard = `${depths.condensed}\n\n**Why it matters:** ${story.why_it_matters}`;
    story.sections = [{ id: `s${i + 1}-1`, title: "Main Story", summary: depths.summary, condensed: depths.condensed, standard, expanded: depths.expanded }];
  }

  // Save JSON
  const output: FeedOutput = { date: today, generated_at: new Date().toISOString(), notebook_id: notebookId, sources_found: 0, stories };
  for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const jsonData = JSON.stringify(output, null, 2);
    fs.writeFileSync(path.join(dir, `${today}.json`), jsonData);
    fs.writeFileSync(path.join(dir, "latest.json"), jsonData);
    log(`Saved to: ${dir}`);
  }

  // Supabase upsert
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (supabaseUrl && supabaseKey) {
    log("Saving to Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const rows = stories.map(s => ({
      date: today, category: CATEGORY, story_rank: s.rank, title: s.title,
      source: s.source, source_url: s.source_url, why_it_matters: s.why_it_matters,
      summary: s.sections[0]?.summary || "", condensed: s.sections[0]?.condensed || "",
      standard: s.sections[0]?.standard || "", expanded: s.sections[0]?.expanded || "",
    }));
    const { error } = await supabase.from("nubble_feed").upsert(rows, { onConflict: "date,category,story_rank" });
    if (error) log(`Supabase error: ${error.message}`, "supabase");
    else log(`Saved ${rows.length} stories to Supabase`, "supabase");
  }

  // Podcast
  try {
    log("Configuring chat tone...");
    const feynmanPrompt = `You are two friends who are deeply curious about technology — like Richard Feynman having coffee with a sharp journalist. Explain things in plain English, be provocative when something doesn't add up, never use marketing jargon. Keep it conversational, interrupt each other, disagree when you see it differently.`;
    await runNLM(["chat", "configure", notebookId, "-g", "custom", "--prompt", feynmanPrompt], 30000);
    log("Creating audio podcast...");
    await runNLM(["audio", "create", notebookId, "-f", "debate", "-l", "short", "-y"], 120000);
    await pollArtifactReady(notebookId, "audio", 15 * 60 * 1000);
    const podcastDir = path.join(DATA_DIR_PUBLIC, "podcasts");
    if (!fs.existsSync(podcastDir)) fs.mkdirSync(podcastDir, { recursive: true });
    const m4aPath = path.join(podcastDir, `${today}_raw.m4a`);
    const wavPath = path.join(podcastDir, `${today}_raw.wav`);
    const audioFilename = `${today}.mp3`;
    const audioPath = path.join(podcastDir, audioFilename);
    await runNLM(["download", "audio", notebookId, "-o", m4aPath, "--no-progress"], 120000);
    await exec("ffmpeg", ["-i", m4aPath, "-ac", "1", "-ar", "44100", wavPath, "-y"], { timeout: 60000 });
    const LAME_PATH = process.env.LAME_PATH || path.join(process.env.HOME || "/root", ".local/bin/lame");
    const lamePaths = [LAME_PATH, "/tmp/lame-install/bin/lame", "/usr/local/bin/lame", "lame"];
    let lameUsed = false;
    for (const lame of lamePaths) {
      try { await exec(lame, ["--preset", "voice", wavPath, audioPath], { timeout: 60000 }); lameUsed = true; break; } catch { continue; }
    }
    if (!lameUsed) {
      await exec("ffmpeg", ["-i", m4aPath, "-codec:a", "aac", "-b:a", "64k", "-ac", "1", audioPath.replace(".mp3", ".m4a"), "-y"], { timeout: 60000 });
    }
    if (fs.existsSync(m4aPath)) fs.unlinkSync(m4aPath);
    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    output.audioUrl = `/data/feed/${CATEGORY}/podcasts/${audioFilename}`;
    for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
      fs.writeFileSync(path.join(dir, `${today}.json`), JSON.stringify(output, null, 2));
      fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(output, null, 2));
    }
    log(`Audio saved: ${output.audioUrl}`);
  } catch (e: any) { log(`Podcast failed: ${e.message}`, "podcast"); }

  // Infographics
  for (const orientation of ["landscape", "portrait"] as const) {
    try {
      log(`Creating ${orientation} infographic...`);
      await runNLM(["infographic", "create", notebookId, "--style", "bricks", "-o", orientation, "-d", "concise", "-y"], 120000);
      await pollArtifactReady(notebookId, "infographic", 15 * 60 * 1000);
      const suffix = orientation === "landscape" ? "_landscape" : "";
      for (const dir of [DATA_DIR_PUBLIC, DATA_DIR_SERVER]) {
        const infDir = path.join(dir, "infographics");
        if (!fs.existsSync(infDir)) fs.mkdirSync(infDir, { recursive: true });
        const pngPath = path.join(infDir, `${today}${suffix}.png`);
        const jpgPath = path.join(infDir, `${today}${suffix}.jpg`);
        await runNLM(["download", "infographic", notebookId, "-o", pngPath, "--no-progress"], 120000);
        await exec("sips", ["-Z", "1400", pngPath, "-s", "format", "jpeg", "-s", "formatOptions", "75", "--out", jpgPath], { timeout: 30000 });
        fs.unlinkSync(pngPath);
      }
      if (orientation === "landscape") {
        output.infographicUrl = `/data/feed/${CATEGORY}/infographics/${today}_landscape.jpg`;
        for (const dir of [DATA_DIR_SERVER, DATA_DIR_PUBLIC]) {
          fs.writeFileSync(path.join(dir, `${today}.json`), JSON.stringify(output, null, 2));
          fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(output, null, 2));
        }
        log(`Infographic saved: ${output.infographicUrl}`);
      }
    } catch (e: any) { log(`${orientation} infographic failed: ${e.message}`, "infographic"); }
  }

  log(`Done! ${stories.length} stories for ${CATEGORY}`);
}

function parseStoryList(raw: string) {
  const stories: FeedStory[] = [];
  const blocks = raw.split(/---STORY\s+\d+---/i).filter(b => b.trim());
  for (let i = 0; i < blocks.length && i < 10; i++) {
    const block = blocks[i];
    const rawTitle = block.match(/TITLE:\s*(.+)/i)?.[1]?.trim() || `Story ${i + 1}`;
    const title = cleanText(rawTitle.split(/\\n/)[0]);
    const rawWhy = block.match(/WHY:\s*(.+)/i)?.[1]?.trim() || "";
    const why = cleanText(rawWhy.split(/\\n/)[0]);
    stories.push({ id: `s${i + 1}`, rank: i + 1, title, source: "nubble", source_url: "unknown", why_it_matters: why, sections: [] });
  }
  return stories;
}

function parseDepthResponse(raw: string) {
  const summaryMatch = raw.match(/---SUMMARY---\s*([\s\S]*?)(?=---CONDENSED---|$)/);
  const condensedMatch = raw.match(/---CONDENSED---\s*([\s\S]*?)(?=---EXPANDED---|$)/);
  const expandedMatch = raw.match(/---EXPANDED---\s*([\s\S]*?)$/);
  return {
    summary: cleanText(summaryMatch?.[1] || "Summary unavailable."),
    condensed: cleanText(condensedMatch?.[1] || "Details unavailable."),
    expanded: cleanText(expandedMatch?.[1] || "Full analysis unavailable."),
  };
}

run().catch(e => { log(`Failed: ${e.message}`, "error"); process.exit(1); });
