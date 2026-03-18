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
}

async function runPipeline(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let notebookId: string | null = null;

  try {
    // 1. Create notebook
    const notebookNames: Record<string, string> = { "ai-news": "AI News", "ai-branding": "AI Branding", "ai-ecommerce": "AI Ecommerce" };
    const notebookName = `${notebookNames[CATEGORY] || CATEGORY} - ${today}`;
    log(`Creating notebook: "${notebookName}" (category: ${CATEGORY})`);
    const createOutput = await runNLM(["notebook", "create", notebookName]);
    notebookId = parseUUID(createOutput, "notebook");
    log(`Notebook created: ${notebookId}`);

    // 2. Start deep research
    const defaultQueries: Record<string, string> = {
      "ai-branding": "AI adoption at major branding agencies WPP Landor FutureBrand Interbrand Superunion, AI tools for brand strategists and marketers, M&A in branding and creative industry, new AI marketing tools announcements this week",
      "ai-ecommerce": "AI transforming ecommerce, DTC brands using AI, Amazon AI tools for sellers, Shopify AI features, AI product photography, AI pricing optimization, AI personalization for online retail, AI supply chain ecommerce this week",
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
      statusOutput = await runNLM(["research", "status", notebookId], 30000);
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
    const importOutput = await runNLM(["research", "import", notebookId, taskId], 120000);
    const sourcesFound = parseNumber(importOutput);
    log(`Imported sources (${sourcesFound} found)`);

    // Wait for indexing
    await sleep(10000);

    // 5. Query for top 10 stories
    log("Querying for top 10 stories...");
    const focusPrompts: Record<string, string> = {
      "ai-branding": `Focus on: how large branding agencies (WPP, Landor, FutureBrand, Interbrand, Superunion, Siegel+Gale, Wolff Olins, Pentagram) are adopting AI in their daily work. Include M&A moves in the creative/branding industry, new AI tools specifically useful for brand strategists and marketers, and shifts in how brands are built with AI. De-prioritize pure tech stories unless they directly impact branding work.`,
      "ai-ecommerce": `Focus on: how AI is transforming ecommerce operations — new AI tools for Amazon sellers, Shopify merchants, DTC brands. Include AI product photography, listing optimization, pricing intelligence, personalization engines, supply chain AI, and conversational commerce. Prioritize stories that change how ecommerce teams work daily. De-prioritize pure tech stories unless they directly impact online retail.`,
    };
    const categoryFocus = focusPrompts[CATEGORY] || `Focus on: what's genuinely NEW and how it changes something — new capabilities, new limitations exposed, new ways people will work or build, shifts in who has power. De-prioritize funding rounds and valuations unless the money itself changes the game. Prioritize stories where something actually shifted — not just announcements.`;

    const categoryLabels: Record<string, string> = {
      "ai-branding": "AI and strategic branding",
      "ai-ecommerce": "AI and ecommerce",
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

${categoryFocus}`;

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

Total 300-500 words. No fabricated facts. No corporate speak.`;

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

    // 8. Cleanup notebook
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

function parseStoryList(raw: string): FeedStory[] {
  const stories: FeedStory[] = [];
  const storyBlocks = raw.split(/---STORY\s+\d+---/i).filter(b => b.trim());

  for (let i = 0; i < storyBlocks.length && i < 10; i++) {
    const block = storyBlocks[i];
    const title = block.match(/TITLE:\s*(.+)/i)?.[1]?.trim() || `Story ${i + 1}`;
    const source = block.match(/SOURCE:\s*(.+)/i)?.[1]?.trim() || "Unknown";
    const url = block.match(/URL:\s*(.+)/i)?.[1]?.trim() || "unknown";
    const why = block.match(/WHY:\s*(.+)/i)?.[1]?.trim() || "";

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

  const summary = summaryMatch?.[1]?.trim() || "Summary unavailable.";
  const condensed = condensedMatch?.[1]?.trim() || "Details unavailable.";
  const expanded = expandedMatch?.[1]?.trim() || "Full analysis unavailable.";

  return { summary, condensed, expanded };
}

// ---------- main ----------

runPipeline().catch(err => {
  log(`Pipeline failed: ${err.message}`, "error");
  process.exit(1);
});
