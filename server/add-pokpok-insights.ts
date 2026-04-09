/**
 * Add pokpok.ai-specific insights to existing feed JSON
 *
 * Reads the NLM-generated feed and rewrites the expanded (depth 3) content
 * to include "HOW THIS HITS POKPOK.AI" section via Seed 2.0 Pro.
 *
 * Usage: npx tsx server/add-pokpok-insights.ts
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: "https://ark.ap-southeast.bytepluses.com/api/v3",
  apiKey: process.env.ARK_API_KEY || "b0ec377d-6dad-4e52-b51e-b5cd46d854cd",
});

const POKPOK_CONTEXT = `pokpok.ai — The House M.D. for Digital Commerce Brands.
We X-ray your brand across every channel you sell on. By diagnosing positioning fractures in your category, reviews, and pages, we tell you exactly what to rebuild and how.

Products:
- X-RAY: Single PDP scanner — AI analyzes an Amazon listing, diagnoses brand positioning issues (HI score, perception markers, competitive gaps)
- POKPOK Index: Monthly category intelligence — tracks brand positioning movements across entire Amazon categories

Target: Digital commerce brands, Amazon sellers, brand managers, DTC brands
Tech: Supabase, Framer, n8n, ScrapingBee, Claude API
Stage: Pre-seed, 2 co-founders, Warsaw
Revenue: On-demand reports ($150/scan) + monthly Index subscription
Competitors: Jungle Scout, Helium 10, Brandwatch — pokpok diagnoses positioning fractures, not keywords/sales`;

interface Story {
  id: string;
  rank: number;
  title: string;
  sections: { expanded: string; standard: string; condensed: string; summary: string; [key: string]: string }[];
  [key: string]: any;
}

async function addInsights(story: Story, index: number, total: number): Promise<Story> {
  const expanded = story.sections[0]?.expanded || "";
  const title = story.title;

  console.log(`  [${index + 1}/${total}] ${title}`);

  const prompt = `You are a strategic analyst writing for the founders of pokpok.ai.

${POKPOK_CONTEXT}

Here is a news story the pokpok.ai team is reading:

TITLE: ${title}
CONTENT: ${expanded}

Rewrite the EXPANDED content to include pokpok.ai-specific strategic analysis. Keep the original analysis but add a pokpok.ai section at the end.

Output the rewritten expanded text (plain text, not JSON). Structure:

${expanded.includes("**WHAT'S GOING ON**") ? "" : "**WHAT'S GOING ON**\n(keep original content)\n\n**WHY THIS IS A BIG DEAL**\n(keep original content)\n\n"}**UNCOMFORTABLE TRUTH**
(keep or improve original content)

**HOW THIS HITS POKPOK.AI**
(Specific impact on pokpok.ai's X-RAY scanner, POKPOK Index, customer acquisition, competitive moat, tech stack, or fundraising narrative. Be concrete — name their products, their customers, their competitors. 150-200 words.)

**MOVES TO CONSIDER**
(2-3 specific actions pokpok.ai should take. Not generic advice — reference their actual tools, tech, and market position.)

**THE RISK OF SITTING THIS OUT**
(What Jungle Scout, Helium 10, or new entrants gain if pokpok ignores this. 1-2 sentences.)

Write in Feynman style: clear, direct, no corporate speak.`;

  try {
    const response = await client.chat.completions.create({
      model: "seed-2-0-pro-260328",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const newExpanded = response.choices[0]?.message?.content || expanded;

    // Update the story
    const updated = { ...story };
    updated.sections = story.sections.map((s) => ({
      ...s,
      expanded: newExpanded,
    }));
    return updated;
  } catch (err: any) {
    console.log(`    Error: ${err.message} — keeping original`);
    return story;
  }
}

async function main() {
  const feedPath = path.join(process.cwd(), "client/public/data/feed/pokpok-personalized/latest.json");
  const data = JSON.parse(fs.readFileSync(feedPath, "utf-8"));

  console.log(`Adding pokpok.ai insights to ${data.stories.length} stories...\n`);

  const start = Date.now();
  const updatedStories: Story[] = [];

  for (let i = 0; i < data.stories.length; i++) {
    const updated = await addInsights(data.stories[i], i, data.stories.length);
    updatedStories.push(updated);
  }

  data.stories = updatedStories;
  data.persona = "pokpok.ai";
  data.persona_description = "The House M.D. for Digital Commerce Brands";

  // Save
  const datePath = path.join(process.cwd(), "client/public/data/feed/pokpok-personalized", `${data.date}.json`);
  fs.writeFileSync(feedPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(datePath, JSON.stringify(data, null, 2));

  // Server backup
  const serverDir = path.join(process.cwd(), "server/data/feed/pokpok-personalized");
  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
  fs.writeFileSync(path.join(serverDir, "latest.json"), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(serverDir, `${data.date}.json`), JSON.stringify(data, null, 2));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. Saved to ${feedPath}`);
}

main().catch(console.error);
