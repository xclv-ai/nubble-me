# Nubble iOS redesign — reference research, 2026-10-13

Read-only research for the redesign of the "signals for my product" screen and the depth reader.
No code was changed. Everything below is either (a) quoted from the page linked next to it, or (b) marked **[not verified]** when the source was thin.

**What the owner asked for, in his words:** "actionable news consuming — you are not reading news, you see the reinterpretation of news as signals: everything that will help you with your product." Futuristic, impressive but readable and calm. Large comfortable text, white on black. A 3D transition between depth levels in the style of Apple's foldable. Text that feels alive with the gyroscope but settles to a stable readable state. The current card list is "terrible".

**What the app has today (from `ios/Nubble/`):**
- `ProductNewsView`: header Zodiak 28 + 12 pt grey subtitle; per story: 11 pt tracked orange "HIGH RELEVANCE" badge → compact `NewsCardView` (12 pt padding, 12 pt radius, card `hsl(30,8,11)` ≈ #1E1C1A, 1 px border at 30 %, thumbnail, Zodiak title, 16 pt grey snippet `hsl(30,5,55)` ≈ #8F8984, orange source label) → signal text 17 pt at 85 % white + "→ first move" 17 pt Medium with an orange `arrow.forward.circle.fill`. 12 pt between stories.
- Reader: depth body Satoshi 20 → 18.5 → 17.5 → 17 (deeper = smaller), section title Zodiak 24, hints at 9 pt / 30–40 % opacity, `DepthIndicator` bars, a "depth scan" beam transition, `MotionTilt` driven by rotation **rate** (max 5°, settles ×0.86 per frame) — this part already does "alive but settles".
- Forced `.preferredColorScheme(.dark)`.

---

## 1. References worth keeping (and the ones to drop)

Legend: **KEEP** = borrow something concrete; **PARTIAL** = one idea only; **DROP** = looked at, nothing for us.

### 1.1 Particle (AI news) — PARTIAL
- What it is: AI groups 100+ articles into a "Story", summarises at the top, offers "summary styles" (Opposite Sides, Explain Like I'm 5, 5 Ws), rewrites the headline, answers questions. Apple Editors' Choice.
- What's good for us: **the summary is the unit, the articles are the footnote** ("All of Particle's stuff comes from news… but it doesn't look like articles" — The Verge). The "summary styles" chooser is the closest shipped analogue to our 5 depths.
- What's bad (and ours to avoid): App Store reviews say "the app tends to bombard you with a lot of information all at once. A cleaner, more organized, or minimalistic design would definitely take the experience to a 5/5". The Verge: "extremely information-dense".
- Screens: https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/25727482/Particle_news.jpg · https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/25728784/Particle_2.jpg · https://apps.apple.com/us/app/particle-personalized-news/id6683283775 · https://www.theverge.com/2024/11/12/24293993/particle-news-app-ai-summaries

### 1.2 Arc Search "Browse for Me" — KEEP
- What it is: the browser builds a one-off page per query: sectioned key takeaways, sources always linked, fast.
- What's good: a **generated page with named sections** instead of a feed of links; MacStories: "The summary makes good use of sections and lists all the sources it used… The animations, besides being lovely to see, are fast… Safari feels like it's operating in slow motion." Bottom-oriented, three-button toolbar; favourites placed directly above the keyboard for thumb reach.
- Borrow: **speed of transitions** (every transition < 350 ms), sources as a tappable footer, one-hand bottom controls.
- Screens: https://cdn.macstories.net/monday-29-jan-2024-01-24-33-1706487891442.png · https://cdn.macstories.net/monday-29-jan-2024-02-29-30-1706491775028.png · https://www.macstories.net/reviews/arc-search-for-iphone/

### 1.3 Semafor "Semaform" — KEEP (format, not visuals)
- What it is: Semafor rebuilt the article as five named blocks: **The News · The Reporter's View · Room for Disagreement · The View From · Notable**. Each block has its own icon and heading; the heading tells you what kind of sentence follows.
- Why it matters for Nubble: our Expanded (WHAT'S GOING ON / WHY IT'S A BIG DEAL / UNCOMFORTABLE TRUTH / SO WHAT) and My-product (HOW RELEVANT / HOW IT APPLIES / HOW IT WILL IMPACT / WHAT TO DO) levels are already Semaforms. **Treat the block label as a first-class typographic element, not a bold paragraph lead.**
- Source: https://www.semafor.com/article/10/18/2022/what-is-a-semaform-anyway-and-why-should-you-care · https://www.cjr.org/the_media_today/semafor_launch_review.php
- Semafor's iOS app itself: no review found **[not verified]**.

### 1.4 Fey (finance) — KEEP
- What it is: a markets app with a cinematic black UI.
- What's good (from reverse-engineered style sheets; hex values **[not verified against the shipped app]**): canvas #0B0B0B (one source says #000000), lifted cards #131313 / #191919; **one typeface (Calibre) at multiple weights with aggressive negative tracking on large sizes**; "large, low-contrast gray display headlines with white 600-weight section heads"; a single warm accent #FFA16C for eyebrows; green only for "up".
- Borrow: one family, weight does the hierarchy; near-black + two lift levels; one warm accent reserved for one meaning.
- Source: https://styles.refero.design/style/a0630421-7b66-48b4-aa14-6194a3b2c2b9 · https://styles.refero.design/style/733e6475-892a-4138-8835-bf40344df317 · https://kombai.com/gallery/inspirations/feyapp/

### 1.5 CARROT Weather — PARTIAL
- What's good: the big number is set at **72 px ultra-thin** so a huge figure doesn't dominate ("Ultra-thin type weights communicate data elegance"); the background colour shifts with conditions so the screen says the weather before you read a digit; four-day forecast visible without scrolling.
- Borrow: a very large, very light number/word for the signal's relevance; the "screen tells you before you read" idea for relevance.
- Source: https://blakecrosley.com/guides/design/carrot-weather · https://www.macstories.net/news/carrot-weather-5-introduces-new-design-elements-custom-interface-builder-and-more/

### 1.6 Teenage Engineering — KEEP (labels)
- What's good: monospaced type "across products, packaging, websites, documents and social media"; orange + black as a manifesto; constraints as the aesthetic (OP-1: 2.4-inch screen, four encoders). "Interfaces are not flat design. They have depth, texture and character, but refuse to pretend a synth screen is an analog control panel."
- Borrow: **monospace for eyebrow/meta rows only**, never for sentences; orange is the one colour.
- Source: https://blakecrosley.com/guides/design/teenage-engineering

### 1.7 Nothing OS — PARTIAL
- What's good: dot-matrix (Ndot) typography + monochrome as a recognisable identity. What they learned: in Nothing OS 4.0 "Geist becomes the system typeface" and dot-matrix "will now be used more intentionally, where it can define character rather than compromise readability." Community thread: "The dot font is absolutely hideous and makes things hard to read."
- Borrow: a dot-matrix glyph for **numerals and the relevance meter only** (3×3 dots), nothing else.
- Source: https://nothing.community/d/61774-nothing-os-evolution · https://www.gsmarena.com/nothing_phone_3-review-2853p4.php · https://nothing.community/d/15941-nothing-os-30-dont-remove-the-dot-font?page=5

### 1.8 Daylight DC-1 — PARTIAL (mood)
- What's good: "paper-like", "no distractions", 60 Hz e-paper; the whole product is a calm argument. Reviews say the hardware idea is great, the software half-baked.
- Borrow: the reading *mood* — one column, warm grey text on true black at night, nothing animated while you read.
- Source: https://daylightcomputer.com/ · https://no-kill-switch.ghost.io/daylight-computer-dc-1-initial-impressions/

### 1.9 iA Writer — KEEP (focus)
- What's good: "if you look at text as an interface, typography is its usability." Focus Mode "highlights the sentence or paragraph you're working on and fades out the rest." Fonts (Mono/Duo/Quattro) are variable so iA "adjust[s] weight and line spacing depending on size, device, and background."
- Borrow: **the paragraph you are on is 100 % white, the rest 45 %**; variable weight that gets lighter as size grows.
- Source: https://ia.net/writer · https://www.macstories.net/ios/ia-writer-5-2-better-typography-and-external-library-locations/

### 1.10 Kindle (dark) — PARTIAL
- What's good: page colours white/sepia/light-green/**black**, follows system dark mode, a single "Spacing" control for lines/paragraphs/words/characters; margins matter more than most settings for readability.
- Borrow: a black page with **generous margins (24 pt) and one spacing scale**; nothing else — Kindle's UI is otherwise invisible by design.
- Source: https://digprjsurvey.amazon.com/csad/help/node/TABlJ4ot69emTO8jJG

### 1.11 Readwise Reader — PARTIAL
- What's good: all sources in one reader, "Ghostreader" AI that "doesn't feel forced on me, but it's there"; text-to-speech first-class. Reddit also calls the UI ugly.
- Borrow: AI that is present but quiet; nothing visual.
- Source: https://readwise.io/read · https://apps.apple.com/us/app/readwise-reader/id1567599761

### 1.12 Artifact (Instagram founders, shut down 2024) — PARTIAL
- What's good: summary "appears in a black box at the top of the screen" within seconds; tone styles (ELI5, emoji, poem, Gen Z) were "more entertaining than useful". Died after a year.
- Lesson: summary-on-top worked; the gimmick styles did not. Keep our 5 depths *useful*, not playful.
- Source: https://www.bgr.com/tech/artifact-debuts-ai-tool-that-can-summarize-news-stories-for-you/ · https://mediacopilot.substack.com/p/the-truth-about-the-death-of-artifact

### 1.13 Perplexity Discover — DROP
- Topic-filtered feed of AI-written stories with hero images; no 2025 redesign write-up found **[not verified]**. It is the generic "card with image" look we are leaving.
- Source: https://apps.apple.com/us/app/perplexity-ai-search-chat/id1668000334 · https://www.testingcatalog.com/perplexity-is-testing.md

### 1.14 Apple News+ / Bloomberg — DROP as visuals, KEEP one rule
- Apple News in iOS 26 only gets the system Liquid Glass tab bar; its Today feed is image-cards. Bloomberg: no recent typography review found; a 2018 critic called the redesign "rather bland" **[not verified for the current app]**.
- Keep from Bloomberg's world: the *terminal* idea — data first, chrome last — which Fey executes better.
- Source: https://www.bluelabellabs.com/work/bloomberg · https://www.newscaststudio.com/2018/05/07/bloomberg-website-redesign/

### 1.15 Airbnb 2025 — PARTIAL (one idea)
- "Lava": a lightweight alpha-channel video format for 3D animated icons, built because Lottie/video hit limits; new typeface, navigation, cards, icons.
- Borrow: **one 3D animated glyph** (the depth indicator) can carry all the "futuristic" load; everything else stays flat. (Lava details come from one secondary source **[not verified]**.)
- Source: https://designcompass.org/en/2025/07/04/airbnb-new-design-system/ · https://www.woshipm.com/ucd/6243362.html

### 1.16 Opal — DROP
- Apple Design Award finalist 2025 (Social Impact); no design write-up of its black UI or type found **[not verified]**.
- Source: https://opalapp.com/blog/apple-design-award-finalist

### 1.17 Linear / Things — PARTIAL (from memory, not fetched)
- Linear: one sans (Inter), near-black surfaces, keyboard-first, every transition ≤ 200 ms. Things: system font, white space does the hierarchy, almost no colour. Both prove **calm = few sizes, few colours, fast motion**.
- https://linear.app · https://culturedcode.com/things/

### 1.18 Apple iPhone Duo fold transition (the owner's motion reference) — KEEP
- What's reported (press, hands-on): "Rather than cutting between screens, Apple built a dedicated transition effect that makes the interface appear to **blur and stretch** as it moves between the two screens"; the wallpaper "appears to **slide through the moving half of the screen** before reappearing on the other side, using motion data and gradients"; audio is retuned to the fold angle. iOS 27 beta strings: `foldState`, `angleDegrees`.
- Borrow for the depth transition: a hinge, a gradient that darkens the folding half, a little stretch/blur during the fold, and **the angle driven by the finger** (interactive), not a fire-and-forget animation.
- Source: https://gulfnews.com/amp/story/technology%2Fiphone-duos-folding-animation-is-a-feature-no-other-foldable-phone-have-1.500669297 · https://www.devclass.com/development/2026/09/16/apple-iphone-duo-makes-developers-think-in-folds/5296425 · https://appleosophy.com/2026/06/08/several-changes-in-ios-27-beta-point-towards-a-foldable-iphone-including-a-new-framework-reference/

### 1.19 Gyroscope "alive text" — implementation references
- CoreMotion → `rotation3DEffect` pipeline, axis sign flip between device and screen space, smoothing, throttle, soften/disable under Reduce Motion: https://www.createwithswift.com/using-core-motion-within-a-swiftui-application/ · https://github.com/Priva28/ParallaxSwiftUI (default amount 10 px) · https://swiftpackageregistry.com/ryanlintott/LookingGlassUI (`.deviceRotationEffect()`).
- Our existing `MotionTilt` (rotation-rate, decays to 0) is the right model; see HIG motion rules below for the limits.

---

## 2. Apple guidance — the concrete rules

### 2.1 Typography (HIG → Specifications, iOS Dynamic Type)
Default **Large** size (points / leading):

| Style | Weight | Size | Leading |
|---|---|---|---|
| Large Title | Regular | 34 | 41 |
| Title 1 | Regular | 28 | 34 |
| Title 2 | Regular | 22 | 28 |
| Title 3 | Regular | 20 | 25 |
| Headline | Semibold | 17 | 22 |
| Body | Regular | 17 | 22 |
| Callout | Regular | 16 | 21 |
| Subhead | Regular | 15 | 20 |
| Footnote | Regular | 13 | 18 |
| Caption 1 | Regular | 12 | 16 |
| Caption 2 | Regular | 11 | 13 |

**xxLarge** (the "large comfortable text" the owner wants, as a system size): Large Title 38/46, Title 1 32/39, Title 2 26/32, Title 3 24/30, Headline 21/26, **Body 21/26**, Callout 20/25, Subhead 19/24, Footnote 17/22, Caption 1 16/21, Caption 2 15/20. xxxLarge Body = 23/29.
- "Consider adjusting your layout at large font sizes."
- SF Pro Text ≤ 19 pt, SF Pro Display ≥ 20 pt (optical sizes; 17 pt tracking −0.43, 28 pt −0.8).
- Custom fonts must scale: `Font.custom(name, size:, relativeTo:)`; tight/loose leading variants exist (`.leading(.tight)` 20 pt line height for body, `.loose` 24 pt).
- Design+code: "Consider setting number of lines on the label to zero… avoid truncations." Test with Xcode's Dynamic Type Variants.
Source: https://developer.apple.com/design/human-interface-guidelines/typography · https://developer.apple.com/videos/play/wwdc2020/10175/ · https://developer.apple.com/videos/play/wwdc2024/10074/

### 2.2 Dark Mode (HIG)
- "**Avoid offering an app-specific appearance setting.**" But: "In rare cases, consider using only a dark appearance… an app that supports immersive media viewing… lets the UI recede." (Stocks is dark-only.) → Nubble can be dark-only if the reader is framed as immersive; otherwise honour the system.
- "At a minimum, make sure the contrast ratio between colors is no lower than **4.5:1**. For custom foreground and background colors, strive for **7:1**, especially in small text."
- "Soften the color of white backgrounds" in images.
- iOS Dark Mode has two background sets, **base** (dimmer, recedes) and **elevated** (brighter, advances): systemBackground #000000 → elevated #1C1C1E; secondary #1C1C1E → #2C2C2E; tertiary #2C2C2E → #3A3A3C. "Prefer the system background colors."
- "Use the system-provided label colors" (label #FFFFFF, secondary rgba(235,235,245,.6), tertiary .3, quaternary .18).
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### 2.3 Liquid Glass / Materials (HIG + WWDC25 219 + 356)
- "Liquid Glass forms a distinct functional layer for controls and navigation elements… that floats above the content layer."
- "**Don't use Liquid Glass in the content layer.**" "Use standard materials for elements in the content layer, such as app backgrounds."
- "**Use Liquid Glass effects sparingly.** … Limit these effects to the most important functional elements in your app."
- "always avoid glass on glass."
- Two variants, Regular and Clear, "should never be mixed". Clear only when: over media-rich content, a dimming layer won't hurt, and the content above is bold and bright; if the underlying content is bright add "a dark dimming layer of 35% opacity".
- Tinting: "Use tinting selectively to highlight primary elements and actions. Avoid tinting all elements."
- Lighting "responds to device motion, making it feel like Liquid Glass is aware of its position in the real world"; on touch it "instantly flex[es] and energiz[es] with light".
- Reduce Transparency → frostier; Increase Contrast → black/white with border; Reduce Motion "disables any elastic properties" — automatic for system components, test custom ones.
- WWDC25 356 (via wwdcnotes): typography "bolder and left-aligned"; shapes are fixed / capsule (radius = half height) / **concentric** (child radius = parent radius − padding); capsules for large controls near the iPhone screen edge; "check corner radii that look off, especially in nested containers".
- Adopting: "Reduce your use of custom backgrounds in controls and navigation"; buttons "fluidly morph into menus and popovers"; `.glass` button style; `UIDesignRequiresCompatibility` to opt out.
Source: https://developer.apple.com/design/human-interface-guidelines/materials · https://developer.apple.com/videos/play/wwdc2025/219/ · https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/ · https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass

### 2.4 Motion (HIG)
- "Add motion purposefully… Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable."
- "**Make motion optional**… supplement visual feedback by also using alternatives like haptics and audio."
- "Strive for realistic feedback motion that follows people's gestures" (reveal from top → dismiss to top, not sideways).
- "Aim for brevity and precision in feedback animations."
- "**In apps, generally avoid adding motion to UI interactions that occur frequently.**" → the depth swipe is frequent: the fold must be short, interactive and cancellable.
- "**Let people cancel motion.**"
- visionOS (applies to any gyro effect): "Avoid showing objects that oscillate in a sustained way… a frequency of around **0.2 Hz**"; "avoid displaying motion at the edges of a person's field of view"; "Consider giving people a stationary frame of reference."
Source: https://developer.apple.com/design/human-interface-guidelines/motion

### 2.5 Depth (HIG Spatial layout — visionOS, the only Apple page about depth)
- "**Use depth to communicate hierarchy.** … when a sheet appears over a window, the window recedes along the z-axis."
- "**In general, avoid adding depth to text.** Text that appears to hover above its background is difficult to read."
- "Make sure depth adds value… Depth is great for visually separating large, important elements… it may not work as well on small objects." "People need to refocus their eyes to perceive each difference in depth, and doing so too often or quickly can be tiring."
- "Provide visual cues that accurately communicate the depth of your content."
Source: https://developer.apple.com/design/human-interface-guidelines/spatial-layout

### 2.6 Generative AI (HIG, updated June 8 2026)
- "**Clearly identify when and where you use AI.**" "Never trick someone into thinking they're interacting with or viewing content authored by a human."
- "**Set clear expectations about what your AI-powered feature can and can't do.**"
- "**Raise awareness about and minimize the chance of hallucinations**… clearly communicate that AI-generated content may contain errors."
- "Consider giving specific, reassuring feedback during generation… instead of 'Processing…', say … 'Summarizing key themes from your notes.'"
- "Make it easy for people to refine or revert generated results… Edit, Undo, Retry, or Adjust near generated content."
- "Let people share feedback on outputs… simple thumbs-up and thumbs-down buttons."
- "On-device models keep people's information on their device, respond quickly, and work offline." (Foundation Models needs Apple Intelligence on.)
Source: https://developer.apple.com/design/human-interface-guidelines/generative-ai

---

## 3. Three directions

Common constants (all three): 393 pt-wide iPhone, 20 pt side gutters → 353 pt column (≈ 34–38 characters per line at 20–21 pt SF Pro — phone-normal). Body text never below **19 pt**, body leading ≥ 1.3×, contrast ≥ 7:1 for body, ≥ 4.5:1 for meta. Dark-only is allowed under HIG's "immersive" exception; every size is a Dynamic Type style or `relativeTo:` so xxLarge users get the HIG 21/26 body. One accent colour, one meaning. Liquid Glass only in the navigation layer. Reduce Motion → crossfade, Reduce Transparency/Increase Contrast tested.

### Direction A — "Signal Terminal"
**One line:** the product's news desk — every story is a signal row where the "what to do" is the headline and the news is the footnote.

**Layout (top → bottom), list screen:**
- 0–44 pt: status/safe area. No large title.
- Eyebrow row, 13 pt **SF Mono** Medium, tracking +6 %, label-secondary (60 % white): `POKPOK.AI  ·  6 SIGNALS  ·  TUE 13 OCT`. Right side: a 28 pt dot-matrix "6" (numerals only).
- Then signal rows, full width, **no card chrome**; separated by a 1 px hairline rgba(255,255,255,.12) with 28 pt above and 28 pt below.
- Row anatomy (left-aligned, 353 pt):
  1. Meta line, 13 pt SF Mono, 60 % white: relevance as a 3-dot meter `●●●` (high) / `●●○` (medium), 8 pt dots, filled dots white, empty rgba(255,255,255,.25) · source · age. 8 pt gap.
  2. **The signal** = HOW RELEVANT sentence from the My-product level: **24 pt SF Pro Display Semibold, leading 29, white, max 3 lines.** 10 pt gap.
  3. **WHAT TO DO**: 20 pt SF Pro Regular, leading 26, white, prefixed by a 20 pt `→` in the accent, hanging indent 24 pt; max 2 lines. 10 pt gap.
  4. The original headline as footnote: 15 pt SF Pro Regular, 60 % white, 1 line truncated, plus `↗` glyph.
  - Tap anywhere → reader opens on the My-product depth. Long-press → context menu (Save, Share, Thumbs up/down on the AI signal — HIG feedback rule).
- Bottom: one Liquid Glass **regular** capsule, 44 pt tall, `scope` symbol + product name; tap morphs into the product switcher menu. The only glass on screen.

**Reader (same direction):** black page, 24 pt margins; section label 13 pt SF Mono 60 % uppercase (`HOW IT APPLIES`); body **20/28 SF Pro Regular** (xxLarge users get 21/26 automatically via `relativeTo: .body`); current paragraph 100 % white, others 45 % (iA focus). Depth strip: five 2 pt bars at the top, the active one 24 pt wide, white; others 8 pt, 25 %.

**Type scale:** 13 Mono meta · 15 footnote · 20 body/action · 24 Display Semibold signal · 28 dot-matrix numerals only.

**Colour tokens:** `bg` #000000 · `label` #FFFFFF · `label2` rgba(235,235,245,.60) · `hairline` rgba(255,255,255,.12) · `dotEmpty` rgba(255,255,255,.25) · `accent` #FF8C33 (Nubble orange) used **only** on the `→` glyph and the active depth bar · `glassTint` none.

**Motion:** rows enter with a 40 ms stagger (opacity 0→1, y +8→0, spring response 0.35/damping 0.8). When the on-device model finishes a signal, the three dots fill one at a time (120 ms each) — that is the "AI is working" feedback, with the HIG-style status text "Writing what this means for pokpok.ai…" above the list until done. Depth change in the reader = the fold (Direction B's transition, shared). Gyro: the eyebrow hairline carries a 60 pt specular highlight that slides with device attitude (±40 pt), text itself moves ≤ 1.5°.

**Borrows:** Fey (one family, weight = hierarchy, two lift levels), Teenage Engineering (mono meta, orange/black), Semafor (named blocks), Arc Search (speed, one-hand bottom control), Particle (signal is the unit, article is the footnote), Nothing (numerals only).

**Risks:** mono eyebrows can read "hacker console" — keep them at 13 pt and 60 %; density creeps back if anyone adds a thumbnail; mixing SF Mono + SF Pro Display needs a strict rule (mono = meta only); the dot meter needs an `accessibilityValue` ("High relevance"); one-line footnote headlines will truncate in German.

### Direction B — "Paper Fold"
**One line:** one signal per page, set like a printed page on black, and the depth change is a physical fold.

**Layout, list screen:** vertical **paging** scroll (`.scrollTargetBehavior(.paging)`), one story per viewport. Page anatomy on 393×852:
- Top 16 pt: page counter `3 / 6` 13 pt SF Pro Semibold 60 %, left; relevance word right: `HIGH` 13 pt, white (medium = 60 %).
- From y = 120 pt: **HOW RELEVANT** in **28 pt New York Regular (`.serif` design), leading 34, white**, max 4 lines (New York is Apple's own serif; it scales with Dynamic Type).
- 20 pt gap, then HOW IT APPLIES in 20/28 SF Pro Regular, 60 % white, max 4 lines.
- Pinned to y = 852 − 160: **WHAT TO DO** as a left-aligned 17 pt Semibold label inside a Liquid Glass regular capsule, full width minus gutters, 52 pt tall, leading `→` symbol; tap = open reader on My-product depth.
- Under it, 15 pt 45 % source line. Under that the system tab/glass bar.
- Haptic `.selection` on each page snap.

**Reader:** identical page, body 20/28 SF Pro, section labels 13 pt Semibold tracked +6 % uppercase 60 %, generous 24 pt margins, no decoration. Horizontal swipe = depth. The current section is 100 % white, the previous/next sections 45 % (iA).

**The fold (shared by all directions):** the section's text block is one layer; a horizontal crease at its vertical centre. The departing depth folds **away from the finger** around that hinge (`rotation3DEffect` on the x-axis, anchor `.center`, perspective 0.5, 0° → 90°); the arriving depth is drawn on the back face and unfolds 90° → 0° in the second half. A black-to-transparent gradient darkens the half that turns away (the iPhone Duo "gradient"); 2 pt blur and a 3 % vertical stretch at the 45° point (the "blur and stretch"). **The angle follows the drag** (0–120 pt drag ↔ 0–90°); release past 50 % completes with spring response 0.30 / damping 0.85, otherwise snaps back. Total ≤ 350 ms when flicked. Reduce Motion → 200 ms crossfade. Haptic `.light` at the crease. HIG compliance: "follows people's gestures", "let people cancel", "brief and precise".

**Gyro:** no tilt on the text. The crease line and the glass capsule carry the lighting: a highlight that moves with attitude (what Liquid Glass does natively). Text stays flat — HIG "avoid adding depth to text".

**Type scale:** 13 meta · 15 source · 17 action capsule · 20 body · 28 New York signal.

**Colour tokens:** `bg` #000000 · `label` #FFFFFF · `label2` rgba(235,235,245,.60) · `label3` rgba(235,235,245,.30) · `crease` rgba(255,255,255,.18) → animated · `accent` none (the capsule's glass is the accent; `→` inherits label).

**Borrows:** iA Writer (focus fade, "typography is usability"), Kindle (black page, margins, one spacing scale), Daylight (calm, nothing moves while reading), iPhone Duo (fold with gradient/blur/stretch, angle from motion), Arc Search (one-hand bottom capsule).

**Risks:** one story per screen hides how many signals there are — the `3 / 6` counter is load-bearing; paging fights the native list feel and VoiceOver users need a plain list fallback; serif can read "editorial", not "futuristic" — the fold and the glass capsule carry the futurism; a fold on every swipe is motion on a frequent interaction — it must stay interactive and short, and the crease highlight must not oscillate (no idle animation); New York at 28 pt needs `.serif` design checks at xxxLarge (34/41).

### Direction C — "Lens Stack"
**One line:** the five depths are five physical sheets stacked in z; you pull the next sheet to the front, and the stack parallaxes with the phone.

**Layout, list screen:** each story is a **stack**: the front sheet shows the Summary depth; the four deeper sheets peek out beneath as 2 pt edges (offsets 0 / 4 / 8 / 12 / 16 pt down and 0 / 2 / 4 / 6 / 8 pt inset), coloured with the system elevated greys. Stack anatomy on a 353 pt column:
- Front sheet: 20 pt padding, corner radius **concentric** (sheet 20 pt, inner elements 20 − padding), background #0A0A0A, 1 px rgba(255,255,255,.08) edge.
  - Top-left: a **3×3 dot-matrix relevance glyph** (18 pt), 9 dots filled = high, 6 = medium; top-right: `01` depth numeral 13 pt dot-matrix 60 %.
  - **Summary sentence 22/28 SF Pro Semibold white**, max 3 lines.
  - Bottom of sheet, pinned: WHAT TO DO 18/24 SF Pro Regular, white, `→` in accent, max 2 lines.
- 24 pt between stacks.
- Horizontal swipe on a stack (in the list, not only in the reader): the front sheet scales to 0.96, dims to 60 % and slides 12 pt down/back; the next sheet rises to the front and its text fades in. So **Summary → Condensed → … → My product** is reachable without leaving the list.
- Bottom: one Liquid Glass regular capsule: depth name (`My product`) + product name; tap morphs into the 5-depth menu (native button→menu morph).

**Reader:** the same stack metaphor full-screen: front sheet is the current depth; swiping pulls the next; the HIG rule "a sheet appears over a window, the window recedes along the z-axis" is literally the interaction. Body 20/27 SF Pro; section labels 13 pt Semibold uppercase 60 %.

**Gyro:** the sheets parallax relative to each other, ±4 pt between adjacent layers, driven by attitude low-passed (τ ≈ 150 ms), clamped, **off while scrolling and under Reduce Motion**; the text on the front sheet does not tilt (HIG). Liquid Glass capsule lighting moves with the device for free.

**Type scale:** 13 dot-matrix numerals · 13 labels · 18 action · 20 body · 22 Semibold summary.

**Colour tokens:** `bg` #000000 · `sheet0` #0A0A0A · `sheet1` #141414 · `sheet2` #1C1C1E · `sheet3` #242426 · `sheet4` #2C2C2E (system secondary/tertiary dark greys) · `edge` rgba(255,255,255,.08) · `label` #FFFFFF · `label2` 60 % · `accent` #FF8C33 on `→` only · dots filled #FFFFFF / empty rgba(255,255,255,.22).

**Borrows:** visionOS depth rules (hierarchy by z, recede on sheet), Liquid Glass capsule + menu morph (WWDC25), Nothing (dot glyphs for numerals/meter only), Arc Search's app-switcher-like tab stack (fast, physical), CARROT (the sheet "tells you" relevance before you read).

**Risks:** the peeking edges cost ~16 pt per stack and can look like a dropped card deck if the greys are too close — the edges must be ≥ 2 pt and the greys ≥ 8 L-points apart; parallax + scroll can nauseate (throttle to 30 Hz, disable while the scroll view is moving, respect Reduce Motion); five sheets need one onboarding moment ("swipe a story sideways to go deeper"); dot-matrix numerals need `accessibilityLabel`; glass only in the capsule — the sheets are standard materials, never glass (HIG).

### Recommended hybrid (one line)
A's list (signal-as-headline, hairlines, mono meta, one accent) + B's fold as the shared depth transition + C's single glass capsule for depth/product switching. It scores highest on the sheet below without stacking three novelty systems.

---

## 4. Benchmark score sheet

Score each criterion 1–5. Anchors are written so two people score within ±1.

| # | Criterion | 1 | 3 | 5 |
|---|---|---|---|---|
| 1 | **Readability at arm's length** | body < 17 pt or contrast < 4.5:1 anywhere in the reading path; hints < 11 pt | body 17–18 pt, contrast ≥ 4.5:1, leading ≥ 1.25× | body ≥ 20 pt (xxLarge ≥ 21), body contrast ≥ 7:1, meta ≥ 13 pt at ≥ 4.5:1, leading ≥ 1.35×, honours Dynamic Type to xxxLarge without clipping |
| 2 | **Signal-first hierarchy** | the first thing the eye lands on is the article headline / image | signal visible but third in reading order | the "what this means for my product" sentence is the largest text on screen; the article is a footnote |
| 3 | **Actionability visible without tapping** | "what to do" only inside the reader | "what to do" on the list but visually subordinate (≤ 17 pt, same colour as everything) | "what to do" on every list row, ≥ 18 pt, with one reserved accent and a consistent glyph; long-press gives Save/Share/feedback |
| 4 | **Depth navigation legibility** | hidden gestures, hints < 11 pt or < 50 % opacity, one-off onboarding | indicator present, current depth name not shown | you always see which of 5 depths you are on, its name, and an obvious way to move (swipe + a tappable control); VoiceOver can reach every depth |
| 5 | **Motion wow (one memorable, physical transition)** | fades only | a custom transition that is not gesture-driven | one signature 3D transition that follows the finger, is cancellable, ≤ 350 ms when flicked, with haptic and a Reduce Motion fallback |
| 6 | **Calm / not overwhelming** | thumbnails + badges + accent used for 4+ meanings + >4 type sizes per screen | ≤ 4 sizes, accent for ≤ 2 meanings | ≤ 3 type sizes per screen, one accent with one meaning, no images in the list, nothing animates at idle, generous rhythm (≥ 24 pt between items) |
| 7 | **Consistency with iOS 26** | custom card chrome, custom nav backgrounds, forced appearance without the "immersive" framing, no concentric radii | system fonts/styles, Liquid Glass used but also in content | glass only in the nav layer (one capsule), concentric/capsule shapes, Dynamic Type styles, system label/background colours, Reduce Motion/Transparency/Increase Contrast tested, button→menu morph |
| 8 | **Futuristic / screenshot-worthy** | looks like a template RSS reader | one distinctive element | you can tell it is Nubble from a black-and-white thumbnail; the depth model is visible in the first screen |

### Scoring the current design (honest)

| # | Criterion | Score | Evidence (from the code) |
|---|---|---|---|
| 1 | Readability | **2** | List snippet 16 pt in #8F8984 on #1E1C1A ≈ 4.8:1 (passes 4.5, misses 7); subtitle 12 pt; reader hints 9 pt at 30–40 % opacity; reader body shrinks with depth (20 → 17 pt) so the deepest, longest text is the smallest |
| 2 | Signal-first | **2** | Reading order is badge → thumbnail+serif headline → grey snippet → signal; the signal sentence is 17 pt at 85 %, the headline is Zodiak 24 |
| 3 | Actionability | **3** | The "→ first move" line does exist on the product tab (17 pt Medium + orange arrow) — the right idea, but it sits under a card that competes with it |
| 4 | Depth navigation | **2** | Bars without a name; `← less / more →` hints 9 pt at 30 %; swipe onboarding shown once |
| 5 | Motion wow | **2** | "Depth scan" beam and a rotation-rate tilt (max 5°, settles) — the tilt is the right physics, but no 3D transition, nothing follows the finger |
| 6 | Calm | **3** | Dark, few colours — but orange carries source label, relevance badge, arrow, depth indicator and progress bar (5 meanings); thumbnails; 7+ type sizes on one screen (9, 10, 11, 12, 16, 17, 24, 28) |
| 7 | iOS 26 | **2** | Custom 12 pt-radius card chrome with 1 px borders; no Liquid Glass anywhere; forced `.preferredColorScheme(.dark)`; custom fonts do scale via `relativeTo:` (good); no concentric radii |
| 8 | Futuristic | **1** | "Dull card list" — it is the template RSS reader of criterion 8's anchor |
| | **Total** | **17 / 40** | |

### Predicted scores for the three directions (to be verified on a built prototype, not claimed)

| Criterion | A Signal Terminal | B Paper Fold | C Lens Stack |
|---|---|---|---|
| 1 Readability | 5 | 5 | 4 (peeking edges cost space; 22 pt summary fine) |
| 2 Signal-first | 5 | 5 | 3 (front sheet is Summary, not the product signal) |
| 3 Actionability | 5 | 4 (capsule, but one per screen) | 5 |
| 4 Depth nav | 4 | 4 | 5 |
| 5 Motion wow | 4 (fold shared) | 5 | 5 |
| 6 Calm | 5 | 5 | 3 |
| 7 iOS 26 | 5 | 5 | 4 |
| 8 Futuristic | 4 | 4 | 5 |
| **Total** | **37** | **37** | **34** |

Verify the predictions the owner's way: build each as one SwiftUI screen with the real pokpok.ai signals, screenshot at Large and xxLarge, score blind.

---

## 5. Sources (all consulted today)
- HIG Typography — https://developer.apple.com/design/human-interface-guidelines/typography
- HIG Dark Mode — https://developer.apple.com/design/human-interface-guidelines/dark-mode
- HIG Materials / Liquid Glass — https://developer.apple.com/design/human-interface-guidelines/materials
- HIG Motion — https://developer.apple.com/design/human-interface-guidelines/motion
- HIG Spatial layout (depth) — https://developer.apple.com/design/human-interface-guidelines/spatial-layout
- HIG Generative AI — https://developer.apple.com/design/human-interface-guidelines/generative-ai
- Adopting Liquid Glass — https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- WWDC25 Meet Liquid Glass — https://developer.apple.com/videos/play/wwdc2025/219/
- WWDC25 Get to know the new design system (notes) — https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/
- WWDC20 The details of UI typography — https://developer.apple.com/videos/play/wwdc2020/10175/
- WWDC24 Get started with Dynamic Type — https://developer.apple.com/videos/play/wwdc2024/10074/
- Particle — The Verge https://www.theverge.com/2024/11/12/24293993/particle-news-app-ai-summaries · App Store https://apps.apple.com/us/app/particle-personalized-news/id6683283775 · Wisp review https://wisp.news/blog/particle-review/
- Arc Search — MacStories https://www.macstories.net/reviews/arc-search-for-iphone/
- Semafor — https://www.semafor.com/article/10/18/2022/what-is-a-semaform-anyway-and-why-should-you-care · https://www.cjr.org/the_media_today/semafor_launch_review.php
- Fey — https://styles.refero.design/style/a0630421-7b66-48b4-aa14-6194a3b2c2b9 · https://kombai.com/gallery/inspirations/feyapp/
- CARROT Weather — https://blakecrosley.com/guides/design/carrot-weather
- Teenage Engineering — https://blakecrosley.com/guides/design/teenage-engineering
- Nothing OS — https://nothing.community/d/61774-nothing-os-evolution · https://www.gsmarena.com/nothing_phone_3-review-2853p4.php
- Daylight — https://daylightcomputer.com/ · https://no-kill-switch.ghost.io/daylight-computer-dc-1-initial-impressions/
- iA Writer — https://ia.net/writer · https://www.macstories.net/ios/ia-writer-5-2-better-typography-and-external-library-locations/
- Kindle — https://digprjsurvey.amazon.com/csad/help/node/TABlJ4ot69emTO8jJG
- Readwise Reader — https://readwise.io/read · https://apps.apple.com/us/app/readwise-reader/id1567599761
- Artifact — https://www.bgr.com/tech/artifact-debuts-ai-tool-that-can-summarize-news-stories-for-you/ · https://mediacopilot.substack.com/p/the-truth-about-the-death-of-artifact
- Perplexity — https://apps.apple.com/us/app/perplexity-ai-search-chat/id1668000334 · https://www.testingcatalog.com/perplexity-is-testing.md
- Bloomberg — https://www.bluelabellabs.com/work/bloomberg · https://www.newscaststudio.com/2018/05/07/bloomberg-website-redesign/
- Airbnb 2025 — https://designcompass.org/en/2025/07/04/airbnb-new-design-system/ · https://www.woshipm.com/ucd/6243362.html
- Opal — https://opalapp.com/blog/apple-design-award-finalist
- iPhone Duo fold — https://gulfnews.com/amp/story/technology%2Fiphone-duos-folding-animation-is-a-feature-no-other-foldable-phone-have-1.500669297 · https://www.devclass.com/development/2026/09/16/apple-iphone-duo-makes-developers-think-in-folds/5296425
- Gyro/parallax in SwiftUI — https://www.createwithswift.com/using-core-motion-within-a-swiftui-application/ · https://github.com/Priva28/ParallaxSwiftUI · https://swiftpackageregistry.com/ryanlintott/LookingGlassUI
- Nubble current code — `ios/Nubble/Design/Typography.swift`, `NubbleColors.swift`, `Springs.swift`, `Views/Feed/ProductNewsView.swift`, `NewsCardView.swift`, `Views/Reader/SectionView.swift`, `MotionTilt.swift`, `DepthIndicator.swift`; prior audit `docs/UX-AUDIT-2026-03-18.md`
