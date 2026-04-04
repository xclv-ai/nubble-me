/**
 * Test: Gemini personalization quality against real feed data
 *
 * Tests:
 * 1. CURATION — send 30 story titles + startup profile → which stories matter?
 * 2. DEPTH 3 PERSONALIZATION — for relevant stories, generate "What This Means For Your Startup"
 *
 * 3 startup profiles × real feed data
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const API_KEY = "AIzaSyCrGgTq9QKWzZOINWXBxspy5o2dAhj8ng0";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

function loadStories(): { title: string; rank: number; category: string; expanded: string; why: string }[] {
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

HERE ARE THIS WEEK'S 30 AI STORIES:
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
  const result = await model.generateContent(prompt);
  const latency = Date.now() - start;
  const text = result.response.text();

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
  const result = await model.generateContent(prompt);
  const latency = Date.now() - start;
  const text = result.response.text();
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

  const allResults: any = { curation: [], personalization: [] };

  // Test curation for all 3 profiles
  for (const profile of PROFILES) {
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

  const avgCuration = Math.round(allResults.curation.reduce((a: number, r: any) => a + r.latency, 0) / allResults.curation.length);
  const avgPersonal = Math.round(allResults.personalization.reduce((a: number, r: any) => a + r.latency, 0) / allResults.personalization.length);
  console.log(`\nAvg curation latency: ${avgCuration}ms`);
  console.log(`Avg personalization latency: ${avgPersonal}ms`);
  console.log(`Avg personalization words: ${Math.round(allResults.personalization.reduce((a: number, r: any) => a + r.words, 0) / allResults.personalization.length)}`);
}

main().catch(console.error);
