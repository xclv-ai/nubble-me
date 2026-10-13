# Handoff — Nubble iOS: on-device AI + redesign attempt (2026-10-12 → 13)

## Owner's goal (his words)
"App should load relevant news, generate all levels of depth and one of level is answering HOW THIS IS RELEVANT TO my product."
"The main value of app is actionable news consuming — you are not reading news, you see the reinterpretation of news as signals: everything that will help you with your product."
No paid API for depth generation (Apple Foundation Models on the iPhone).

## Owner's verdict on the design work (2026-10-13)
"It is still very weak. You are failing. So I need to design." The owner designs from here. Earlier, verbatim: "all of them looks like from 90x", "unreadable text, boring choice of typography, no style no fun just the most generic ever", "this gradient is purely ai slop. no style no theme no idea behind", "effect is distracting", "placing text in small circle on screen for depth increased? really?", "text not structured correctly".
Liked: lens / optical distortion as a direction ("direction is promising"). Typeface: Geist (Vercel). Wants keywords/facts highlighted and an illustration per story (QuiverAI Arrow 2 — placeholder only for now, "do not burn tokens").

## What works (proved on iPhone 15 Pro, iOS 26.6.2, UDID 00008130-000603680CDB803A)
- News read on the phone from 15 RSS sources (13/15 answer; VentureBeat HTTP 429), ~130 stories / 14 days. Settings → Sources: add by site address, switch, delete.
- Apple Intelligence on-device writes every level, no paid API. Product described from its URL (pokpok.ai → "Brand Positioning X-Ray… Brand Alignment Truth… €150 per report"), 6.7 s.
- Ranking: one story per request, high/medium/low, greedy sampling — 131 stories in ~42–57 s; ~9 High, most relevant (Prime Day, try-on, retail tech), some noise.
- Story levels ~40–110 s each. POKPOK.AI tab first, signal under each card (relevance + first move), written while the app is open; charging-time background writing + notification; Share → Nubble extension.
- Writer now produces scannable blocks: **bold lead** + ≤2 sentences; WHAT TO DO = 3 verb-first bullets; plus a ≤7-word headline and ≤10-word action per story (1–3 s each).

## What does not work
- Model quality (Apple's ~3B on-device model): WHAT TO DO invents ("partnership with Stratix"), leads often generic ("Retail is evolving rapidly."), length limits often ignored (5-line "lead"), support repeats the lead. The real fix is Apple's larger Private Cloud Compute model (iOS 27, 32K context, needs Apple's managed entitlement — request not yet prepared).
- Design: every proposal rejected (3 directions, 10 screens, gradient prototype, red-pen idea, lens prototype). The app on the phone still has the old card UI + a "depth scan" fold transition + gyroscope tilt (MotionTilt) — the owner calls it weak/distracting.
- Apple Intelligence needed iPhone language = Siri language (set English (US)).

## Where things are
- iOS app: `ios/` (xcodegen: `cd ios && xcodegen generate`). Build/install: `xcodebuild -project Nubble.xcodeproj -scheme Nubble -destination 'generic/platform=iOS' -derivedDataPath /tmp/claude-501/nubble-dd -allowProvisioningUpdates build` then `xcrun devicectl device install app --device <UDID> …/Nubble.app`. Version 1.1.0 (2). NOT uploaded to TestFlight.
- On-device writer: `ios/Nubble/Services/NewsDepthWriter.swift` (plain-text requests with `permissiveContentTransformations` — the default filter refused news; text sized by Apple's `tokenCount`). Ranking: `RelevanceRanker.swift`. Feed: `LocalFeedService.swift`, `RSSParser.swift`.
- Debug self-test (DEBUG builds only): launch with `-- -selftest https://pokpok.ai [-story <url>|none]` → `Documents/selftest.json`; `-- -punch [-rewrite]` → `Documents/punch.json` (copy off with `devicectl device copy from --domain-type appDataContainer --domain-identifier me.nubble.app`).
- Research: `docs/REDESIGN-RESEARCH-2026-10-13.md` (references, Apple rules, benchmark: old app 17/40), `docs/EFFECTS-RESEARCH-2026-10-13.md` (Metal/TextRenderer techniques).
- Prototypes (rejected, kept for reference): `docs/redesign/proto/lens.html` (WebGL lens, Geist, real phone stories in `signals.js`), `index.html` (gradient), `art.html`; renders in `docs/redesign/`. Serve: `cd docs/redesign/proto && python3 -m http.server 8765`.
- Fonts downloaded (Geist Sans/Mono/Pixel woff2) in `docs/redesign/proto/fonts/`.

## Next (owner leads the design)
1. Owner designs the screens; implement his design natively (SwiftUI + Metal), Geist bundled.
2. Writer: lead and support as two separate requests (stop the spill/repeat); shorter leads.
3. Prepare the Private Cloud Compute access request (needs iOS 27 on the phone).
4. Release build without the self-test → owner's word → TestFlight.
