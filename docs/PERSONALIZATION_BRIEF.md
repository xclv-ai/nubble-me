# Personalized News Curation — Dispatch Brief

## What We're Building

nubble.me gets personalized news: users describe their startup, see only relevant stories from a pool of 25-30, with business-specific strategic insights at depth 3.

## Architecture (Two Engines)

```
NLM (weekly, $0, slow)          Gemini/BytePlus (on-demand, ~$0, fast)
├── Deep research 150+ sources   ├── Curation: pick 6-8 stories from 30
├── Rank top 25-30 stories       ├── Depth 3: "What This Means For Your Startup"
├── Generate 4 depth levels      │   ~250 words, streamed in 2-3s
└── Save as static JSON          └── Cache in Supabase
```

**NLM does research. LLM API does personalization. Clean separation.**

## Strategic Decisions Made

- **One feed, not four.** Merge ai-news/branding/ecommerce/a16z into one "AI Startup Intelligence" pool of 25-30 stories. Pipeline drops from ~48min to ~25min.
- **Target audience:** AI startup founders/operators (pre-Series B).
- **Identity:** Supabase Anonymous Auth (zero friction) → optional email upgrade for retention.
- **Irrelevant stories hidden, not dimmed.** User sees only 6-8 stories that hit their business.
- **Depth 3 personalized section** appended below existing expanded content. Full Feynman-style writeup, not a one-liner.

## Depth 3 Output Structure

```
[Existing NLM content — ~400 words]
**WHAT'S GOING ON**
**WHY THIS IS A BIG DEAL**
**UNCOMFORTABLE TRUTH**
**SO WHAT**

── What This Means For Your Startup ──
[Streamed from LLM API — ~250 words]
**HOW THIS HITS YOUR BUSINESS**
**MOVES TO CONSIDER**
**THE RISK OF SITTING THIS OUT**
```

## User Journey

```
First visit:
1. See full feed (no gate)              0s
2. Tap "Personalize" → describe startup 10s
3. Feed filters to 6-8 relevant stories 1-2s (1 LLM call)
4. Swipe to depth 3                     2-3s (streamed LLM call, then cached)

Returning: 0s everywhere (cached)
Monday: new feed auto-generated, personalization on first depth-3 swipe
```

## Costs

| | 10 users | 100 users | 1000 users |
|---|---|---|---|
| NLM pipeline | $0 | $0 | $0 |
| LLM personalization | $0 | ~$1/wk | ~$6/wk |
| Supabase | $0 | $0 | $25/mo |

## Build Order (5 phases)

### Phase 1: Merge feeds → one pool
- Modify NLM pipeline research query to broad "AI startup landscape"
- Generate 25-30 stories instead of 10
- Save to `server/data/feed/ai-startups/latest.json`
- Update homepage to single feed

### Phase 2: User profile + onboarding
- Supabase Anonymous Auth + `user_profiles` table
- New `/onboard` page: URL paste (extract meta tags) OR text description
- Profile stored: `business_description`, `industry`, `keywords[]`
- localStorage mirror for resilience

### Phase 3: Curation API
- `POST /api/personalize/curate` — send 30 titles + profile → LLM returns ranked relevant subset
- Client filters feed to show only relevant stories
- Cache curation result per `(profile_hash, feed_date)`

### Phase 4: Depth 3 personalization
- `GET /api/personalize/insight/:storyId` — send expanded text + profile → LLM streams insight
- New `<PersonalizedInsight>` component in NubbleReader
- SSE streaming for progressive text render
- Cache in Supabase `personalized_insights` table

### Phase 5: Retention loop
- Email capture prompt after 2nd visit
- Monday 7AM email: top 3 headlines + "Read your personalized briefing →"
- Resend free tier (3000 emails/mo)

## Key Files to Modify

| File | Change |
|---|---|
| `server/feed-pipeline.ts` | Broad research query, 25-30 stories |
| `shared/schema.ts` | Add `user_profiles`, `personalized_insights` tables |
| `server/routes.ts` | Add `/api/personalize/*` routes |
| NEW `server/personalization.ts` | LLM client (OpenAI-compatible), cache logic |
| NEW `client/src/pages/onboard.tsx` | Profile setup page |
| NEW `client/src/components/PersonalizedInsight.tsx` | Depth 3 insight component (~150 lines) |
| `client/src/components/NubbleReader.tsx` | Render `<PersonalizedInsight>` at depth 3 |
| `client/src/pages/home.tsx` | Single feed, curation filter |
| `client/src/App.tsx` | Add `/onboard`, `/my-feed` routes |

## LLM API Config

```
Base URL: https://ark.ap-southeast.bytepluses.com/api/v3
API Key: env.ARK_API_KEY
Model: seed-2-0-pro-260328
Format: OpenAI-compatible (chat.completions.create)
```

## Validation Needed FIRST

**Run `npx tsx test-personalization.ts` locally** to validate:
1. Does the model pick different stories for different businesses?
2. Are personalized insights specific enough to feel like strategy, not filler?
3. What's the actual latency?

If quality is bad → try different model or adjust prompts before building UI.

## Monetization Path

- Phase 1: Free (validate retention — do users return 4 Mondays?)
- Phase 2: Freemium $12/mo (depths 0-2 free, depth 3 + personalization = Pro)
- Phase 3: Team plans $25/seat/mo

## Risks

| Risk | Mitigation |
|---|---|
| LLM insights too generic | Test prompts first. Require structured profile (not freeform). |
| LLM API down | Graceful fallback: show generic depth 3 content |
| No retention without email | Phase 5 is critical — build email loop early |
| Broad NLM research → worse stories | Test one broad vs current 4 narrow queries, compare |
