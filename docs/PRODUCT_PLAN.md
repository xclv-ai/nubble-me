# Nubble Product Plan

## Vision

Nubble is a reading app that gives readers control over content depth — from a one-line summary to a full deep dive — per section, in real time. It works on any long-form content: books, articles, PDFs, newsletters.

---

## Target Users

### Primary: Busy knowledge workers
- Reads 10+ articles/week
- Often skims because depth is all-or-nothing
- Wants to go deep on some sections, skim others
- Uses Pocket, Instapaper, or just browser tabs

### Secondary: Students
- Reading textbooks and papers
- Needs summary for review, depth for understanding
- Highlights + depth notes for studying

### Tertiary: Power readers / book lovers
- Reading 2-4 books per month
- Wants to re-read at different depths (first pass: condensed; deep pass: expanded)
- ePub library import

---

## Core Value Proposition

> "Read any book or article at exactly the depth you want, section by section."

Unlike summarization apps (which give you one output), Nubble gives you **live, per-section depth control**. You're always reading — just at different zoom levels.

---

## Competitive Landscape

| App | What it does | Gap Nubble fills |
|-----|-------------|------------------|
| Blinkist | Whole-book summaries | No per-section control; can't read the full book |
| Readwise Reader | Read-later + highlights | No depth control |
| Instapaper | Read-later | No depth control |
| Speechify | Text-to-speech | Audio only; no depth |
| Apple Books | ePub reader | No depth control |
| Kindle | ePub/MOBI reader | No depth control |
| ChatGPT | Summarize anything | Not a reading interface |

**Nubble's unique position:** A *reading interface* (not a summarizer) with depth as a first-class control.

---

## Phases

### Phase 1: Web Prototype (current)
**Goal:** Validate the core interaction pattern.

- [x] Single hardcoded article ("The Lean Startup")
- [x] 4 depth levels per section
- [x] Swipe left/right gesture
- [x] Global + per-section depth
- [x] Keyboard shortcuts
- [x] Dark mode
- [x] Reading time estimate
- [x] Depth indicator UI
- [ ] User testing with 20+ people
- [ ] Shareable link to specific section+depth

**Success metric:** 70% of testers say they'd use this for real reading.

---

### Phase 2: iOS MVP
**Goal:** Real app, real content, TestFlight.

**Core features:**
- Paste any URL → nubbled article in < 30s
- Share sheet extension (share from Safari)
- On-device depth generation (iOS 26 / Foundation Models)
- SwiftUI reader (identical gestures to web prototype)
- Local-only storage (no account required)
- Onboarding flow

**Not in MVP:**
- ePub/PDF support
- CloudKit sync
- Social features
- Highlights

**Success metric:** 50 TestFlight users, 40% use it 3+ times in week 1.

---

### Phase 3: ePub + PDF
**Goal:** Full book reading.

**Features:**
- ePub import (Files app, share sheet)
- PDF import
- Chapter/section navigation
- Bookmarks + reading position sync
- CloudKit sync across devices
- .nubble file format (shareable nubbled documents)

**Success metric:** 3+ books imported per active user per month.

---

### Phase 4: App Store Launch
**Goal:** Public release, first revenue.

**Features:**
- Polished onboarding
- Freemium model (see below)
- App Store listing + ASO
- Press / launch
- Pocket / Instapaper import
- RSS feed support

**Success metric:** 1,000 downloads in first month, 5% conversion to paid.

---

### Phase 5: Growth
**Goal:** Retention and word-of-mouth.

**Features:**
- Highlights + notes (synced to Readwise)
- "Reading DNA" — your depth profile across all content
- Shared nubbles (send a nubbled article to a friend)
- Web app (parity with iOS)
- Android

---

## Business Model

### Freemium

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 10 nubbles/month, URL only |
| Reader | $4.99/month | Unlimited nubbles, ePub/PDF, sync |
| Power | $9.99/month | Everything + highlights export, API access |

### Why freemium works here:
- Low friction to try (free tier is genuinely useful)
- Natural upgrade trigger: hit 10 nubble limit
- Power users have clear reasons to pay ($9.99)

---

## Key Metrics

### Acquisition
- Downloads / week
- Source breakdown (organic, referral, paid)

### Activation
- % who nubble their first article within 24h of install
- % who nubble 3+ articles in first week

### Retention
- D7, D30 retention
- Weekly active readers (WAR)
- Articles nubbled per WAR per week

### Revenue
- Free → paid conversion rate (target: 5%)
- MRR, ARPU
- Churn rate

### Engagement
- Average depth changes per reading session
- % of sessions using per-section depth (vs. global only)
- Time in app per session

---

## Open Questions

1. **Depth generation cost**: On-device AI (free, private) vs. cloud (cost per document). iOS 26 Foundation Models resolve this for modern devices — what's the fallback strategy for older devices?

2. **Content rights**: Nubble doesn't redistribute content — it transforms how *you* read content you already have. But does expanding content (depth 3) create a derivative work? Legal review needed before launch.

3. **Onboarding depth**: How much do we explain the concept before letting users try it? Current hypothesis: show the gesture, let them feel it immediately.

4. **Social vs. solo**: Is sharing nubbled content a growth lever or a distraction for v1? Lean toward solo-first, social later.

5. **Monetization timing**: Introduce paywall at Phase 4 (public launch) or earlier (Phase 3, ePub)? Earlier monetization = signal on willingness to pay; later = more users to convert.

6. **Export**: Should nubbled content be exportable as markdown/PDF? Who would use this? (Students, researchers.)

7. **Sharing metric**: Do users want to share .nubble files? (target: > 5% of documents shared)
