# Creative direction v2 — "Painted machines, open wires" (2026-10-13, 22:50 Warsaw)

**v1 of this file (commit 5a97ee2, "the toy that judges you") is withdrawn.** It was built from the mascot folder;
the owner: *"no FIND STYLE CREATIVE DIRECTION! it is not DR HAOS it is other folder"* · *"it is not flat design at all
it is material and colors of pokpok and specific creative metaphors"*. The direction lives in
`~/dev/pokpok-ai/marketing/pokpok-cd` (378 owner votes over 1,785 renders) and the `pokpok-creative` skill.

## 1. The owner's words tonight
- *"i want all visuals in that style so app will look like game but with sarcasm of rick and morty in DR HAOS style a bit roasting"*
- *"check this style: round-13__W-crown__linocut.png"* · *"linocut"* · *"or like this: round-13__W-microphone__painted.png"*
- *"yes i like round-13__W-scanner-wrong__painted.png — so all buttons in app could be like physical objects
  unconventionally, all connected with open wires. i need like transparent functionality"*
- *"i need a bit absurd provocative but meaningful"*

## 2. The three pictures he pointed at, and what each gives the app

| Picture (favourites/) | The prompt that made it (tools/r13.py, verbatim) | What the app takes from it |
|---|---|---|
| `round-13__W-scanner-wrong__painted.png` | *"{bottle} lying face down on the glass of a photocopier with the yellow scan bar mid-sweep beneath it, and the sheet sliding out of the tray shows the printed shape of a completely different object"* | **The machine.** A pink painted photocopier, yellow glass, a tray that prints. The product goes in, a verdict comes out — and the machine can be wrong. This is the app's control: a physical instrument, not a button. |
| `round-13__W-microphone__painted.png` | *"{bottle} standing alone in front of a large yellow studio microphone in a dark padded recording booth, one pink acoustic panel behind, mid-sentence"* | **The room and the wire.** A padded teal booth (floor + wall), one pink panel, one yellow light, and a yellow cable that runs visibly from the mic to the wall socket. Every connection in the app is a cable you can follow. |
| `round-13__W-crown__linocut.png` | *"{bottle} standing alone wearing an enormous elaborate pink crown far too large for it, tilting and about to slide off, one yellow light above"* | **The print register.** Flat opaque ink on paper tooth, three colours, gouge chatter on every edge. The sheets the machines print, the ℞, the tags and stamps are linocut. The joke is in the situation (the crown is too big), never in the object. |

The two style blocks, verbatim from `tools/r13.py` (keep word for word in any render):
- **painted** — *"Static 16:9 image in the style of a realist oil painting - hand-painted with rich tonal modelling, soft gradients, deep painted shadows with colour in them, visible brushwork. Fully modelled by brush, never flat. Painted, not photographed and not rendered."*
- **linocut** — *"Static 16:9 linocut print. Bold carved shapes with the nicked chatter of a gouge along every edge, flat opaque ink on visible paper tooth, tiny gaps where the block did not take. Printed by hand, never photographed, never rendered."*

His favourites by style (`tools/favs.py`, 120 stars): painted 35 · linocut 30 · riso 18 · chalk 13 · moulded 2.

## 3. The direction in one sentence
**Nubble is Dr HAOS's consulting room, painted the way POKPOK paints: every control is a physical machine (pink and
teal painted plastic, one yellow light, real shadow), every connection is an open yellow cable you can follow with your
eye, and nothing happens behind a panel — the feed runs into the scanner, the scanner's tray prints the signal, the ℞
comes out of a stamp, and the machine is allowed to be wrong, which is where the roast lives.**

"Transparent functionality" (his words) = the wiring IS the information architecture. You do not read a menu; you see
which socket the cable goes into.

