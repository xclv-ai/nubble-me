# Nubble — make information earn your attention

**Full → Short → So what?**

A **nubble** connects the available original to what matters for your focus and what could change in your next decision. [Why the name works](WHAT_IS_NUBBLE.md).

![Nubble's proposed source, relevance, and implication framework](figures/nubble-framework.png)

**Research release v0.3.** This is a working methods paper and reproducible artifact toolkit. It includes analytical results, a hypothetical decision model, and an archived prototype metadata audit. It contains no controlled Nubble effectiveness result, production inference engine, or public Cloud service. The existing reader and private Control Room motivate the method; their implementation is not included in this standalone package.

## Read the paper

**Beyond the Summary: Nubble and the So-What Layer**
*Evidence-linked, context-dependent decision support under limited attention*

Viktor Konovalov · Independent Researcher

[Paper PDF](output/pdf/nubble-method-paper.pdf) · [Manuscript source](paper/manuscript.md) · [Literature review: 17 studies + 2 foundations](research/LITERATURE_REVIEW.md) · [BibTeX](paper/references.bib)

The paper defines an inspectable contract, characterizes decision-sufficient compression and an ideal-observer limit, calculates verification tradeoffs, and audits 50 archived records. Whether the So-What layer improves human decisions remains an open empirical question. Close prior work already addresses decision-focused and personalized action-oriented summaries.

For arXiv preparation, use the [submission guide](paper/SUBMISSION.md) and [portable source ZIP](dist/nubble-arxiv-draft-v0.3.zip). The PDF and source compile; arXiv and the sole author's identity/contact details are confirmed; final author review remains required before submission.

## Three representations, three jobs

| Representation | Reader's question | Requirement |
|---|---|---|
| **Full** | What does the source actually say? | Preserve the available original and label incomplete retrieval. |
| **Short** | What matters to my focus? | Select supported facts for an explicit goal and pending decision. |
| **So what?** | What could this change, and what should I consider next? | Separate facts, assumptions and implications; propose feasible action, verification, monitoring, maintaining the plan, or abstention. |

Reading depth is a separate control. Generated expansion cannot recreate an unavailable original. “Maintain the plan” and “insufficient evidence to recommend” are different outcomes.

## Open source and paid Cloud

**Paid: give us your focus or project URL. We'll do the rest.**

![Nubble open source and paid Cloud: give us your focus or project URL](figures/nubble-open-source-cloud-handdrawn-v2.png)

With open source, you bring an article and set your focus. With the proposed paid service, you provide your focus in a few words or share your project's URL. Nubble finds relevant news, watches competitors where relevant, explains the impact on your project, suggests next steps, and alerts you to important changes. The paper and research reproduction assets remain public.

| Open source: you bring the article | Paid Cloud: you provide the focus or project URL |
|---|---|
| Add an article | Find relevant news |
| Set your focus | Understand your project from your focus or URL |
| Read its summary and ask So what? | Watch competitors and explain changes that affect you |
| Check sources and save the result | Suggest next steps and send important alerts |

This is the **proposed product boundary**, not a list of currently shipped Cloud features. The v0.3 release ships research artifacts and tooling; the runtime and paid service remain planned. See [CORE_VS_CLOUD.md](CORE_VS_CLOUD.md) for the scope and delivery stages.

## Try the offline artifacts

No account, model key, network request, or private dashboard access is needed:

```bash
python3 scripts/validate_release.py
python3 -m unittest discover -s tests -v
```

Inspect the [human-readable example](examples/competitor-update.md) and [structured fixture](examples/nubble-example.json). The same fictional source produces a verification proposal, a maintain-plan recommendation, and abstention for three different contexts. These are hand-authored examples, not model outputs or benchmark results.

The validator checks structure, references, declared numeric/authority constraints, and local document links. It cannot determine the truth of an implication or whether a real decision will succeed. If `jsonschema` is installed, it additionally evaluates the complete published schema; the default checks use only Python's standard library.

## Rebuild the artifacts

Use Python 3.10+ in a virtual environment. Figure authoring requires Matplotlib from [requirements.txt](requirements.txt). PDF builds additionally require a separately installed [Tectonic](https://tectonic-typesetting.github.io/book/latest/installation/) or latexmk/pdflatex; the validator/tests use only the standard library.

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 scripts/build_bibliography.py
python3 scripts/analyze_paper.py
python3 scripts/make_figures.py
python3 scripts/make_business_boundary.py
python3 scripts/build_paper.py --engine tectonic --package
python3 scripts/package_release.py
```

PDF builds use standard LaTeX and Latin Modern fonts. Four scientific figures comprise three conceptual diagrams and one calculated hypothetical model; no chart reports measured Nubble effectiveness. The commercial comparison assets remain separate. See the [figure manifest](figures/README.md) and [submission guide](paper/SUBMISSION.md) for provenance and reproduction.

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
