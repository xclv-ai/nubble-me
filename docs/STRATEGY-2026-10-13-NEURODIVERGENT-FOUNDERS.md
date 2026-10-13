# Nubble for neurodivergent AI-startup founders — strategy, 2026-10-13

Owner's brief (verbatim): "we dont have patience · we want infographic instead of reading long text · we want to see red alert when competitors posted something important (competitive feature) · we want clear signals WHAT TO DO with this news."

Owner, after the first mockup: "approach is in correct direction but ui is super generic and boring" → "i want personality of our pokpok DR HAOS … DR HAOS should be main hero and a bit arrogant."

**Current mockup: `docs/redesign/dr-haos-rounds-mockup.png`** (live page `docs/redesign/proto/haos.html`; serve with `python3 -m http.server 8765` from `proto/`). Earlier rejected attempts kept for reference: `nd.html` (generic dark), `tremor.html` (seismograph, not shown).

## 0. The hero: Dr HAOS does the rounds
The app is Dr HAOS's daily rounds for one patient — the founder's company. He read the 130 stories; the founder gets three. Every screen is in his voice (POKPOK tone of voice: Symptom → Diagnosis → Evidence → Hard choice → Cure; brutal but with receipts; dark humour; "Don't agree. Diagnose."). Arrogance is anchored: "I told you in March they'd try. Receipts below." — never empty swagger.
Visual system = POKPOK design system, unchanged: colour rhythm (teal authority → beige evidence → pink confrontation → yellow interrupt, hard cuts, no gradients), Instrument Serif for feeling (headlines, numbers, his lines; one italic word = the significance), JetBrains Mono for proof (labels, evidence, lists), 4px corner notch on tags and buttons, the square as the data asset (one square = one unit), terminal tickers (`[+] … [x]`, `01 // THE SCAN`, `℞`), the Dr HAOS cat (design-system/foundations/mascot). Code red = `--pok-critical` and is used for competitors only.
Screens: A Rounds (patient chart + scan list) · B Code red (uncomfortable truth → evidence → ℞) · C Signal (hero number + square infographic + his verdict → ℞) · D Discharged (prescriptions receipt, weekly vitals in squares, Lock Screen).
Sources read for this: `pokpok-ai/knowledge/Reference/pokpok-tone-of-voice.md`, `DR HAOS/HAOS.md`, `design-system/foundations/{color,typography,motion,mascot}`, `design-system/voice/vocabulary.md`, `marketing/…/mascot-design-spec.md`, and pokpok.ai live.

## 1. The thesis
Nubble stops being a news reader with depth levels and becomes **a daily 90-second brief that ends**: three signals, each a picture and one move, plus a red card whenever a watched competitor moves. The product's unit is not the article and not the summary — it is **the move**. Done-ness is the reward.

