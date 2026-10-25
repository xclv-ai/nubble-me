# Nubble conceptual figures

All three figures are original diagrams created for the Nubble Method research
proposal. They illustrate proposed representations, reasoning requirements and
an evaluation design. **They contain no observations, estimated effects,
performance scores or empirical results.** The diagrams are not third-party
adaptations; their substantive source is the proposed Nubble method in this
repository (`METHOD.md` and `PAPER_PROPOSAL.md`). They are not application
screenshots or reports of measured results. No third-party images or fonts are
bundled.

The original SVG and PNG diagram assets and this caption/alt-text manifest are
licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
Attribution: **Nubble project
contributors**. The generation script is licensed separately under
AGPL-3.0-only. See the repository's license notices for scope and terms.

## Reproduce

From the repository root:

```sh
MPLCONFIGDIR=/private/tmp/nubble-mpl python3 scripts/make_figures.py
```

Requires Python 3 and Matplotlib (tested with Matplotlib 3.10.9). No network,
external assets or package installation is required. The script uses the built-in
DejaVu Sans and DejaVu Serif fonts. PNGs use 240 dpi; SVGs retain editable text.
Colors, geometry, SVG identifiers and export metadata are fixed so that rerunning
with the same Matplotlib/font environment produces byte-identical files.

## Figure 1 — Three representations, one source of evidence

- Files: `nubble-framework.svg`, `nubble-framework.png`.
- Caption: Nubble retains the available original, generates a short personalized
  selection and proposes a conditional implication with a feasible next step.
  Explicit reader context guides selection and interpretation. Source evidence
  supports both generated views, which retain direct access to the original;
  generated prose never reconstructs the original. Proposed framework; no
  performance results.
- Source: Original synthesis of the Nubble method; no external visual source.
- Alt text: A horizontal three-card pipeline moves from Full, the preserved
  original and source spans, to Short, a personalized source-supported selection,
  to So What, a conditional implication and feasible next step. Above it, a reader
  context card lists goal, current plan, constraints and decision horizon; dashed
  arrows connect it to Short and So What. A direct support path also connects the
  original to the implication. A note states that both generated views link to
  the original and never regenerate it.

## Figure 2 — From evidence to a conditional next step

- Files: `nubble-evidence-graph.svg`, `nubble-evidence-graph.png`.
- Caption: Source facts linked to exact source spans, explicit reader context and
  separately labeled assumptions support a conditional inference. That inference
  supports a feasible proposed action. Possible decision statuses include act,
  verify, monitor, maintain the plan and abstain. Supported inaction is distinct
  from abstention due to insufficient evidence or unresolved risk. Proposed
  framework; no performance results.
- Source: Original synthesis of the Nubble method; no external visual source.
- Alt text: Source facts and explicit reader context feed a central conditional
  inference, with a separate assumptions card feeding it through a dashed arrow.
  The inference points to a proposed action linked to evidence and constraints.
  A source-evidence line remains available across the graph. Five status cards
  below read Act, Verify, Monitor, Maintain plan and Abstain. Maintain plan means
  supported inaction because no change is warranted; Abstain means insufficient
  evidence or unresolved risk.

## Figure 3 — A study to isolate the So-What Layer

- Files: `nubble-study-design.svg`, `nubble-study-design.png`.
- Caption: A proposed randomized study compares original-only access (A), a
  generic summary (B), a personalized summary (C) and a personalized summary plus
  a So-What Layer (D). All arms receive equal total time and original-source
  access, with counterbalanced source/context/task blocks. C and D have the same
  total generated-word budget. Blinded assessment measures decision quality,
  evidence support, unsupported claims, context/action errors and appropriate
  inaction. No empirical results are shown.
- Source: Original proposed Nubble evaluation design; no external visual source.
- Alt text: Matched source, reader-context and decision-task inputs enter a
  representation randomization. Four horizontal arms show A Original only,
  B Generic summary, C Personalized summary and D Personalized plus So What.
  All feed blinded assessment of decision quality and support/error metrics.
  A shared control strip states equal total time and original-source access for
  all arms, counterbalanced task blocks, and equal total generated-word budgets
  for C and D, including D's So-What text. The figure shows no outcome values.
