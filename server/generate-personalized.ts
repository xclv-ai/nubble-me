/**
 * Generate personalized feed for pokpok.ai
 *
 * Reads all 4 latest.json feeds, sends to Seed 2.0 Pro for curation,
 * saves result as client/public/data/feed/pokpok-personalized/latest.json
 *
 * Usage: npx tsx server/generate-personalized.ts
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: "https://ark.ap-southeast.bytepluses.com/api/v3",
  apiKey: process.env.ARK_API_KEY || "b0ec377d-6dad-4e52-b51e-b5cd46d854cd",
});

const POKPOK_CONTEXT = `ABOUT POKPOK.AI:
pokpok.ai — The House M.D. for Digital Commerce Brands.
We X-ray your brand across every channel you sell on. By diagnosing positioning fractures in your category, reviews, and pages, we tell you exactly what to rebuild and how.

Products:
- X-RAY: Single PDP (product detail page) scanner — AI analyzes an Amazon listing and diagnoses brand positioning issues (HI score, perception markers, competitive gaps)
- POKPOK Index: Monthly category intelligence briefing — tracks brand positioning movements across entire Amazon categories

Target audience: Digital commerce brands, Amazon sellers, brand managers, DTC brands selling on Amazon
Tech stack: Supabase, Framer, n8n workflow automation, ScrapingBee for data collection, Claude API for AI analysis
Stage: Pre-seed startup, 2 co-founders, Warsaw-based
Revenue model: On-demand reports ($150/scan) + monthly subscription for Index
Competitors: Jungle Scout, Helium 10, Brandwatch — but pokpok diagnoses brand *positioning fractures*, not keywords or sales data
Key differentiator: pokpok treats brand problems like a doctor treats patients — diagnosis before treatment, data-driven prescriptions`;

async function main() {
  // Load all 4 feeds
  const categories = ["ai-news", "ai-branding", "ai-ecommerce", "a16z-portfolio"];
  const allStories: any[] = [];
  let feedDate = "";

  for (const cat of categories) {
    const filePath = path.join(process.cwd(), "client/public/data/feed", cat, "latest.json");
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${cat}: no latest.json`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!feedDate) feedDate = data.date;
    for (const s of data.stories) {
      allStories.push({
        id: `${cat}-${s.id}`,
        title: s.title,
        expanded: s.sections[0]?.expanded || "",
        why: s.why_it_matters || "",
        category: cat,
      });
    }
  }

  console.log(`Loaded ${allStories.length} stories from ${categories.length} categories (date: ${feedDate})`);

  // Build prompt
  const storyList = allStories
    .map((s, i) => `${i + 1}. [${s.category}] "${s.title}"\n   WHY: ${s.why}\n   CONTENT: ${s.expanded.substring(0, 600)}...`)
    .join("\n\n");

  const prompt = `You are a personalized news curator and analyst.

${POKPOK_CONTEXT}

HERE ARE ${allStories.length} AI STORIES FROM THIS WEEK:

${storyList}

YOUR TASK:
1. Select the 8-10 stories MOST RELEVANT to pokpok.ai's business — stories that affect their product, customers, competitive landscape, tech stack, fundraising prospects, or strategic direction.
2. For each selected story, rewrite ALL content through pokpok.ai's specific lens.

OUTPUT FORMAT — respond with a JSON array (no markdown, no backticks, just raw JSON):
[
  {
    "original_index": 1,
    "title": "original title unchanged",
    "summary": "1 sentence — why pokpok.ai specifically should care about this",
    "condensed": "2-3 sentences — the pokpok-specific angle. How does this connect to brand perception analysis, Amazon seller tools, or their competitive position?",
    "standard": "Full paragraph — context + direct relevance to pokpok.ai. Connect to their products (X-RAY, Index), their customers (Amazon brands), or their tech (Supabase, Claude, ScrapingBee). End with a bold **Why pokpok.ai should care:** line.",
    "expanded": "Deep dive — 300-500 words, Feynman-clear writing style. Structure:\\n\\n**WHAT'S GOING ON**\\n(plain English)\\n\\n**WHY THIS IS A BIG DEAL**\\n(context)\\n\\n**HOW THIS HITS POKPOK.AI**\\n(specific impact on their product roadmap, customer acquisition, competitive moat, tech stack, or fundraising narrative — be concrete, name their products and features)\\n\\n**MOVES TO CONSIDER**\\n(2-3 specific actions pokpok.ai should take in response)\\n\\n**THE RISK OF SITTING THIS OUT**\\n(what competitors gain if pokpok ignores this)"
  }
]

CRITICAL RULES:
- Select ONLY stories that have genuine strategic relevance to pokpok.ai. "Interesting" is not enough.
- Every depth level must mention pokpok.ai, their products, or their specific situation.
- The expanded level must include concrete, actionable insights — not generic advice.
- Write in Feynman style: clear, direct, no corporate speak, no hedging.
- Output ONLY valid JSON. No markdown wrapping, no explanation text.`;

  console.log("Calling Seed 2.0 Pro...");
  const start = Date.now();

  const response = await client.chat.completions.create({
    model: "seed-2-0-pro-260328",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const latency = Date.now() - start;
  const text = response.choices[0]?.message?.content || "";
  console.log(`LLM responded in ${(latency / 1000).toFixed(1)}s (${text.length} chars)`);

  // Parse JSON
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const personalizedStories = JSON.parse(cleaned);
  console.log(`Selected ${personalizedStories.length} stories`);

  // Build output in FeedResponse format
  const output = {
    date: feedDate,
    generated_at: new Date().toISOString(),
    persona: "pokpok.ai",
    persona_description: "The House M.D. for Digital Commerce Brands",
    stories: personalizedStories.map((ps: any, i: number) => {
      const origIndex = (ps.original_index || i + 1) - 1;
      const orig = allStories[origIndex] || allStories[0];
      return {
        id: `pp-${i + 1}`,
        rank: i + 1,
        title: ps.title || orig.title,
        source: "pokpok.ai personalized",
        source_url: "unknown",
        why_it_matters: ps.summary,
        original_category: orig.category,
        sections: [
          {
            id: `pp-${i + 1}-1`,
            title: "Main Story",
            summary: ps.summary,
            condensed: ps.condensed,
            standard: ps.standard,
            expanded: ps.expanded,
          },
        ],
      };
    }),
  };

  // Save
  const outDir = path.join(process.cwd(), "client/public/data/feed/pokpok-personalized");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "latest.json");
  const datePath = path.join(outDir, `${feedDate}.json`);

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  fs.writeFileSync(datePath, JSON.stringify(output, null, 2));

  // Also save to server/data
  const serverDir = path.join(process.cwd(), "server/data/feed/pokpok-personalized");
  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
  fs.writeFileSync(path.join(serverDir, "latest.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(serverDir, `${feedDate}.json`), JSON.stringify(output, null, 2));

  console.log(`\nSaved to:\n  ${outPath}\n  ${datePath}`);
  console.log(`\n${output.stories.length} personalized stories ready.`);
  for (const s of output.stories) {
    console.log(`  ${s.rank}. [${s.original_category}] ${s.title}`);
  }
}

main().catch(console.error);