Why this fits the target (ADHD/autistic founders, from the design guidance that exists — practitioner-level, not peer-reviewed):
| Trait | What breaks today | Design decision |
|---|---|---|
| No patience, low tolerance for walls of text | 5 depth levels, long paragraphs | One idea per screen; headline ≤ 7 words; meaning ≤ 2 lines; depth hidden behind "Why?" |
| Working memory (hold 3–5 things, not 7±2) | Lists, three moves, hints | Exactly one action per screen; the card carries everything needed |
| Time blindness | No sense of how long this takes | Visible budget (~90 s), "2 of 3", "~60 s left" |
| Infinite scroll = no stopping point | Feed of 130 stories | Three cards, then **Done for today** — a real stop |
| Task initiation | Reading ≠ doing | The move is a button; tap = it goes to Reminders/Things/Linear; "Later · tomorrow" and "Skip" are the only other choices |
| Vigilance / fear of missing a competitor move | Competitor news buried in the feed | Competitor watchlist → red card pinned first; red is reserved for this and nothing else |
| Sensory overwhelm | Gradients, idle motion, 7 type sizes | Black, white, one accent (action) + one reserved red (alert); no idle animation; 3 type sizes per screen |
| Dopamine from completion | Nothing happens when you finish | Done screen with the committed moves, the time it took, a small celebratory cue (Tiimo's pattern) |

## 2. The four features
1. **Daily brief (3 signals).** Ranking as today (Apple on-device, high/medium/low vs the product description), but the app shows only the top 3 High. More only on request ("Show 3 more").
2. **Infographic per signal — templated, on-device, $0.** Apple's model does not draw; it *extracts*. New step after the fact sheet: the model fills a small schema — `{kind, number, unit, label, before, after, dates, steps}` — and the app renders one of 6 native SwiftUI templates: hero number · before→after · timeline shift · versus · 3-step flow · share bars. Same style every time (Geist, black, white, one accent), always readable, no raster, no API. Illustrations (QuiverAI Arrow 2) stay a placeholder until the owner says so.
3. **Competitor radar (red alerts).** Watchlist of 5–10 competitors (domain, blog/changelog RSS, X/LinkedIn via RSS bridges, Product Hunt). Every new item from a watched source is scored by the on-device model for *threat to the product* (what they shipped · overlap with our promise · gap they miss) → threat 1–5. ≥ 3 pins a red card first in the brief and sets the Lock Screen widget mark. Red = competitor only.
4. **One move, committed.** Every card ends in one verb-first action (≤ 12 words) chosen by the model from its 3 candidates by "smallest step that can be done today". Tap → Reminders (EventKit) / Things / Linear via Shortcuts; "Later" schedules tomorrow; "Skip" is logged. The Done screen lists the moves; the Lock Screen widget shows the next one (zero taps).

## 3. UI adjustments (from the mockup)
- Type: Geist. Headline 36/1.04 weight 650; meaning 19/1.3 at 62% white; facts 18; meta 11–12 Geist Mono. Three sizes per screen.
- Colour: #000 / #fff / accent #C8FF3D (action only) / #FF4538 (competitor alert only, always with ■ icon + "COMPETITOR" label — never colour alone).
- Layout: progress bars under the status line (the alert bar is red); kicker; headline; the visual; one "For <product>:" line; the action button; "Why? · 20 s" and "Skip" as quiet text.
- Motion: none at rest. The focus-pull / lens effect survives only as the transition into "Why?" (depth), where the owner found it promising.
- Haptics: light on commit, success pattern on Done.
- Widgets: Lock Screen + Home widget "Next move" with alert mark; Live Activity during the brief ("2 of 3 · 60 s").

## 4. Apple winners this borrows from (ADA 2026 / App Store Awards 2025)
- **Tiimo** — iPhone App of the Year 2025 (ADHD planner): focus timers inside tasks, "small celebratory cues", Live Activities + widgets, Liquid Glass "clarity and calm". → the budget timer, the Done cue, the widget.
- **Structured** — ADA 2026 Inclusivity finalist (visual day planner). → one timeline, one next thing.
- **grug** — ADA 2026 Delight winner: one short daily thing, a moment of reflection. → three cards and stop.
- **Tide Guide** — ADA 2026 Visuals & Graphics winner: full-screen charts with custom animation as the content itself. → the infographic *is* the card, not an illustration beside text.
- **Moonlitt** — ADA 2026 Interaction winner: "best-in-class Liquid Glass integration". → glass only for the action/commit layer, never behind text.

## 5. What is real in the mockup and what is not
Real (from the phone's feed today): "$9.86B online spend, Prime Big Deal Days Oct 6–7" (Adobe via Digital Commerce 360); "Virtual try-on launches on ChatGPT" (Retail Dive). Example copy: the Jungle Scout alert and every "Do this" line (the on-device model's own actions are still too generic — see the handoff).

## 6. Build order (if the owner approves the direction)
1. Templated infographics: schema extraction step in `NewsDepthWriter` + 6 SwiftUI templates (hero, before/after, timeline shift, versus, flow, bars). Test on the 5 stories already on the phone.
2. Daily brief: top-3 paging screen with budget + progress + Done; "Why?" opens the existing levels.
3. One move: action selection + EventKit commit + Done list; Lock Screen widget.
4. Competitor radar: watchlist sources + threat scoring + red card.
5. Then TestFlight.

## Sources
- ADHD design guidance: https://digitalcommunications.wp.st-andrews.ac.uk/2025/02/12/designing-for-users-with-adhd/ · https://www.focusbear.io/blog-post/adhd-accessibility-designing-apps-for-focus · https://www.designmonks.co/blog/ui-ux-and-adhd
- Tiimo, App Store Awards 2025: https://www.tiimoapp.com/resource-hub/tiimo-winner-2025-app-store-awards
- Apple Design Awards 2026: https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/ · https://developer.apple.com/design/awards/
- Reference research (this repo): `docs/REDESIGN-RESEARCH-2026-10-13.md`
