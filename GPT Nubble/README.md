# Nubble — make information earn your attention

**Full → Short → So what?**

A **nubble** connects the available original to what matters for your focus and what could change in your next decision. [Why the name works](WHAT_IS_NUBBLE.md).

![Nubble's proposed source, relevance, and implication framework](figures/nubble-framework.png)

**Research release v0.2.** This is a working methods paper and reproducible artifact toolkit. It contains no controlled Nubble effectiveness result, production inference engine, or public Cloud service. The existing reader and private Control Room motivate the method; their implementation is not included in this standalone package.

## Read the paper

**Beyond the Summary: Nubble and the So-What Layer**
*Evidence-linked decision support under an attention budget*

[Paper PDF](output/pdf/nubble-method-paper.pdf) · [Manuscript source](paper/manuscript.md) · [17-study literature review](research/LITERATURE_REVIEW.md) · [BibTeX](paper/references.bib)

The research question is whether explicit conditional implications and decision options improve decisions beyond personalized summaries, within the same total attention budget. Close prior work already addresses decision-focused and personalized action-oriented summaries; our contribution is a proposed inspectable contract and the experiment needed to test it.

## Three representations, three jobs

| Representation | Reader's question | Requirement |
|---|---|---|
| **Full** | What does the source actually say? | Preserve the available original and label incomplete retrieval. |
| **Short** | What matters to my focus? | Select supported facts for an explicit goal and pending decision. |
| **So what?** | What could this change, and what should I consider next? | Separate facts, assumptions and implications; propose feasible action, verification, monitoring, maintaining the plan, or abstention. |

Reading depth is a separate control. Generated expansion cannot recreate an unavailable original. “Maintain the plan” and “insufficient evidence to recommend” are different outcomes.

## Open source and paid Cloud

**Open source lets you nubble an article. Cloud keeps watch and tells you when something changes your situation.**

The proposed open core accepts content and context supplied by the reader. The proposed paid product finds, follows, connects, and prioritizes developments continuously for that business. The paper and research reproduction assets remain public.

| Open core: you bring the signal | Paid Cloud: Nubble keeps watch |
|---|---|
| A supplied article/document and explicit context | Maintained source coverage and competitor/market watchlists |
| Single-item Short and So what? reference method | Continuous collection, change detection, and event history |
| Source links, uncertainty, and inspectable output | Cross-source checks, deduplication, and conflict/freshness handling |
| Manual, on-demand use | A finite prioritized brief and material-change alerts |
| Proposed next step for the item | Ongoing business context and decision follow-up |

This is the **recommended product boundary**, not a list of currently shipped Cloud features. Team collaboration is deferred. The current v0.2 release ships paper/tooling/fixtures; a runnable single-item inference core is a subsequent milestone. See [CORE_VS_CLOUD.md](CORE_VS_CLOUD.md) for exact exclusions and release stages.

## Try the offline artifacts

No account, model key, network request, or private dashboard access is needed:

```bash
python3 scripts/validate_release.py
python3 -m unittest discover -s tests -v
```

Inspect the [human-readable example](examples/competitor-update.md) and [structured fixture](examples/nubble-example.json). The same fictional source produces a verification proposal, a maintain-plan recommendation, and abstention for three different contexts. These are hand-authored examples, not model outputs or benchmark results.

The validator checks structure, references, declared numeric/authority constraints, and local document links. It cannot determine the truth of an implication or whether a real decision will succeed. If `jsonschema` is installed, it additionally evaluates the complete published schema; the default checks use only Python's standard library.

## Rebuild the artifacts

Use Python 3.10+ in a virtual environment. Figure/PDF authoring requires the pinned packages in [requirements.txt](requirements.txt); the validator/tests do not.

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 scripts/build_bibliography.py
python3 scripts/make_figures.py
python3 scripts/make_business_boundary.py
python3 scripts/build_paper.py
python3 scripts/package_release.py
```

PDF builds use the open font family documented in the renderer, with an explicit font-directory option. Review rendered pages after any manuscript or typography change. Conceptual diagrams are supplied as editable/reproducible SVG and PNG; no chart represents measured Nubble performance.

## Repository map

| Material | Location |
|---|---|
| Definition, contract, and failure taxonomy | [WHAT_IS_NUBBLE.md](WHAT_IS_NUBBLE.md), [METHOD.md](METHOD.md) |
| Manuscript, PDF, and references | [Manuscript](paper/manuscript.md), [PDF](output/pdf/nubble-method-paper.pdf) |
| Primary-source synthesis and access/version limits | [Literature review](research/LITERATURE_REVIEW.md), [Source index](research/sources.json) |
| Proposed study and draft annotation rubric | [Protocol](evaluation/PROTOCOL.md), [Rubric](evaluation/annotation-rubric.csv) |
| Prompt contract and structured output | [Prompts](prompts/nubble.md), [Schema](schemas/nubble.schema.json) |
| Original diagrams and captions | [Figure manifest](figures/README.md) |
| Product and licensing boundaries | [Product boundary](CORE_VS_CLOUD.md), [Licensing strategy](LICENSE_STRATEGY.md) |

## Contribute and cite

Bring a missed caveat, a justified profile-swap failure, an inappropriate action, or an independent reproduction. [Contribution guide](CONTRIBUTING.md) · [Citation instructions](CITATION.md) · [Security reporting](SECURITY.md) · [Change log](CHANGELOG.md).

## Licensing

New software tooling is **AGPL-3.0-only**. The original paper, diagrams, prompts, schema and fictional fixtures are **CC BY 4.0**. Commercial use is permitted under the applicable obligations; a managed service may be sold separately. [License scope](LICENSE.md) · [AGPL text](LICENSE) · [Third-party notices](NOTICE.md).

The license applies to this research release, not the parent application's entire history or third-party materials. Previous grants remain relevant. No DOI, peer-review status, effectiveness result, or Cloud availability is implied.
