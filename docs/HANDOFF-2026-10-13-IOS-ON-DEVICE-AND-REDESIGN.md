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

## Update 2026-10-13 evening — design APPROVED and built natively
Owner (Fable session): target = neurodivergent AI-startup founders ("no patience · infographic not text · red alert when competitors post · clear WHAT TO DO"). Approved direction: **Dr HAOS's daily rounds** in POKPOK's own design system, Dr HAOS as the arrogant-with-receipts hero ("YES this is excellent direction"). Strategy: `docs/STRATEGY-2026-10-13-NEURODIVERGENT-FOUNDERS.md`; mockup `docs/redesign/proto/haos.html` → `docs/redesign/dr-haos-rounds-mockup.png`.
Built natively (commit fbf3eab, v1.2.0 (3)): `ios/Nubble/Design/Pok.swift` (tokens, Notch shape, squares, tickers, mascot), `ios/Nubble/Views/Rounds/{RoundsView,RoundsFlow,DepthSheet}.swift` (Rounds · Signal/Code red · Why? with 5 depths · Discharged), watchlist (Settings) + prescriptions (`Models/Prescription.swift`), Dr HAOS lines written on-device after the levels (`NewsDepthWriter.punchLines/haosLines`, stored on `ContentSection.headline/action/verdict/rx`). Fonts bundled: Instrument Serif, JetBrains Mono; mascot `Assets.xcassets/DrHaos.imageset` (SVG).
Installed on the owner's iPhone; not yet seen running (phone locked at every attempt 19:55–20:04). Release archive at `/tmp/claude-501/archive/Nubble.xcarchive` (Apple Development signing; export for App Store re-signs). TestFlight upload waits for the owner's word. Not built: Lock Screen widget, Reminders sync, competitor sources beyond name-matching the feed.

### 20:00–20:25 — verified on the iPhone, self-improving loop
Seen running on the owner's iPhone (captures via `devicectl device capture screenshot`, debug launch args `-flow`, `-flow -why`, `-flow -page 3`): Rounds, Signal, Why? (5 depth tabs), Discharged — all in the POKPOK system. Fixed from the captures: page pushed off-screen (LazyVGrid `.flexible()` 10 pt minimum × 44 columns; ▲ run as one word), footer under the tab bar (pinned with safeAreaInset + 56 pt when the bar is not in the safe area), double top inset, truncated headlines (`SerifLine` fixedSize), hero number taken from an author bio year (now summary+condensed only, money/%/magnitude words only), verdict clamped to 2 sentences/26 words, repeated leads/sentences removed in the Why? sheet.
Added: Lock Screen/Home widget `NubbleWidget` (next ℞ + code-red mark via App Group file `rounds-widget.json`), Reminders list "Dr HAOS ℞" (EventKit, asked once), hype-word rewrite guard in `haosLines`, ℞ must name a product, ranking High = "must act this week", `NewsDepthWriter.version` (=2) forces rewrites of older documents.
Known model limits (on-device 3B): verdicts/℞ still generic on weak stories ("Invest in AI to improve vibe-coding…"); ranking lets non-pokpok stories in as High. Remedy = Apple's larger PCC model (iOS 27 + entitlement) or a server step for the 3 daily lines.
Release archive rebuilt at `/tmp/claude-501/archive/Nubble.xcarchive` (1.2.0 (3), with NubbleShare + NubbleWidget). TestFlight upload: owner's word.

### 20:25–20:40 — the words
Rewrites verified on the phone: headlines now ≤7 words ("Google Play now allows private vibe-coded apps."), hero number from the distillation ($42M), Why? sheet without repeats. Still weak (on-device 3B): verdicts generic ("…is a wake-up call"), ℞ named a fake product ("V5.3.4 Version" scraped from the page ticker) → fixed by filtering product names; ranking still admits off-target stories (a security startup's raise) → "level — reason" answer, High kept only when the reason shares a word with the product description (ranker v3 re-scores all). Debug `-dump` writes the rounds' words to Documents/rounds.json.

### 20:40–20:52 — the market gate
Dump of the rounds (`phone.sh dump`) showed the top signal was an on-device LLM story (Hugging Face) — the 3B ranker calls 35/166 stories High. Fix at the deciding step: the product's **market** (two of the source topics: commerce, marketing, ai-news, ai-research, ai-releases) is decided once per profile (`ProductProfile.marketTopics`, model call + heuristic) and the rounds read it: code red → in-market → relevance → date. Result on the phone: Lowe's media network, Lowe's Black Friday, Ross stores — in market, with ℞ naming real products ("…using the Category Perception Report"). Product names cleaned (`cleanProductNames`: no release notes, not the company). Writer v3. Sample lines removed from prompts (the model copied "Pitch a holiday gift box…").
Still true: verdicts are generic on a 3B model ("They didn't see the inevitable rise of AI-driven competitors"); relevance=High is coarse (Ross opening stores). Remedy unchanged: Apple PCC model / server step for the three daily lines.
Loop script: `ios/scripts/phone.sh build|install|open [-flow|-flow -why|-flow -page 3|-dump]|shot <name>|dump|all`.

### Open decision (asked 20:55): the words
Why the on-device lines stay weak: the step that writes them is Apple's ~3B on-device model (4,096-token window). Tonight, with voice rules, examples and guards, it still wrote "game-changer" (twice), "wake-up call", copied a sample line verbatim, invented a product ("V5.3.4 Version"), rated 35/166 stories High. Guards can only subtract sludge; they cannot add the strategic reasoning (Lowe's media network → retail media → pokpok's clients → the move). Proposal: hybrid — levels/ranking/product on-device (free, offline), the 3 daily Dr HAOS lines + the final pick by a frontier model (reuse LiteLLM/GPT-6 Luna on AWS from Dr HAOS, or Claude), ~$0.01–0.05/user/day; Apple PCC later (iOS 27 + entitlement); on-device lines stay as the offline fallback.

## Next (owner leads the design)
1. Owner designs the screens; implement his design natively (SwiftUI + Metal), Geist bundled.
2. Writer: lead and support as two separate requests (stop the spill/repeat); shorter leads.
3. Prepare the Private Cloud Compute access request (needs iOS 27 on the phone).
4. Release build without the self-test → owner's word → TestFlight.