## 4. Rules carried over from the measured direction (receipts: `pokpok-cd/STATUS.md`, `pokpok-creative/SKILL.md`)
1. **Scenes, not objects.** Every starred picture is 2–3 things in a relationship. A lone button on a flat field is the rejected kind.
2. **A world, not a void.** A floor and a back wall; dust and debris pooled at the base of things; a corner. The phone screen is a room.
3. **Made by a hand.** Painted or printed; visible brushwork or paper tooth. "Moulded / CGI-clean" is DEAD (6% of votes). No gloss, no gradients-as-design, no glass.
4. **Allegory with a "before".** Something already happened and you arrive after: the sheet already printed the wrong object. The world carries the joke.
5. **Colour law.** Teal field (`#0A3B44` family) for every object's own body; **one** soft pink human thing (a panel, a pad, a tag, the machine's shell); **yellow is the light** and the live wire. Near-black everywhere else. Real-world materials restated as teal at the object. The words "metal / steel / chrome" never appear in a prompt (renders steel).
6. **The machine must fail or misread.** "A machine doing its job correctly" is inert (anti-patterns 14, worked example "the self-checkout"). Dr HAOS's instruments misprint, over-measure, over-tag — that is the Rick-and-Morty register: the roast is in what the machine did to *your* product.
7. **Deadpan, as a caption.** Two flat sentences under the picture; the sarcasm never lives in the image. In the app, Dr HAOS's line is the caption under the machine.
8. **Not the mascot.** STATUS.md: *"Not the mascot. The cat is a separate programme."* The flat SVG cat does not sit on top of a painted world. How Dr HAOS is present is the one open decision (§7).

## 5. The vocabulary of machines (first list — the concept step chooses, the owner picks)
Each is a real object he would recognise in one word, in his painted/linocut register, with a cable.

| What the app does today | The machine | The wire | The failure that makes it funny |
|---|---|---|---|
| Sources (15 RSS feeds, editable) | A row of wall sockets; each source is a yellow cable plugged into a pink junction box | Unplug = remove; plug = add. The cable is the source. | One socket sparks (a dead feed, 13 of 15 worked tonight) |
| Reading + ranking (~50 s on the phone) | The photocopier: stories lie on the glass, the yellow bar sweeps | From the junction box into the copier | The sweep is real work time, shown, not a spinner |
| A signal (00–03) | A printed sheet sliding out of the tray (linocut, paper tooth) | — | The copier prints "a completely different object" — the headline is what the world printed about *you* |
| Code red (a competitor) | The sheet comes out pink; a beacon wired to the copier turns | A short cable from copier to beacon | The beacon is already turning when you arrive |
| Depth 00–04 | A stack of sheets under the tray, or a dial on the copier's side | — | Deeper = more sheets, same machine |
| His verdict (the voice) | The padded booth and the yellow mic | Mic cable to the socket | He's mid-sentence when you walk in |
| ℞ Prescribe | A rubber-stamp machine; press = stamp + rigid haptic | Copier → stamp | The stamp is slightly off the sheet |
| Skip | The shredder (round-12 `S-conveyor-shred__painted` is in his favourites) | Copier → shredder | It keeps a strip |
| Watchlist (competitors) | The lineup chart on the wall (`print-100__PR-hm-lineup__riso`) | — | Everyone looks the same |
| Discharge | The yellow light goes off; one cable left unplugged on the floor | — | "Nothing else is wrong with you today. Sadly." |

Two or three machines per screen, never more: "reduce to one object, or one object repeated" (skill §method 4).

**The three tests every machine passes — his words: "a bit absurd, provocative, but meaningful"** (they are the skill's own
tests, anti-patterns 6 and 14, worked example "the self-checkout"):
1. **Absurd** — would this object normally be here? If yes, kill it. A photocopier reading the news is absurd; a news list is not.
2. **Provocative** — what does it accuse? The copier prints a *different object* than the one on its glass: that is what the
   market did to your product this morning. A machine that merely works accuses nobody.
3. **Meaningful** — name the real function in one word without being told: scanner = reading, tray = the signal, stamp = ℞,
   shredder = skip, socket = a source. If a person needs the caption to know what the machine does, it is decoration.
Example that passes all three: *the yellow scan bar sweeps for exactly as long as the phone's model is reading (50 s tonight);
the sheet that comes out names a competitor you never mentioned.* Example that fails: a pink button labelled "Refresh".

