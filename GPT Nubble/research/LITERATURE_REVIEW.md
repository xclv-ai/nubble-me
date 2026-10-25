# What the closest research changes about Nubble

**Research date:** October 25, 2026. **Coverage:** a focused, non-exhaustive review of 17 primary studies, supplemented in v0.3 by two foundational sources on attention and decision-sensitive display. Nine address related summarization systems and eight address evaluation, evidence, selectivity, or human decision support. Relevant in-body passages were inspected for all 17; this does not mean all pages of every paper were read. Some records are preprints. Exact versions and access restrictions are retained in [related-work-sources.json](related-work-sources.json) and [evaluation-sources.json](evaluation-sources.json); the two foundations have a separate [ledger](foundations-sources.json).

## The conclusion that most changes the paper

Personalized summaries, decision-focused content selection, and summary-to-recommendation pipelines already exist. Nubble cannot support a claim to have invented any of them. Its candidate research contribution is an **inspectable contract connecting evidence, reader context, conditional implications, feasible options, and appropriate restraint, evaluated within the attention the interaction consumes**.

This is a synthesis and a research question. The review does not establish that nobody has previously combined these requirements, nor that Nubble's combination improves decisions.

## The closest precedents

| Study | Relevant established idea | Consequence for Nubble |
|---|---|---|
| [Decision-Focused Summarization, EMNLP 2021](https://aclanthology.org/2021.emnlp-main.10/) | Selecting text to support downstream prediction/decision behavior. | Use a strong decision-focused baseline; do not claim the decision objective is new. |
| [PersonalSum, NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/b3c318cd7ee132d8a6b1895a2d6436c7-Abstract-Datasets_and_Benchmarks_Track.html) | Reader-specific news summaries and source sentence links. | Separate explicit current decisions from general preference profiles. |
| [SumRecom, preprint 2024](https://arxiv.org/abs/2408.07294) | Preference learning through user feedback. | Count elicitation and feedback time in total attention cost. |
| [Reader modeling with Rational Speech Acts, preprint 2024](https://arxiv.org/abs/2411.06524) | Reader-answer reconstruction guides summary choice. | Validate comprehension proxies against actual readers and decisions. |
| [Financial-news personalized implications/recommendations, preprint 2025](https://arxiv.org/abs/2511.05508) | Direct summary → relevance → implications → investment recommendations. | Compare against a staged-prompt baseline; a So-What label alone is not a contribution. |
| [Comparative personalized MDS, preprint 2025](https://arxiv.org/abs/2509.21562) | Structured user analysis and personalization. | Keep style, reader relevance, and decision quality separate. |
| [Re-FRAME / SCOPE, Findings of EMNLP 2025](https://aclanthology.org/2025.findings-emnlp.1094/) | Fact representations plus reader knowledge, goals, urgency, and context. | Make the context correctable and test its individual fields. |
| [Information Satisfaction, 2026](https://doi.org/10.1145/3834580.3838749) | Reader-owned goals and reader-centered evaluation. | Do not substitute an LLM persona judge for the actual reader. |
| [Extrinsic summary evaluation, LREC-COLING 2024](https://aclanthology.org/2024.lrec-main.821/) | Measuring task accuracy and time rather than summary ratings alone. | Track the speed-quality tradeoff; improved speed can accompany worse task performance. |

The table records features established by the inspected material. An omitted feature means **not established here**, not “absent from every version of the system.” The financial-news paper is used as a close system precedent; its workshop publication status and decision-outcome evidence are not treated as independently verified efficacy.

## Evidence quality and human decisions are different constructs

[ALCE](https://aclanthology.org/2023.emnlp-main.398/) and [Liu, Zhang, and Liang](https://aclanthology.org/2023.findings-emnlp.467/) motivate separate evaluation of factual premises, citation support, and evidence coverage. Nubble adds an additional distinction: a supported premise does not validate a causal implication or a proposed action. The release's atomic-claim rubric is an adaptation, not a reproduction of those studies' original metrics.

[Bansal and colleagues](https://doi.org/10.1145/3411764.3445717), [Buçinca and colleagues](https://doi.org/10.1145/3449287), and [Vasconcelos and colleagues](https://doi.org/10.1145/3579605) show why explanations, acceptance, effort, and human-AI outcomes must be evaluated separately. Their findings come from specific experimental tasks. They motivate Nubble's wrong-but-plausible-advice checks and time-accounted verification, not a claim that any particular interface intervention will automatically work here.

[SelectiveNet](https://proceedings.mlr.press/v97/geifman19a.html) motivates reporting risk with coverage. [Learning to defer](https://proceedings.mlr.press/v119/mozannar20b.html) motivates including the cost and quality of escalation. These are adaptations from prediction settings, not prevalidated generative-advice metrics. [SNIF-ACT](https://doi.org/10.1007/3-540-44963-9_8) motivates recording how readers reach useful evidence; its small source study does not establish a Nubble effect.

## Concrete changes from the initial draft

1. **A narrower claim:** an inspectable representation/evaluation contract, rather than invention of personalization or actionable summaries.
2. **An explicit decision baseline:** current plan, feasible options, authority, resources, and horizon.
3. **Typed premises:** source facts, reader facts, assumptions, conditional inferences, and proposed decisions are evaluated separately.
4. **Five outcomes:** act, verify, monitor, maintain, abstain. Maintaining a plan is not the same as lacking evidence.
5. **A constrained objective:** decide within total review time; include source inspection and verification costs.
6. **Two empirical tracks:** controlled case-defined regret and realistic expert-assessed decision quality, with different claim boundaries.
7. **Stronger baselines:** personalized summary alone, unconstrained personalized summary, and staged action-oriented prompting.
8. **Human behavioral endpoints:** measure decisions; validate automated judges; keep preference/helpfulness secondary.
9. **Selectivity accounting:** report missed beneficial action and false reassurance, not only unsupported action.
10. **Implementation honesty:** live Control Room behavior motivates the study but does not establish the whole contract or its effectiveness.

## Search and reading limits

Searches used multiple formulations spanning personalized/task-oriented summarization, decision support, source attribution, overreliance, selective prediction, deferral, and information foraging. Primary proceedings, author manuscripts, and in-body paper-index passages were preferred. Exact queries and partial reads remain in the source registries. The 1999 information-foraging original could not be read and is not counted among the 17 studied records. Versions of one paper are not counted as independent evidence.

The [related-work notes](related-work-notes.md) and [evaluation notes](evaluation-notes.md) retain the detailed original synthesis. [REFERENCES.md](../paper/REFERENCES.md) and [references.bib](../paper/references.bib) provide citation artifacts. No published study's effect size is presented as a Nubble result.

## Foundations added for the methods manuscript

Simon's [archival manuscript on information-rich organizations](https://iiif.library.cmu.edu/file/Simon_box00055_fld04178_bdl0002_doc0001/Simon_box00055_fld04178_bdl0002_doc0001.pdf) supplies the attention-scarcity premise. Horvitz and Barry's [decision-sensitive display paper](https://arxiv.org/abs/1302.4959), originally published at UAI 1995, connects review effort with decision value. These established ideas delimit the manuscript's contribution; neither the attention premise nor value-of-information reasoning is presented as a Nubble invention. The 2013 arXiv deposit is not the original publication year.
