/**
 * NotebookLM integration via nlm CLI.
 * Uploads the full document, then uses generate-chat per section to produce
 * all depth levels (summary, condensed, expanded). Standard = original text.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { log } from "./index";
import type { RawChunk, ChunkedSection } from "./chunking";

const exec = promisify(execFile);

const NLM_PATH = process.env.NLM_PATH || path.join(process.env.HOME || "/root", "go/bin/nlm");

/** Check if nlm CLI is available and authenticated */
export async function isNLMAvailable(): Promise<boolean> {
  try {
    await exec(NLM_PATH, ["list"], { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/** Run nlm command and capture stdout */
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

/** Parse an ID (notebook or source) from nlm output */
function parseId(output: string, label: string): string {
  const match = output.match(/([a-zA-Z0-9_-]{10,})/);
  if (!match) throw new Error(`Could not parse ${label} ID from: ${output}`);
  return match[1];
}

/**
 * Full pipeline: upload file → create notebook → generate all depths per section.
 *
 * For each chunk we send a targeted prompt via generate-chat that asks the LLM
 * to produce the summary (~20 words), condensed (2-3 sentences), and expanded
 * (+50-100% content) versions. Standard = original chunk text.
 */
export async function generateDepths(
  filePath: string,
  title: string,
  chunks: RawChunk[],
): Promise<ChunkedSection[]> {
  let notebookId: string | null = null;

  try {
    // 1. Create notebook + upload file so NLM has full document context
    log(`Creating notebook for: ${title}`, "nlm");
    const createOutput = await runNLM(["create", `Nubble: ${title}`]);
    notebookId = parseId(createOutput, "notebook");
    log(`Created notebook: ${notebookId}`, "nlm");

    log(`Uploading file: ${filePath}`, "nlm");
    const addOutput = await runNLM(["add", notebookId, filePath], 120000);
    const sourceId = parseId(addOutput, "source");
    log(`Added source: ${sourceId}`, "nlm");

    // Wait for NotebookLM to index
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Generate depths for each section
    log(`Generating depths for ${chunks.length} sections...`, "nlm");
    const sections: ChunkedSection[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      log(`  Section ${i + 1}/${chunks.length}: "${chunk.title}"`, "nlm");

      const prompt = buildDepthPrompt(chunk.body);
      const raw = await runNLM(["generate-chat", notebookId, prompt], 90000);
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
        await runNLM(["rm", notebookId]);
        log(`Cleaned up notebook: ${notebookId}`, "nlm");
      } catch {
        log(`Failed to cleanup notebook: ${notebookId}`, "nlm");
      }
    }
  }
}

/** Build a single prompt that asks for all three depth levels at once */
function buildDepthPrompt(sectionText: string): string {
  return `Given the following section of text, produce three versions at different depth levels. Output EXACTLY in this format with the markers on their own lines:

---SUMMARY---
(One sentence, max 20 words. Capture the single most important idea. Do not lose the core meaning.)

---CONDENSED---
(2-3 sentences. Keep only the key points and essential meaning. Drop examples and qualifications but preserve the argument.)

---EXPANDED---
(Expand with concrete examples, brief explanations of why each point matters, and relevant context. Add 50-100% more content while keeping the same logical structure. Do not fabricate facts — elaborate on what is stated or clearly implied.)

Here is the section:

${sectionText}`;
}

/** Parse the structured response from the LLM */
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
