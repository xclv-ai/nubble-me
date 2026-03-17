/**
 * Express routes for serving AI news feed data.
 * Reads JSON files from server/data/feed/ directory.
 */

import type { Express } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { log } from "./index";

const DATA_DIR = path.join(process.cwd(), "server/data/feed");

/** Ensure the feed data directory exists */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Get sorted list of available feed date files (newest first) */
function getAvailableDates(): string[] {
  ensureDataDir();
  return fs
    .readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort()
    .reverse();
}

/** Read a feed JSON file by date */
function readFeed(date: string): object | null {
  const filePath = path.join(DATA_DIR, `${date}.json`);
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
  // GET /api/feed — latest feed
  app.get("/api/feed", (_req, res) => {
    const dates = getAvailableDates();
    if (dates.length === 0) {
      return res.status(404).json({ error: "No feed data available" });
    }
    const feed = readFeed(dates[0]);
    if (!feed) {
      return res.status(500).json({ error: "Failed to read feed data" });
    }
    res.json(feed);
  });

  // GET /api/feed/dates — list available dates
  app.get("/api/feed/dates", (_req, res) => {
    const dates = getAvailableDates();
    res.json({ dates });
  });

  // GET /api/feed/:date — feed for specific date
  app.get("/api/feed/:date", (req, res) => {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    const feed = readFeed(date);
    if (!feed) {
      return res.status(404).json({ error: `No feed data for ${date}` });
    }
    res.json(feed);
  });

  // POST /api/feed/generate — trigger feed generation
  app.post("/api/feed/generate", (_req, res) => {
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
