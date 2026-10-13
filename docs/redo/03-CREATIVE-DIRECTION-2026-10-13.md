# Creative direction — "The toy that judges you" (2026-10-13)

The owner: "check our POKPOK visual style, you should have examples generated with BytePlus and my preferences… find creative direction." · "I want all visuals in that style so the app will look like a game, but with the sarcasm of Rick and Morty in Dr HAOS style — a bit roasting."

## 1. The evidence: what the owner already chose (March 2026)
Folder `pokpok-ai/marketing/marketing materials/branding/mascot-concepts/` (Seedream/BytePlus renders, 2026-03-28; the only mascot work since is the 2D SVG for the web agent, Oct 2026).

| Round | What it is | Verdict then |
|---|---|---|
| `3d-mascot/` (17 renders: black-muzzle, dark-metallic, deep-ears, fixed-muzzle, from-flat, solid-muzzle) | **A matte-black bevelled block with ear wedges, yellow kite eyes, a pink bevelled nose — a physical toy photographed on a white table in soft studio light with a real contact shadow.** Turnaround sheets (front, three-quarter, side, back) exist. | The round the owner kept iterating (muzzle fixes, ear depth, metal vs matte). **This is the style.** |
| `style-explorations/` ceramic (teal glossy), embroidered patch, neon sign, paper cut-out | One-offs | Explored, not continued |
| `geometric-v2/`, `geometric-polish/`, `clean-0x`, `0x-v4` | 2D icon system (bar + eyes + nose), expressions sheet | The flat identity for the web; not the app's hero |

Reference renders copied to `docs/redo/reference/` (01 hero object, 02 turnaround, 03 whiskers+notch variant, 04 metallic variant, 05 ceramic not kept, 06 2D expressions).

What the spec says the character IS (`mascot-design-spec.md`, `mascot-creative-brief.md`): the POKPOK scanning bar given a face; half-lidded asymmetric eyes carry 90% of the emotion ("arrogant"); expression states Default/Scanning/Judging/Side-eye/Dead/Sleeping/Impressed ("rare — the cat is hard to impress"); "not cute, not friendly, not a cartoon cat — competent and slightly intimidating"; animation spec: blink 150/100 ms every 4–8 s, ear twitch 200 ms 5°, chin raise 400 ms 3°, side-eye 300 ms, slow blink = approval (rare), cursor/eye tracking ≤15%; X-RAY blend: "the mascot IS the diagnostic tool."

What POKPOK's visual language is (`design-system/`, live pokpok.ai): colour as section (teal authority · beige evidence · pink confrontation · yellow interrupt), hard cuts, 0 px radius, the 4 px corner notch (hundreds on the live site), `image-rendering: pixelated` logo, dither/ASCII "retro grit" ("the truth doesn't need to be polished; it needs to be raw"), Instrument Serif for feeling + JetBrains Mono for proof, "the square is the asset" for data, motion only to show a number arriving.

## 2. The direction
**One sentence:** Dr HAOS is a **real object** — the matte-black bevelled toy from the March renders — sitting in a lit **diorama** of POKPOK materials; every screen is a shot of that world, every signal is a physical prop he pushes toward you, and he narrates with Rick-and-Morty sarcasm aimed at *you*.

**Why this is the game feel the owner asked for:** games sell a *world*, not a layout. The world here is a tabletop (beige, the evidence ground), a wall (teal, authority), props in pink (confrontation) and yellow (the one action), all with the notch as their chamfer. The phone's tilt moves the camera around the diorama, so light and shadows move the way they do on a real desk. Nothing is a card; everything is a thing.

### 2.1 The hero: Dr HAOS, the toy
- Geometry: exactly the March object — bar body with chamfered edges (the notch at scale), two ear wedges, two kite eyes with heavy lids (one more closed), the pink nose block with the heart base, optional whisker slits (the `3d-mascot_4` variant). Low-poly: ~2–4k triangles, flat-shaded facets, no fur, no mouth.
- Material: matte black with a fine soft-touch grain (roughness ≈ 0.6, slight sheen on bevels), nose in matte pink, eyes in a glossy yellow with a tiny specular — exactly the render.
- Light: one soft key from upper-left, cool fill from the right, a pink rim from behind (the March renders show the pink bounce under the chin), contact shadow on the table, ambient from an off-white studio.
- Life (from the spec, extended): breathing (2.2 s), blink 150/100 ms every 4–8 s, ear twitch 200 ms, chin raise 3° when a signal is opened, side-eye toward whatever the user taps, slow blink = approval (only when a prescription is accepted), "scanning" = eyes narrow and a light sweeps the bar while he reads; "dead" X-eyes on an error; sleeping when discharged. The eyes track the finger ≤15%. A tap on him = a dismissive 0.3 s head shake + rigid haptic.
- He has **no body**. He sits. The arrogance is in the lids and the stillness.

