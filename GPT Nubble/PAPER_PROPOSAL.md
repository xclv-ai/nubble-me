# Beyond the Summary: Nubble and the So-What Layer

## An Evidence-Grounded Framework for Personalized Implications and Proposed Actions Under an Attention Budget

**Document type:** draft methods-paper proposal  
**Version:** 0.1, October 25, 2026  
**Research status:** prototype-informed; no controlled evaluation reported  
**Submission metadata:** authors, affiliations, ORCIDs, venue, and release identifier remain to be supplied.

## Abstract

News and market signals are valuable only insofar as readers can connect them to their goals and decisions. Summarization reduces the amount of text to read, and personalization can improve the selection of relevant content. Neither operation alone requires an explicit account of how information could change a reader's current plan. We propose Nubble, a framework with three linked representations: the available original source, a summary conditioned on an explicit reader context, and a So-What Layer containing contextual implications and proposed next steps. The framework requires source-linked factual premises, a distinction between evidence and inference, explicit uncertainty, and the option to recommend verification, monitoring, or no action. We formulate a research question: whether the So-What Layer improves independently assessed decision quality beyond personalized summarization within the same reading-time budget. We describe a prototype-informed method and a controlled evaluation against original-only, generic-summary, and personalized-summary conditions. This proposal reports no experimental results; it defines the hypotheses, artifacts, and failure cases needed to test the framework.

**Keywords:** personalized summarization; decision support; attention scarcity; evidence attribution; human–AI interaction; information overload.

## 1. Introduction

“Attention is currency” expresses the practical constraint behind Nubble. A founder can encounter dozens of relevant developments without having time to determine which should alter a product, positioning, or research decision. A short account of a competitor's launch may accurately describe the event while leaving the reader to reconstruct its consequences.

Consider a reader deciding whether to change a comparison page. The useful output may be a factual description of an overlapping capability, a qualified explanation of why that overlap could affect positioning, and a bounded verification step. An unrelated reader should receive a different relevance assessment or no recommendation at all. A system that produces more tasks in response to more news may increase the very attention burden it is intended to reduce.

The problem therefore involves at least three operations: preserving the source, selecting what matters to a particular decision, and explaining possible consequences. Nubble makes these operations inspectable. Its proposed contribution is an explicit contract between source evidence, reader context, implications, and proposed action, evaluated under a fixed attention budget.

The current repository contains product prototypes that motivate this proposal. Their existence does not establish effectiveness. The public feed's missing source lineage and the prototype's documented relevance/action failures are reasons to strengthen the research design before making performance claims. The separate [repository review](REPO_REVIEW.md) records implementation evidence and release blockers.

<a id="related-work-and-contribution-boundary"></a>

## 2. Related work and contribution boundary

