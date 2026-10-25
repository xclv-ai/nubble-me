# Figure provenance and reproduction

The manuscript uses four original scientific figures: three conceptual diagrams and one calculated hypothetical model. None reports measured Nubble effectiveness or a completed human/LLM experiment. Two separate product illustrations describe the proposed open-source/Cloud boundary and are excluded from the arXiv upload.

Original text, PNG/SVG diagrams, and this manifest are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), attributed to Nubble project contributors. Generation scripts are AGPL-3.0-only. The diagrams are original syntheses, not copied from the cited research. No private screenshots or third-party source images are redistributed. See [license scope](../LICENSE.md).

## Reproduce

```sh
MPLCONFIGDIR=/private/tmp/nubble-mpl python3 scripts/make_figures.py
MPLCONFIGDIR=/private/tmp/nubble-mpl python3 scripts/analyze_paper.py
MPLCONFIGDIR=/private/tmp/nubble-mpl python3 scripts/make_business_boundary.py
```

Requires Matplotlib 3.10.9; scripts use its DejaVu fonts and fixed export metadata. Conceptual diagrams use 240 dpi PNG and editable SVG. The analysis exports numerical values alongside its plot. Identical Python/Matplotlib/font environments are needed for byte-identical plot regeneration. The AI-generated marketing PNG is not reproduced by these scripts. Figure numbers are manuscript captions, not baked into the diagrams.

## Manuscript Figure 1: three representations

- Files: `nubble-framework.png`, `nubble-framework.svg`.
- Method: `scripts/make_figures.py`.
- Caption: Full preserves the available original, Short selects supported information for reader context, and So what? offers conditional implications and feasible options. Evidence and context support both generated views; generated prose does not recreate missing original content.
- Alt text: Three linked cards for Full, Short, and conditional implications, with separate context and direct source-evidence paths.
- Evidence status: conceptual method diagram; no empirical result.

## Manuscript Figure 2: evidence and decision graph

- Files: `nubble-evidence-graph.png`, `nubble-evidence-graph.svg`.
- Method: `scripts/make_figures.py`.
- Caption: Source assertions, reader context, and assumptions have distinct roles in supporting a conditional inference and proposed option. Citation presence does not prove an inference valid or an action feasible.
- Alt text: Typed premise cards feed an inference and a proposed option, with five outcomes below: act, verify, monitor, maintain, abstain.
- Evidence status: conceptual contract; no performance result.

## Manuscript Figure 3: verification model

- Files: `nubble-verification-model.png`, `nubble-verification-model.svg`.
- Method: `scripts/analyze_paper.py`; inputs and outputs in [paper/analysis](../paper/analysis/verification_model.json).
- Caption: Expected utilities and preferred decisions under declared fictional payoffs. Panel A fixes verification cost at 0.5; panel B varies cost and eligibility probability, assuming verification fits the time budget. These are calculated values, not model-confidence estimates or human observations.
- Alt text: The left panel plots maintain at zero, act as 10p minus 4, and perfect verification as 6p minus 0.5. The right panel separates maintain, verify, and act regions as probability and verification cost vary.
- Evidence status: reproducible mathematical illustration under explicit assumptions. Perfect verification, supplied probabilities, and arbitrary utility units are limitations.

## Manuscript Figure 4: prospective study

- Files: `nubble-study-design.png`, `nubble-study-design.svg`.
- Method: `scripts/make_figures.py`.
- Caption: Proposed comparison of original access, generic summary, personalized summary, and personalized summary plus So what?. Arms share total review time and source access; C and D share context and total generated-word budgets. Outcomes require blinded assessment.
- Alt text: Matched evidence, context, and task inputs enter four randomized display conditions and then decision-quality and evidence/error assessment.
- Evidence status: future study design; no results shown.

## Product illustration: open core and Cloud

- Files: `nubble-open-core-cloud.png`, `nubble-open-core-cloud.svg`.
- Method: `scripts/make_business_boundary.py`.
- Caption: The research/open-source workflow uses supplied content and context. Proposed paid Cloud finds relevant updates and maintains the ongoing workflow for a supplied focus or project URL. Runtime and hosted features remain planned.
- Alt text: A teal core-method panel and amber ongoing-service panel show the proposed boundary.
- Evidence status: product scope; excluded from the scientific manuscript.

## Product illustration: your focus or project URL

- File: `nubble-open-source-cloud-handdrawn-v2.png`.
- [Generation prompt](nubble-open-source-cloud-handdrawn-v2.prompt.txt).
- Method: built-in image generation, editing an earlier Nubble sketch in the user's requested hand-drawn style. The user's reference image is not redistributed. Prompt reuse does not guarantee the same image.
- Caption: Open-source steps include supplying an article and focus, reading the summary and So what?, checking sources, and saving. Paid Cloud adds finding relevant news, watching competitors, understanding the project, explaining impact, suggesting next steps, and sending important alerts. “Give us your focus or project URL. We'll do the rest.”
- Alt text: Twelve pastel line icons under nested open-source and paid-Cloud braces, with the paid promise below.
- Evidence status: proposed product scope; excluded from the scientific manuscript. Original project asset under the research license, to the extent applicable rights exist.
