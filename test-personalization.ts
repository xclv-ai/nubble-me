/**
 * Test: Personalization quality via BytePlus ModelArk (OpenAI-compatible)
 *
 * Tests:
 * 1. CURATION — send 30 story titles + startup profile → which stories matter?
 * 2. DEPTH 3 PERSONALIZATION — for relevant stories, generate "What This Means For Your Startup"
 *
 * 3 startup profiles × real feed data
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  baseURL: "https://ark.ap-southeast.bytepluses.com/api/v3",
  apiKey: "b0ec377d-6dad-4e52-b51e-b5cd46d854cd",
});

const MODEL = "seed-2-0-pro-260328";

// --- 3 Test Startup Profiles ---

const PROFILES = [
  {
    name: "Profile A: AI DevTools Startup",
    description: `We're building an AI-powered code review tool for engineering teams.
We use Claude and GPT-4o APIs for code analysis. Series A stage, 15 employees.
Target customers: mid-market SaaS companies with 20-100 engineers.
Competitors: CodeRabbit, Sourcery, GitHub Copilot code review.
Tech stack: TypeScript, React, VS Code extension, MCP integrations.`,
  },
  {
    name: "Profile B: DTC Ecommerce Brand",
    description: `We sell premium organic skincare products direct-to-consumer.
$3M ARR, 8 employees. Sell on Shopify + TikTok Shop + Amazon.
Heavily reliant on AI-generated product photography and UGC video ads.
Competitors: Glossier, Drunk Elephant, The Ordinary.
Biggest challenge: rising ad costs and algorithm changes on TikTok/Meta.`,
  },
  {
    name: "Profile C: AI Consulting Agency",
    description: `We're a 12-person agency helping Fortune 500 companies adopt AI.
Services: AI strategy, model selection, workflow automation, training.
Clients: financial services, healthcare, manufacturing.
Revenue: $2M/year, growing 3x.
We white-label Claude and GPT-4 into custom enterprise solutions.
Competitors: Bain AI practice, McKinsey QuantumBlack, Accenture AI.`,
  },
];

// --- Load all stories from all categories ---

function loadStories() {
  const stories: any[] = [];
  const categories = ["ai-news", "ai-branding", "ai-ecommerce"];

  for (const cat of categories) {
    const filePath = path.join(process.cwd(), "server/data/feed", cat, "latest.json");
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    for (const s of data.stories) {
      stories.push({
        title: s.title,
        rank: s.rank,
        category: cat,
        expanded: s.sections[0]?.expanded || "",
        why: s.why_it_matters || "",
      });
    }
  }
  return stories;
}

// --- Test 1: Curation ---

async function testCuration(stories: any[], profile: typeof PROFILES[0]) {
  const storyList = stories.map((s, i) => `${i + 1}. [${s.category}] ${s.title}`).join("\n");

  const prompt = `You are a personalized news curator for an AI startup intelligence product.

USER'S BUSINESS:
${profile.description}

HERE ARE THIS WEEK'S ${stories.length} AI STORIES:
${storyList}

TASK: Select ONLY the stories that are directly relevant to this specific business. Not "interesting to read" — relevant to their operations, strategy, customers, or competitive position.

For each selected story, output exactly:
PICK: [number]. [title]
WHY: [one sentence — why this specific business should care]

Select 5-10 stories maximum. Be ruthless — if it doesn't affect their business, skip it.`;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`CURATION TEST: ${profile.name}`);
  console.log(`${"=".repeat(70)}`);

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  const latency = Date.now() - start;
  const text = response.choices[0]?.message?.content || "";

  console.log(`Latency: ${latency}ms`);
  console.log(text);

  // Extract picked story numbers
  const picks = [...text.matchAll(/PICK:\s*(\d+)/g)].map(m => parseInt(m[1]) - 1);
  return { picks, latency, text };
}

// --- Test 2: Depth 3 Personalization ---

async function testPersonalization(story: any, profile: typeof PROFILES[0]) {
  const prompt = `You are writing personalized strategic intelligence for a startup founder.

THE READER'S BUSINESS:
${profile.description}

NEWS STORY THEY'RE READING:
Title: ${story.title}
${story.expanded}

Write a section called "What This Means For Your Startup" that goes BELOW the story above. Match the Feynman-clear writing style — direct, specific, no corporate speak.

**HOW THIS HITS YOUR BUSINESS**
(Specific impact on THIS startup's product, customers, market position, fundraising, or tech stack. Not generic industry talk — speak directly to what they do.)

**MOVES TO CONSIDER**
(2-3 concrete, specific actions. Name tools, competitors, or strategies relevant to their situation.)

**THE RISK OF SITTING THIS OUT**
(What competitors gain if they ignore this. Be specific.)

200-300 words. No filler. No disclaimers. Write like a sharp advisor who knows their business.`;

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });
  const latency = Date.now() - start;
  const text = response.choices[0]?.message?.content || "";
  const words = text.split(/\s+/).length;

  console.log(`\n--- ${story.title} × ${profile.name} ---`);
  console.log(`Latency: ${latency}ms | Words: ${words}`);
  console.log(text);
  console.log();

  return { latency, words, text };
}

// --- Main ---

async function main() {
  const stories = loadStories();
  console.log(`Loaded ${stories.length} stories across categories\n`);

  // First, test if API works with a simple call
  console.log("Testing API connectivity...");
  try {
    const test = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Say 'OK' if you can read this." }],
      max_tokens: 10,
    });
    console.log(`API OK: ${test.choices[0]?.message?.content}\n`);
  } catch (err: any) {
    console.error(`API FAILED: ${err.message}`);
    console.error(`Status: ${err.status}, Body: ${JSON.stringify(err.error || {})}`);

    // Try listing models or different model name
    console.log("\nTrying alternative model names...");
    for (const m of ["seed-2-0-pro-260328", "seed-2-0-lite-260228", "doubao-1-5-pro-256k-250115", "doubao-pro-32k", "doubao-lite-32k"]) {
      try {
        const t = await client.chat.completions.create({
          model: m,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        });
        console.log(`  Model "${m}" works: ${t.choices[0]?.message?.content}`);
      } catch (e: any) {
        console.log(`  Model "${m}" failed: ${e.status || e.message}`);
      }
    }
    return;
  }

  const allResults: any = { curation: [], personalization: [] };

  // Test curation for all 3 profiles
  for (const profile of PROFILES) {
    try {
      const { picks, latency } = await testCuration(stories, profile);
      allResults.curation.push({ profile: profile.name, picks: picks.length, latency });

      // Test depth 3 personalization on first 2 picked stories
      const pickedStories = picks.slice(0, 2).map(i => stories[i]).filter(Boolean);
      for (const story of pickedStories) {
        const result = await testPersonalization(story, profile);
        allResults.personalization.push({
          profile: profile.name,
          story: story.title,
          latency: result.latency,
          words: result.words,
        });
      }
    } catch (err: any) {
      console.error(`Error for ${profile.name}: ${err.message}`);
    }
  }

  // Summary
  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(70)}`);
  console.log("\nCuration:");
  for (const r of allResults.curation) {
    console.log(`  ${r.profile}: ${r.picks} stories picked, ${r.latency}ms`);
  }
  console.log("\nPersonalization:");
  for (const r of allResults.personalization) {
    console.log(`  ${r.profile} × "${r.story}": ${r.words} words, ${r.latency}ms`);
  }

  if (allResults.curation.length > 0) {
    const avgCuration = Math.round(allResults.curation.reduce((a: number, r: any) => a + r.latency, 0) / allResults.curation.length);
    console.log(`\nAvg curation latency: ${avgCuration}ms`);
  }
  if (allResults.personalization.length > 0) {
    const avgPersonal = Math.round(allResults.personalization.reduce((a: number, r: any) => a + r.latency, 0) / allResults.personalization.length);
    const avgWords = Math.round(allResults.personalization.reduce((a: number, r: any) => a + r.words, 0) / allResults.personalization.length);
    console.log(`Avg personalization latency: ${avgPersonal}ms`);
    console.log(`Avg personalization words: ${avgWords}`);
  }
}

main().catch(console.error);
