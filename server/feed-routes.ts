/**
 * Express routes for serving AI news feed data.
 * Reads JSON files from server/data/feed/ directory.
 */

import type { Express } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { log } from "./index";

const DATA_BASE = path.join(process.cwd(), "server/data/feed");
const VALID_CATEGORIES = ["ai-news", "ai-branding", "ai-ecommerce", "a16z-portfolio"];

/** Resolve data directory for a category */
function dataDir(category: string): string {
  const cat = VALID_CATEGORIES.includes(category) ? category : "ai-news";
  return path.join(DATA_BASE, cat);
}

/** Ensure the feed data directory exists */
function ensureDataDir(category: string): void {
  const dir = dataDir(category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Get sorted list of available feed date files (newest first) */
function getAvailableDates(category: string = "ai-news"): string[] {
  ensureDataDir(category);
  return fs
    .readdirSync(dataDir(category))
    .filter(f => f.endsWith(".json") && f !== "latest.json" && f !== "dates.json")
    .map(f => f.replace(".json", ""))
    .sort()
    .reverse();
}

/** Read a feed JSON file by date */
function readFeed(date: string, category: string = "ai-news"): object | null {
  const filePath = path.join(dataDir(category), `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// Track running generation process
let generationInProgress = false;

export function registerFeedRoutes(app: Express): void {
  // GET /api/nubble-feed — latest feed (NLM-powered daily feed)
  // Query param ?category=ai-news|ai-branding (default: ai-news)
  app.get("/api/nubble-feed", (req, res) => {
    const category = (req.query.category as string) || "ai-news";
    const dates = getAvailableDates(category);
    if (dates.length === 0) {
      return res.status(404).json({ error: "No feed data available" });
    }
    const feed = readFeed(dates[0], category);
    if (!feed) {
      return res.status(500).json({ error: "Failed to read feed data" });
    }
    res.json(feed);
  });

  // GET /api/nubble-feed/dates — list available dates
  app.get("/api/nubble-feed/dates", (req, res) => {
    const category = (req.query.category as string) || "ai-news";
    const dates = getAvailableDates(category);
    res.json({ dates });
  });

  // GET /api/nubble-feed/:date — feed for specific date
  app.get("/api/nubble-feed/:date", (req, res) => {
    const { date } = req.params;
    const category = (req.query.category as string) || "ai-news";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    const feed = readFeed(date, category);
    if (!feed) {
      return res.status(404).json({ error: `No feed data for ${date}` });
    }
    res.json(feed);
  });

  // POST /api/nubble-feed/generate — trigger feed generation
  app.post("/api/nubble-feed/generate", (_req, res) => {
    if (generationInProgress) {
      return res.status(409).json({ error: "Feed generation already in progress" });
    }

    generationInProgress = true;
    log("Starting feed generation pipeline...", "feed");

    const child = spawn("npx", ["tsx", "server/feed-pipeline.ts"], {
      cwd: process.cwd(),
      stdio: "pipe",
      detached: false,
    });

    child.stdout.on("data", (data: Buffer) => {
      log(data.toString().trim(), "feed-pipeline");
    });

    child.stderr.on("data", (data: Buffer) => {
      log(`stderr: ${data.toString().trim()}`, "feed-pipeline");
    });

    child.on("close", (code) => {
      generationInProgress = false;
      if (code === 0) {
        log("Feed generation completed successfully", "feed");
      } else {
        log(`Feed generation exited with code ${code}`, "feed");
      }
    });

    child.on("error", (err) => {
      generationInProgress = false;
      log(`Feed generation error: ${err.message}`, "feed");
    });

    res.json({
      status: "started",
      message: "Feed generation pipeline started. Check /api/feed/dates for completion.",
    });
  });
}
