/**
 * Personalized feed API — MVP demo for pokpok.ai
 *
 * POST /api/personalize-feed
 * Takes 40 stories from all 4 categories, uses Seed 2.0 Pro to
 * select 8-10 relevant stories and rewrite all depth levels
 * through pokpok.ai's lens.
 */

import type { Express } from "express";
import OpenAI from "openai";
import { log } from "./index";

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

interface StoryInput {
  id: string;
  title: string;
  expanded: string;
  why: string;
}

interface PersonalizedStory {
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

export function registerPersonalizeRoutes(app: Express): void {
  const client = new OpenAI({
    baseURL: "https://ark.ap-southeast.bytepluses.com/api/v3",
    apiKey: process.env.ARK_API_KEY || "",
  });

  app.post("/api/personalize-feed", async (req, res) => {
    const { stories } = req.body as { stories: StoryInput[] };

    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return res.status(400).json({ error: "stories array required" });
    }

    if (!process.env.ARK_API_KEY) {
      return res.status(500).json({ error: "ARK_API_KEY not configured" });
    }

    log(`Personalizing ${stories.length} stories for pokpok.ai...`, "personalize");

    const storyList = stories
      .map((s, i) => `${i + 1}. "${s.title}"\n   WHY IT MATTERS: ${s.why}\n   FULL STORY: ${s.expanded.substring(0, 600)}...`)
      .join("\n\n");

    const prompt = `You are a personalized news curator and analyst.

${POKPOK_CONTEXT}

HERE ARE ${stories.length} AI STORIES FROM THIS WEEK:

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

    try {
      const start = Date.now();
      const response = await client.chat.completions.create({
        model: "seed-2-0-pro-260328",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const latency = Date.now() - start;
      const text = response.choices[0]?.message?.content || "";
      log(`LLM responded in ${latency}ms (${text.length} chars)`, "personalize");

      // Parse JSON from response — handle possible markdown wrapping
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const personalizedStories: any[] = JSON.parse(cleaned);

      // Map back to FeedStory format
      const result: PersonalizedStory[] = personalizedStories.map((ps, i) => {
        const origIndex = (ps.original_index || i + 1) - 1;
        const orig = stories[origIndex] || stories[0];
        return {
          id: orig.id,
          rank: i + 1,
          title: ps.title || orig.title,
          source: "pokpok.ai personalized",
          source_url: "unknown",
          why_it_matters: ps.summary || orig.why,
          sections: [
            {
              id: `${orig.id}-1`,
              title: "Main Story",
              summary: ps.summary,
              condensed: ps.condensed,
              standard: ps.standard,
              expanded: ps.expanded,
            },
          ],
        };
      });

      log(`Returned ${result.length} personalized stories`, "personalize");
      res.json({ stories: result, latency_ms: latency });
    } catch (err: any) {
      log(`Personalization error: ${err.message}`, "personalize");
      res.status(500).json({ error: err.message });
    }
  });
}