## 6. Motion and 3D — "a painting that moves"
The owner's standing asks (gyroscope moves the shadows; engaging like a game; ultra quality) stay. The world is built
as real 3D so the key light stays put and shadows slide with tilt — but it is RENDERED painted/linocut: flat opaque
colour bands, hard shadow shapes with colour in them, ink edges with gouge chatter, paper tooth or brushwork over
everything, one yellow light. Cables are physics ropes: they swing with tilt and tug a beat before a tray prints
(anticipation). The 3D-stack research (`02-3D-STACK-…`) is re-pointed at this question.

## 7. How Dr HAOS is present — answered by the folder's root (owner: "/marketing/pokpok-cd", 23:05)
The folder root holds the owner's FIRST references (1 Aug 2026, `generations/Screenshot 2026-08-01 at 13.20.*.png`, the three
`jimeng_*.mp4` clips) and the round log's verdict on them (`ROUND-LOG.md` lines 258–272):

> *"Goose in a suit walking through a clinic waiting room, yellow chairs, teal speckled floor, first-person POV with the
> viewer's own knees in shot · Shark on a video call · Whale beached on the driveway. One world: **real animals, played
> completely straight, in mundane institutional settings. Teal, yellow, pink. Locked camera, film grade, deadpan.** …
> the animal-in-an-institution register is the stronger idea."*

And the house already painted the cat: `generations/round-14/A-cat-polygraph__painted.png` — *"one pink cat sits upright on the
table with thin pink sensor wires taped to its chest running to a small polygraph machine whose needle is scratching a violent
jagged line on a rolling yellow chart"* — a pink cat, wired to a machine, under one yellow lamp, deadpan. That is Dr HAOS's
register in the house style, and it is the owner's "open wires" picture a month early.

**So: A, not B.** Dr HAOS is a **real pink cat, played completely straight**, in a doctor's coat, in a mundane consulting room
(teal walls, yellow chairs, one lamp) — the same programme as the goose in the suit and the bear at "BRAND CONSULTANT ROOM 12B".
The camera is the house camera: **first person, locked, the user's own knees or hands in shot** — you are the patient; he
leans over you the way the doctor in the clips does (`reference/cd-14-ref-clip-doctor-leans-over-you.jpg`), with a magnifier,
a stethoscope, a lamp. Your product lies on the table between you. The gyroscope is your head moving on the table: the lamp's
shadow and his face shift with it. Nobody reacts; the sarcasm is the caption.
- Not the SVG mascot (flat), not the bevelled toy (moulded is dead), not "cute": a real cat with half-lidded eyes, fur painted
  by brush, in the painted block verbatim; the goose sheet (`generations/goose/SHEET-GOOSE-10-STYLES.jpeg`) shows the painted
  register (B) holds for an animal character where moulded/resin/cel do not.
- The machines of §5 are the instruments on his desk, wired with the same open yellow and pink cables as the polygraph.
- References copied to `reference/cd-10…cd-14` and `cd-20…cd-22`.

## 8. Type and colour in the UI layer (unchanged from v1)
Geist SemiBold 40–44 pt headlines over Geist 17–19 body (the first prototype's contrast); JetBrains Mono 11 for receipts; **his
lines in Instrument Serif italic**, pink on teal. Three sizes per screen, one yellow element (the live wire / the action), red
only for competitors. Text sits in the UI layer; small print on the machines is decoration.

## 9. How we'll know it is right
- A screenshot with the text covered could pass as the 121st star in `favourites/`.
- Every control is a thing with a cable; you can say in one word what each machine is.
- Cover the caption: the picture still says what the machine did to your product.
- Tilt the phone: the shadow under the copier moves, the cables swing.

## 10. Next (no Swift)
1. Three concept variants, each with ONE key frame rendered in the house style (Seedream, the two style blocks verbatim,
   through `tools/prompt_lint.py`) — the owner picks.
2. UX plan on the chosen variant (flows, exits, states, the cable map).
3. Playable prototype in the phone's browser; the owner tests.