Attention scarcity is an established foundation. Simon's *Designing Organizations for an Information-Rich World* describes information's demands on recipients' attention and considers recipients' time as a measure of its cost. Nubble adopts this constraint rather than claiming to discover it. [Original manuscript, 1971](https://iiif.library.cmu.edu/file/Simon_box00055_fld04178_bdl0002_doc0001/Simon_box00055_fld04178_bdl0002_doc0001.pdf).

Decision-aware information presentation also predates this proposal. Horvitz and Barry's *Display of Information for Time-Critical Decision Making* connects information display to decision value and review cost. This is direct precedent for judging a brief by its decision contribution under time constraints. The paper appeared at UAI in **1995**; the arXiv deposit is from 2013. [Author-deposited paper and metadata](https://arxiv.org/abs/1302.4959).

Personalized summarization already selects information according to a reader's interests or knowledge. Khurana, Bhatnagar, and Kumar's *Personalized Summarization of Scientific Scholarly Texts* uses positive and negative knowledge signals for extractive summarization. [P-Summ preprint, 2023, revised 2024](https://arxiv.org/abs/2306.09604). Kolagar and Zarcone's *HumSum* presents LLM lecture summaries tailored through user preferences and examines users' perceptions. [PERSONALIZE 2024, DOI 10.18653/v1/2024.personalize-1.4](https://aclanthology.org/2024.personalize-1.4/).

Reddy and colleagues' *SmartBook: AI-Assisted Situation Report Generation for Intelligence Analysts* describes strategic questions and evidence-grounded reporting, making it especially relevant to claims about moving beyond generic summaries toward contextual intelligence. [Preprint, 2023, revised 2024](https://arxiv.org/abs/2303.14337).

These precedents rule out treating personalization, attention-aware selection, or decision-oriented reporting as new in themselves. This limited review is not an exhaustive novelty search. The proposed research contribution is the specification and evaluation of their combination in a reader-facing three-representation method: an explicit context; source-linked Short; a separately labeled So-What Layer; and appropriate action or inaction under a measured time constraint. Whether this combination improves outcomes remains an empirical question.

## 3. Research question and hypotheses

**Primary question:** does adding an explicit So-What Layer improve decision quality compared with a personalized summary alone, within the same attention budget?

**H1 — decision quality:** participants using personalized Short plus So what? achieve higher independently scored decision quality than participants using personalized Short alone under the same total review time and generated-text budget.

**H2 — contextual fit:** using a matched reader context improves relevance and decision quality relative to using a deliberately mismatched context, while source facts remain stable.

**H3 — appropriate restraint:** the full method can distinguish actionable updates from irrelevant or insufficient-evidence updates without increasing unsupported recommendations. A claim of improved decision quality must be assessed alongside unsupported-premise and inappropriate-action rates.

H1 is the primary test. H2 and H3 are secondary. Minimum useful effects, acceptable error thresholds, and analysis choices must be specified before collecting the confirmatory data. No hypothesis has been tested in this document.

## 4. Method

### 4.1 Reader context

The context records a focus, goal, pending decision, current plan, prior knowledge, constraints, horizon, and attention budget. An explicit brief supports inspection and profile-swap experiments. An inferred behavioral profile is not required for the initial method.

The current plan is particularly important: an implication describes a possible change relative to something. Without it, generic claims that an update is “important” may be impossible to connect to a real choice. The context is versioned, and its accuracy is itself a limitation to report.

### 4.2 Three representations

**Full** retains the available source and provenance. Its retrieval scope is explicit. Extracted text, snippets, and complete source documents are distinct states; generated expansions cannot substitute for missing originals.

**Short** selects and compresses source-supported information for the stated context. It preserves qualifications that affect the decision and links factual claims to source spans. It explains relevance without presenting a context-specific inference as a source quotation or observation.

**So what?** connects factual premises to possible changes in the reader's plan. It contains a proposed mechanism, assumptions, uncertainty, a feasible next step, and a condition that would change the recommendation. Its allowed outcomes include act, verify, monitor, no action warranted, and insufficient evidence.

The action is a proposal for the reader to consider. This framework does not require autonomous execution. It also does not require every story to generate a task.

### 4.3 Evidence and generation

A source record receives stable paragraph/span IDs. An evidence ledger maps factual premises to those spans. Short and So what? retain the mapping, while implications and suggested actions are separately labeled. Evidence access must reach the available original rather than loop back to another generated summary.

For the initial candidate pipeline, the implication step receives the source evidence and context in addition to Short. A summary-only version tests whether compression removes decision-critical qualifications. A support review checks source fidelity, context fit, and feasibility. Model self-review is a fallible check; human annotation is needed to assess it.

The [method specification](METHOD.md) supplies the proposed input/output contract, reference prompts, and failure taxonomy. The [fictional worked example](examples/competitor-update.md) illustrates two contexts and a no-action outcome. It is an explanatory fixture, not evidence of model performance.

<a id="evaluation-protocol"></a>

## 5. Evaluation protocol

### 5.1 Materials and task design

Construct a rights-cleared corpus of source–context–decision cases. Record source completeness and source versions. Include genuine decision-relevant updates, unrelated news, incomplete announcements, conflicting evidence, stale information, and cases where keeping the current plan is preferable. Synthetic fixtures are useful for debugging and controlled contrasts; report their results separately from real-world material.

For each case, independent domain reviewers define the decision task and a scoring rubric before seeing system outputs. The rubric should cover relevant factual understanding, evidence-sensitive reasoning, treatment of uncertainty, action feasibility, and appropriate inaction. There may be several defensible choices. Avoid a scoring scheme that rewards agreement with one model's recommendation.

Use held-out sources/topics for the confirmatory set. Keep source versions and context wording fixed across the relevant comparisons. Document limits on possible model pretraining exposure rather than claiming that source separation proves no contamination.

### 5.2 Conditions

| Condition | Material available during the review period |
|---|---|
| A: original only | Available original with the same source navigation. |
| B: generic summary | A context-independent summary plus access to the original. |
| C: personalized Short | A context-conditioned summary plus access to the original. |
| D: personalized Short + So what? | The personalized summary, a separately labeled implication/action layer, and access to the original. |

All generated conditions use the same model/version, generation settings where applicable, and source access. Context conditioning differentiates B from C/D. C and D must receive equivalent reader context and original evidence. Use the same total generated-text budget for B/C/D; D divides that budget between Short and So what? Report the allocation. This helps separate the effect of the representation from simply supplying more text.

Operationally, C may explain why selected facts are relevant to the pending decision, but it does not forecast downstream effects or prescribe next steps. D adds those conditional implications and proposals explicitly. Review outputs for adherence before analysis using a predeclared policy; report crossover rather than silently replacing awkward runs. Use the same neutral writing style, evidence-link treatment, and uncertainty conventions in C and D so that persuasive tone is not an intended treatment difference. A supplementary unconstrained personalized-summary baseline can test whether the explicit boundary makes C unrepresentative of normal use.

Record generation steps, latency, token use, and cost for each condition. The primary comparison evaluates the entire proposed representation under the declared reading budget. It does not independently isolate every prompt, generation step, or formatting label as a causal mechanism.

All participants receive the same time limit for a case, including time following evidence links. Original text length is not artificially matched to generated text, because original-only is an ecological baseline. The primary comparison is **D versus C**, where both text and time budgets are matched. Any extra verification performed after the timed task is measured separately and cannot be hidden as free work.

### 5.3 Participants and randomization

Run a pilot to estimate task difficulty, time pressure, rubric reliability, and score variance. Select the confirmatory sample size from the pilot variance and a declared minimum useful effect; do not present a convenient small pilot as a powered study.

Randomize conditions and counterbalance document/condition order across participants. A participant must not encounter the same underlying source in multiple conditions, which would create a learning advantage. Record expertise and context familiarity. Blind output-quality raters to system condition where practical, and separate them from generation prompt design.

### 5.4 Measures

**Primary outcome:** independently scored decision quality after the fixed review period. Report the scoring rule, rater agreement, the D–C effect estimate, and its uncertainty.

**Secondary outcomes:** factual comprehension, time to decision, evidence-inspection time, context relevance, supported versus unsupported factual premises, quality of the declared inference mechanism, feasible action rate, inappropriate action rate, appropriate inaction, and willingness to correct a recommendation when contrary evidence appears.

Perceived usefulness, pleasantness, action acceptance, clicks, and time saved are supplementary. An accepted action may still be unnecessary or wrong. A faster decision may still be worse. The study must report these distinctions.

For implications, review whether the premises are supported and whether the conditional reasoning is defensible. Do not score a future market outcome as already true merely because a source supports the initial premise. An evidence link alone is not evidence that its claim is supported.

### 5.5 Ablations and robustness

- **Profile swap:** hold the source fixed and change the pending decision/context.
- **No pending decision:** remove the decision/current plan to test whether outputs become generic.
- **Summary-only implication input:** withhold original evidence from the So-What step.
- **Incomplete source:** compare available full text against a clearly labeled snippet.
- **Restraint controls:** use irrelevant and insufficient-evidence cases, including conflicting sources.

Pre-register the primary comparison and analysis appropriate to the score scale, accounting for variation across participants and cases. Report confidence intervals, exclusions, missing data, all tested conditions, and failures. Declare any changes after the pilot. Freeze prompts before the confirmatory run and retain failed runs according to a predeclared policy.

## 6. Results and interpretation status

**No evaluation has been conducted for this proposal.** There are no reported effect sizes, participant results, or claims of improved decisions. The existing app is an implementation reference with known limitations. The hand-authored example illustrates intended behavior only.

A positive result would support the bounded claim that the tested So-What representation improved the measured decisions for the studied tasks, readers, models, and budgets. It would not establish universal superiority, autonomous strategic competence, or guaranteed business outcomes.

If decision quality does not improve, if unsupported implications increase, or if the extra layer simply shifts verification work outside the measured budget, the central proposal would need revision. Negative results remain valuable release artifacts.

## 7. Limitations and responsible use

The quality of implications depends on accurate context and retrievable evidence. Personalization can reinforce existing beliefs or hide weak signals outside the profile. More persuasive language may increase automation bias. Proposed future effects may be plausible but wrong, especially where evidence is incomplete or consequences are delayed.

Evaluation on news scenarios cannot by itself establish long-term business value or generalize to medicine, law, or other high-stakes domains. Human approval remains essential for consequential actions. Source content should be treated as data, including any embedded instructions. User context may contain private strategy; a release must document storage, logging, and external data transfers accurately.

## 8. Reproducibility and release package

Before claiming reproducibility, publish a versioned implementation, prompt versions, model identifiers and settings, rights-cleared fixtures/source metadata, context versions, run records, failure cases, annotation instructions, and evaluation/analysis commands. Provide an offline example that requires no private credentials and clearly separates replayed fixtures from live inference.

Release the protocol before the confirmatory evaluation. Add authorship/citation metadata only when known. Clarify licenses independently for code, paper, original fixtures, and third-party materials. These are release requirements; the current proposal folder is documentation only.

## 9. Positioning and title alternatives

**Recommended:** *Beyond the Summary: Nubble and the So-What Layer*. It names the shift and gives the method a memorable concept without claiming an unproven breakthrough.

Alternatives:

- *Attention Is Currency: The Nubble Method for Turning Information into Contextual Action* — suitable for an essay or launch article.
- *From Information to Implication: Decision Support Under an Attention Budget* — a more restrained academic title.
- *The So-What Layer: Making Information Earn Your Attention* — suitable for the repository headline or talk.

The release can be bold about its research question while remaining precise about its evidence.
