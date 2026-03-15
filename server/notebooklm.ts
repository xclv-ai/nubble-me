/**
 * NotebookLM integration via nlm CLI.
 * Uploads documents, generates summarized/expanded versions, retrieves results.
 * Falls back to algorithmic depths if nlm is not available or authenticated.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { log } from "./index";

const exec = promisify(execFile);

const NLM_PATH = process.env.NLM_PATH || path.join(process.env.HOME || "/root", "go/bin/nlm");

interface NLMResult {
  notebookId: string;
  sourceId: string;
  summary: string;
  condensed: string;
  expanded: string;
}

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

/** Parse notebook ID from nlm create output */
function parseNotebookId(output: string): string {
  // nlm create typically outputs something like "Created notebook: <id>"
  const match = output.match(/([a-zA-Z0-9_-]{10,})/);
  if (!match) throw new Error(`Could not parse notebook ID from: ${output}`);
  return match[1];
}

/** Parse source ID from nlm add output */
function parseSourceId(output: string): string {
  const match = output.match(/([a-zA-Z0-9_-]{10,})/);
  if (!match) throw new Error(`Could not parse source ID from: ${output}`);
  return match[1];
}

/**
 * Full NotebookLM pipeline:
 * 1. Create notebook
 * 2. Upload file as source
 * 3. Generate summary (depth 0 + 1)
 * 4. Generate expansion (depth 3)
 * 5. Retrieve results
 * 6. Cleanup notebook
 */
export async function processWithNotebookLM(
  filePath: string,
  title: string
): Promise<{ summary: string; expanded: string } | null> {
  let notebookId: string | null = null;

  try {
    // 1. Create notebook
    log(`Creating notebook for: ${title}`, "nlm");
    const createOutput = await runNLM(["create", `Nubble: ${title}`]);
    notebookId = parseNotebookId(createOutput);
    log(`Created notebook: ${notebookId}`, "nlm");

    // 2. Upload file as source
    log(`Uploading file: ${filePath}`, "nlm");
    const addOutput = await runNLM(["add", notebookId, filePath], 120000);
    const sourceId = parseSourceId(addOutput);
    log(`Added source: ${sourceId}`, "nlm");

    // Wait a moment for NotebookLM to index the source
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Generate summary
    log("Generating summary...", "nlm");
    const summary = await runNLM(["summarize", notebookId, sourceId], 120000);

    // 4. Generate expansion
    log("Generating expansion...", "nlm");
    const expanded = await runNLM(["expand", notebookId, sourceId], 120000);

    log("NotebookLM processing complete", "nlm");

    return { summary, expanded };
  } catch (err: any) {
    log(`NotebookLM pipeline failed: ${err.message}`, "nlm");
    return null;
  } finally {
    // Cleanup: delete the notebook
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

/**
 * Generate per-section depths using NotebookLM chat.
 * Sends custom prompts for each chunk to get targeted summaries.
 */
export async function generateDepthsWithNLM(
  notebookId: string,
  sectionText: string,
  type: "summary" | "condensed" | "expanded"
): Promise<string | null> {
  const prompts: Record<string, string> = {
    summary: `Summarize the following section in exactly one sentence (max 20 words). Capture the single most important idea:\n\n${sectionText}`,
    condensed: `Condense the following section to 2-3 sentences. Keep only the key points, drop examples and qualifications:\n\n${sectionText}`,
    expanded: `Expand the following section with concrete examples for each key point, brief explanations of why each point matters, and relevant context. Add 50-100% more content while keeping the same structure:\n\n${sectionText}`,
  };

  try {
    const result = await runNLM(
      ["generate-chat", notebookId, prompts[type]],
      60000
    );
    return result || null;
  } catch {
    return null;
  }
}
