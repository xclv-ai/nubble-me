---
name: nubble
description: "Load BEFORE any work on Nubble (nubble.me web or the iOS app in ~/dev/nubble-me/ios): concept, UX, UI, mockups, prototypes, images, the on-device/cloud writing chain, TestFlight. Holds the owner's concept in his words, the questions that must be answered before design, and every failure so far (references/failures.md)."
---

# Nubble — read this before touching anything

## The concept, in the owner's words (2026-10-12 → 10-14)
- "The main value of the app is **actionable news consuming** — you are not reading news, you see the **reinterpretation of news as signals**: everything that will help you with **your product**."
- Target: **neurodivergent AI-startup founders**. "We don't have patience. We want **infographic instead of reading long text**. We want to see a **red alert when competitors posted something important**. We want **clear signals WHAT TO DO** with this news."
- Nubble's core interaction: **two axes** — scroll vertically through items, **swipe left/right to change depth** of the same item (repo CLAUDE.md). Never replace the swipe with buttons.
- Personality: **Dr HAOS**, POKPOK's character, "main hero, a bit arrogant", "sarcasm of Rick and Morty, a bit roasting". Colours: POKPOK (teal / pink / yellow / beige), "Dr HAOS colours, not full POKPOK identity".
- Feel: "engaging, like a game", "memorable", "magical for strange AI founders, quirky but ultra quality"; 3D low-poly with real light; **gyroscope tilts objects and moves shadows**.
- Controls: "all buttons physical objects, unconventionally, all connected with **open wires** — **transparent functionality**"; "a bit absurd, provocative, but meaningful".
- Visual style: POKPOK's measured creative direction in `~/dev/pokpok-ai/marketing/pokpok-cd` (painted / linocut; material + colour + specific creative metaphors; **not flat**). Not the mascot folder.
- Readability: "headlines (summary) large and readable", "make elements large", big contrast between headline and text sizes (his first prototype).
- Money: "I don't want to spend money on this experiment now — cost-efficient options". Hybrid writing chain approved (on-device Apple model + `openai/gpt-5.4-nano` via Vercel AI Gateway, cents a day).

## Order of work (owner, 2026-10-13: "redo app, not rush")
1. Understand the concept → answer the open questions with the owner (`references/open-questions.md`).
2. UX plan (flows, screens, states, exits) → owner approves.
3. Tappable HTML mockup on his phone's browser (free) → owner tests.
4. Only then Swift. TestFlight only on his word.

## Before every deliverable — check against
- `references/consumer-profile.md` — who the app is for and their needs, ranked.
- `references/failures.md` — every failure on this project, with the rule it cost.
- `docs/redo/01-BEST-PRACTICES-2026-10-13.md` §E — the 25-line per-screen checklist.
- One question: **does this screen show the news as an infographic with facts and one action, readable in 5 seconds?** If it shows paragraphs first, it is wrong.

## Paid calls
Seedream / Arrow 2 / Firecrawl / ScrapingBee / any model run: one line (what, how many, the supplier's price) and **wait for his go in this conversation**, every time. "Show me a draft" is never a go to render.

## Where things are
- iOS: `ios/` (xcodegen `project.yml`, loop `ios/scripts/phone.sh`, device iPhone 15 Pro `00008130-000603680CDB803A`). Gateway key: `ios/scripts/secrets.sh` → gitignored `Secrets.swift`, owner's device only.
- Mockups: `docs/redesign/proto/` (current: `desk.html`, served by `python3 -m http.server 8771 --bind 0.0.0.0`, phone opens `http://<mac-ip>:8771/desk.html`).
- Research: `docs/redo/01` best practices, `02` 3D stack, `03` creative direction. Handoff: `docs/HANDOFF-2026-10-13-IOS-ON-DEVICE-AND-REDESIGN.md`.

## What worked (owner: "yes much better!", 2026-10-14 22:05 Warsaw)
- **Copy a reference the owner gave, element by element, and compare side by side before showing.** The Luce instrument cluster (his photos in `docs/redesign/proto/ref-luce/`) → `docs/redesign/proto/gauge3d.html`.
- **Real 3D in Three.js 0.169:** Poly Haven studio HDRI (CC0) for reflections; turned bezel profile built as separate lathe segments (crisp chamfers, matte graphite); dial printed on a canvas texture; needle as a bevelled extrusion with a soft shadow; glass = reflection-only layer (additive, no transmission — transmission broke under tilt); diagonal glare = large masked sheet that slides.
- **Seen straight on:** long-lens camera far away (fov ≈ 11°); tilt turns the reflected studio + slides the glare + shifts the key light; the panel and gauges turn together (max ≈ 2°).
- **Interaction:** tap = needle falls to 0 from wherever it is, then sweeps to the score with the number counting and haptic clicks every 10.
- **On the phone in one step:** the debug in-app viewer `-proto <file>` loads pages bundled in `ios/ProtoBundle/` (custom scheme, no LAN/HTTPS); tilt fed from native CoreMotion (`window.__tilt`), haptics via `window.webkit.messageHandlers.haptic`. Loop: edit both copies (docs + ProtoBundle) → `scripts/phone.sh build && install` → `devicectl … launch … -- -proto gauge3d.html` → `phone.sh shot`.