### 2.2 The world: a diorama in POKPOK materials
- **Table** = beige matte board (evidence ground). **Wall** = teal, matte, with a faint dither grain in the far corners (retro grit, barely). **Props** = pink (a signal he's unhappy about), beige (a plain signal), **red** (a competitor), yellow (the one prescription — a stamped tag).
- Every prop is a chamfered block (the notch is the bevel). Signals are **plates** laid on the table with the headline printed on them; the ℞ is a **yellow tag** that slides out from under his chin when he's decided; the "discharged" state is him turning away and the lights dimming.
- Camera: ¾ view, 34° FOV, slightly above table height; the **gyroscope orbits the camera ±12°** around the diorama (never the objects), so the key light stays put and every shadow slides — the thing the owner asked for.
- Text is printed on props *and* laid over the shot in the UI layer — the big headline (Geist 40+) lives in the UI layer so it is always readable; small print on props is decoration.

### 2.3 The voice: Rick-and-Morty sarcasm, Dr HAOS style, roasting the founder
From the POKPOK voice canon plus the owner's ask. Rules for every line he says:
1. He talks **to you**, second person, and the joke is at your expense, never at the news.
2. The roast must carry a **receipt** (a number, a competitor, a date) or it's sludge.
3. One beat of contempt, then the useful part. 22 words max. No exclamation marks. No "lol".
4. He never flatters. "Impressed" is a slow blink and one dry line ("Fine. That one was worth your morning.").
5. He is bored by routine and alive for a competitor: code red gets a different register (sharper, faster, shorter).

Examples (model lines, not output):
- Opening: "Three things moved while you were sleeping. One of them is a *competitor*. I read all 170 so you'd only have to pretend to."
- Signal: "Luxury demand cooled and you planned a price rise. Bold. Your reviews said this in July; nobody read them. I did."
- Code red: "Jungle Scout shipped your product. Cheaper, dumber, *first*. Receipts below. Try not to panic in the elevator."
- ℞ accepted (slow blink): "Noted. It'll still be your fault, but now it's a smaller one."
- Skip: "Skipped. I'll remember that. I remember everything."
- Discharge: "Nothing else is wrong with you today. *Sadly.* Go build something. Come back tomorrow; I don't sleep."

### 2.4 Type and colour in the UI layer
- Headline: Geist SemiBold 40–44 pt (the first prototype's contrast); body Geist 17–19; meta JetBrains Mono 11 uppercase; **his lines in Instrument Serif italic** (the only serif) in pink on teal or white on red.
- Three sizes per screen, max. One yellow element per screen (the action). Red only for competitors.
- Colours exactly POKPOK's: teal #0A3B44 · beige #E8E0D1 · pink #FFC4D6 · yellow #F5F900 · off-white #FDFDFC · critical red; the mascot's black is #0E0E0E matte (the March render), not teal.

### 2.5 What this is NOT
Not a card list with a 3D face on top (what was built tonight). Not a cartoon. Not neon, not ceramic (explored and dropped). Not gradients, not glass. Not "cute": the humour is dry and the object is slightly intimidating.

## 3. How we'll know it's right (test, in the owner's hands)
- Open the app: within 2 s you see the toy on its table, lit, breathing; tilt the phone and the shadow moves. If a screenshot of it could be mistaken for a product photo of a desk toy, it's right.
- Three signals, one yellow tag each, under 90 s; a visible exit on every screen; the tab bar always there.
- Read five of his lines aloud: each has a receipt and a roast; none could be from a generic assistant.

## 4. Next (in order, no Swift yet)
1. Best practices (01) and the 3D stack (02) — running.
2. **Model the toy** as a real asset (USDZ/GLB): Blender or a generative-3D pass from the March renders + cleanup; bake AO; export at ~3k tris. Reference: `docs/redo/reference/01-hero-object.jpeg`, `02-turnaround.jpeg`.
3. **Playable diorama in the phone's browser** (Three.js): toy + table + wall + lights + gyroscope orbit + one signal plate + the ℞ tag + his lines in the UI layer. The owner tests it live.
4. UX plan on top of the diorama (flows, exits, states), then native.
