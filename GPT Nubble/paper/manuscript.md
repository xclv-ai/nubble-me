# Beyond the Summary: Nubble and the So-What Layer

## Evidence-linked decision support under an attention budget

**Working methods paper · Version 0.2 · October 25, 2026**

**Status:** proposed framework informed by working prototypes. No controlled Nubble effectiveness study is reported. Named authors, affiliations, and submission metadata must be confirmed before submission. Figures depict the proposed method and experiment, not measured gains.

## Abstract

Information overload is partly a decision problem: readers must determine which developments matter to their current goals and whether those developments justify changing a plan. Personalized summaries can select relevant facts, while decision-focused summarization and action-oriented financial-news systems already connect text to downstream decisions. We propose Nubble as an inspectable representation contract linking three roles: the available original source, a context-conditioned Short representation, and a separately labeled So-What Layer. The third layer connects factual premises, reader constraints, explicit assumptions, conditional implications, and feasible decision options. Its outcomes include action, verification, monitoring, maintaining the current plan, and abstention when evidence is insufficient. The contribution is a specification and falsifiable evaluation design for this combination, rather than a claim to invent personalized or actionable summarization. We distinguish source support from inferential validity and decision quality, formulate attention as a constrained resource, and propose controlled and realistic evaluation tracks. The primary test compares final decisions with and without the So-What Layer at equal total review time and generated-text budget. A public fixture, output schema, prompts, literature ledger, annotation rubric, and reproducible figures accompany the proposal. No improvement in real decisions is claimed until that test is conducted.

**Keywords:** personalized summarization; decision-focused summarization; decision support; evidence attribution; selective recommendation; human-AI interaction.

## 1. The problem: information must earn attention

For a reader choosing what to build, investigate, communicate, or leave unchanged, an accurate account of an event is useful only if it can be connected to the pending decision. A competitor's release may justify updating comparison copy, checking a capability, or doing nothing. Its general popularity or topical similarity does not determine which response fits this reader's resources and current plan.

Nubble's design principle is **attention is currency; information should earn it**. This is an operational constraint, not a claim that attention has a universal monetary exchange rate. The relevant outcome is the quality of a feasible decision within a stated budget that includes reading, source inspection, verification, and deliberation. Generating more recommendations is not inherently beneficial.

We define a **nubble** as a source-linked representation bundle connecting what happened, what matters to a reader's focus, and what could change in the reader's next decision. This is a proposed project meaning. The association with the English “nub,” meaning the central point or gist, motivates the name; it does not establish the method's novelty or effectiveness. [Merriam-Webster](https://www.merriam-webster.com/dictionary/nub).

The three roles are functional rather than simply different lengths. Full preserves access to what was available. Short selects supported information for a context. So what? makes prospective consequences and decision options explicit. A reader may inspect the source first, request interpretation only when needed, or stop after a justified no-action conclusion. The representation contract does not require a fixed navigation order.

![Figure 1. Proposed three-representation framework; conceptual, not a result.](../figures/nubble-framework.png)

**Figure 1.** Source evidence and explicit reader context support Short and So what? directly. Original access must not be reconstructed from generated prose. A finite review budget applies to the complete interaction.

## 2. Closest work and the contribution boundary

### 2.1 From textual relevance to reader and decision objectives

Hsu and Tan's **Decision-Focused Summarization** selects sentences to preserve a downstream predictor's decision while balancing representativeness and redundancy. It directly precedes any claim that summarization should serve decisions rather than textual salience. Its model-prediction faithfulness should not be confused with factual correctness or good professional action. [EMNLP 2021](https://aclanthology.org/2021.emnlp-main.10/).

**PersonalSum** supplies personalized news summaries associated with source sentences and user preferences. **SumRecom** learns preferences through feedback. **Comparative Personalization for Multi-document Summarization** derives structured profiles from a user's authored documents. These works establish substantial precedent for reader-specific content selection and intermediate user representations. A preference-matching summary can still omit a decision-changing limitation. [PersonalSum, NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/b3c318cd7ee132d8a6b1895a2d6436c7-Abstract-Datasets_and_Benchmarks_Track.html), [SumRecom, preprint 2024](https://arxiv.org/abs/2408.07294), [comparative personalization, preprint 2025](https://arxiv.org/abs/2509.21562).

Reader models are also established. Spinoso-Di Piano and Cheung rerank query-focused summaries using reconstructed answers. Kirstein and colleagues' **Re-FRAME/SCOPE** combines extracted facts and questions about reader knowledge, goals, urgency, and relevance. Cachola and colleagues' **Information Satisfaction** evaluates reader-specific informational needs and shows why even persona-conditioned automatic judgments need validation against actual readers. These motivate explicit, correctable context and audience-perturbation tests. [Reader-aware summarization, preprint 2024](https://arxiv.org/abs/2411.06524), [Re-FRAME/SCOPE, preprint 2025](https://arxiv.org/abs/2509.15901), [Information Satisfaction, 2026](https://doi.org/10.1145/3834580.3838749).

### 2.2 Direct precedent for implications and recommendations

Zhang and Chen's **Personalized Chain-of-Thought Summarization of Financial News for Investor Decision Support** is particularly close: extracted financial news becomes initial and enhanced summaries, followed by keyword-conditioned relevance, implications, and three investment recommendations. The inspected version establishes a system design precedent, not verified investment benefit. The paper's title does not require Nubble to expose private chain-of-thought; our contract asks for concise, inspectable premises and conditions. [Primary preprint, version 2, 2025](https://arxiv.org/html/2511.05508v2).

Accordingly, **a summary plus a “so what?” explanation is not itself a defensible novelty claim**. The candidate contribution is the operational contract connecting evidence, context, conditional interpretation, feasible options and calibrated restraint, together with an equal-attention evaluation of the complete interaction. This focused review cannot prove that the combination is unprecedented.

| Prior work | Established overlap | What remains to test for Nubble |
|---|---|---|
| Decision-Focused Summarization | Downstream decision objective, controlled summary length | Context-specific feasible options and end-to-end human decisions |
| PersonalSum / SumRecom | Personalized source selection and preference fit | Decision-changing caveats, action feasibility, and total interaction cost |
| Re-FRAME / SCOPE | Facts, explicit reader goals and knowledge | Prospective implications and justified action or deferral |
| Financial-news staged summarization | Personalized implications and recommendations | Conditional support graph, zero-action option, evidence sufficiency |
| Information Satisfaction | Reader-owned goals and reader-centered evaluation | Decision outcomes beyond preference and informational fit |
| ALCE / verifiability evaluation | Citation support as a separate construct | Whether supported premises lead to justified decisions |

Absence of a feature from this table means it was not established by the inspected passages; it is not proof that the original system cannot provide it. Detailed versions, methods inspected, search queries, and access limits are in the literature ledger.

### 2.3 Why persuasive explanation is an inadequate endpoint

Bansal and colleagues found that explanations did not establish better complementary team performance in their studied tasks and could encourage acceptance when advice was wrong. Buçinca and colleagues found that cognitive-forcing interventions could reduce overreliance with subjective-usability tradeoffs. Vasconcelos and colleagues show why the effort and incentives of verification matter. These studies concern particular tasks; they justify testing mechanisms rather than assuming the same effects in Nubble. [Bansal et al., CHI 2021](https://doi.org/10.1145/3411764.3445717), [Buçinca et al., CSCW 2021](https://doi.org/10.1145/3449287), [Vasconcelos et al., CSCW 2023](https://doi.org/10.1145/3579605).

ALCE and generative-search verifiability research distinguish support from correctness and useful coverage. SelectiveNet and learning-to-defer frameworks motivate reporting the cost of abstention and delegation, rather than winning a safety metric by declining everything. SNIF-ACT motivates tracing navigation toward decision-relevant evidence; more clicks are not a success criterion. [ALCE](https://aclanthology.org/2023.emnlp-main.398/), [verifiability](https://aclanthology.org/2023.findings-emnlp.467/), [SelectiveNet](https://proceedings.mlr.press/v97/geifman19a.html), [learning to defer](https://proceedings.mlr.press/v119/mozannar20b.html), [SNIF-ACT](https://doi.org/10.1007/3-540-44963-9_8).

## 3. A proposed representation contract

### 3.1 Inputs and the available original

The source bundle D records content, canonical identity, publisher, relevant dates, retrieval method, retrieval scope, and stable supporting spans. The reader context c records focus, goal, pending decision, current plan, prior knowledge, authority, resources, constraints, and horizon. An occupation or competitor watchlist alone is insufficient to establish these facts.

Full means the **available original**, not a promise that every article was completely retrieved. A snippet, extraction, missing section, paywall, or changed version must remain visible. A source URL enables inspection but does not by itself demonstrate that a claim is supported. Public redistribution requires independent permission; source preservation can instead use rights-cleared fixtures or metadata and lawful retrieval instructions.

### 3.2 Short and So what? have distinct responsibilities

Short selects and compresses source-supported facts for the context. It may explain why a fact was selected, while keeping that mapping distinct from a source observation. Forecasts about effects on the reader's situation, prospective plan changes, and recommended next steps belong to So what? This boundary must be checked in experimental outputs, not assumed from prompt names.

So what? supplies a **conditional decision rationale**: factual premises, contextual premises, assumptions, a mechanism linking the update to the pending decision, uncertainties, a feasible option, and a reversal or review condition. The source need not literally recommend the action. The inferential transition must nevertheless be explicit and defensible. “A competitor did not mention a feature” cannot be promoted to “the competitor lacks that feature.”

The five outcomes are:

| Outcome | Meaning |
|---|---|
| Act | Evidence and context support a feasible proposed change. |
| Verify | A decision-relevant missing fact can be checked with a bounded task. |
| Monitor | A declared trigger would change the decision; no immediate change is justified. |
| Maintain | Available evidence supports keeping the current plan. |
| Abstain | Available evidence/context is insufficient to justify a recommendation. |

Maintain is a substantive recommendation and can be wrong. Abstention is an epistemic state and has opportunity costs. Verify and monitor are proposals with their own effort and authority constraints, not free escape routes. No output is an accepted commitment until the reader chooses it.

![Figure 2. Proposed evidence-to-decision graph; conceptual, not a result.](../figures/nubble-evidence-graph.png)

**Figure 2.** Source-supported facts, reader facts, assumptions, and conditional implications are different node types. The support of the premises and the validity of the proposed decision must be assessed separately.

### 3.3 Evidence graph and validation

We represent the inspectable rationale as a typed graph. Source-fact nodes link to spans; context-fact nodes link to a versioned reader brief; assumption nodes state unverified premises; inference nodes identify their dependencies; option nodes identify feasibility conditions and a review trigger. This is a proposed presentation/data contract, not a claim that graph structure guarantees correct reasoning.

Validation has three separate questions: are the factual premises supported, is the conditional interpretation justified, and is the decision appropriate for this task? Automatic entailment can help triage the first question. It does not establish the other two and needs validation against human annotation. Both generations receive original evidence, avoiding dependence solely on facts that survive Short. A summary-only interpretation input is an explicit ablation.

## 4. Attention-constrained decision objective

Let w denote the task-relevant world state, A(c) the feasible decision options including the current plan, and U_c(a,w) their utility net of action costs. Let pi produce a representation bundle from D and c, and h denote the reader's decision process. The proposed design objective is:

```text
maximize   E[ U_c( h(pi(D,c), D, c), w ) ]
subject to a in A(c)
           T_read + T_source + T_verify + T_decide <= B
```

The objective adapts established decision-value and information-foraging ideas. It is not a new optimality theorem. Time spent opening and checking the source is included once. Repeated context entry, request-for-explanation effort, and deferred verification are recorded rather than hidden outside the accounting window. If an assigned task cannot finish within B, the protocol must specify the timeout outcome in advance.

In controlled cases, a declared payoff table or simulator can define a case-specific reference action and regret:

```text
regret = U_c(a_reference, w) - U_c(a_chosen, w)
```

The reference is the optimum under the case's declared feasible set and information available at decision time, not an oracle that knows the eventual outcome. For stochastic cases, compare expected utilities under the same permitted information; score realized outcomes separately. This is a **case-defined reference**, not proof of the best action in the real world. Where professional decisions have no defensible payoff model, use blinded expert rubrics and report disagreement. Rubric scores must not be renamed proven business utility.

An attention-value ratio is not the primary endpoint: a ratio can conceal consequential errors or improve by skipping hard cases. Compare decision quality at fixed B and, in later experiments, show quality-time frontiers. Any numerical exchange rate between seconds and utility requires an explicit justification.

## 5. Working implementation and its limits

Read-only inspection on October 25, 2026 confirmed a live POKPOK Control Room displaying short news items, source links, contextual “For POKPOK” explanations, optional next steps, and reader-triggered explanation. Existing cards include a no-impact conclusion. This demonstrates an interaction pattern and a practical setting for the research question.

The inspected iOS Nubble prototype separately supports an editable product profile, relevance ranking, source extraction with snippet fallback, reading-depth representations, product-specific meaning/impact/actions, and stored proposed tasks. Its five depth labels and generic Short generation do not yet implement this paper's entire three-role contract.

Neither implementation establishes the proposed method's effectiveness. A source link is not an archived, span-grounded original; a generated explanation is not verified competitor intelligence; a progress message is not independent backend telemetry. Freshness and partial collection affect evidence sufficiency. The current contract's typed premises, explicit abstention, complete time accounting, and evaluation package remain research requirements. Private dashboard content, unpublished drafts, and operational metrics are excluded from the public fixture.

## 6. Evaluation protocol

### 6.1 Research questions

**Primary:** does personalized Short plus So what? improve final decisions over personalized Short alone at equal total review time and generated-text budget?

**Secondary:** does correct reader context improve decisions over mismatched context? Does the method retain decision-critical caveats, respect constraints, distinguish maintain from abstain, and support successful verification? What useful decisions are missed when it withholds a recommendation?

No hypothesis in this manuscript has been tested with a controlled Nubble study.

### 6.2 Two evidence tracks

**Controlled track:** construct rights-cleared or self-authored cases with declared states, feasible options, payoff tables, evidence limits, and status-quo actions. Freeze case rules before generation. Use case-defined utility/regret as the primary outcome. Include relevant, irrelevant, conflicting, incomplete, stale, and maintain-optimal cases.

**Realistic track:** representative readers supply real pending decisions and constraints. Independent domain reviewers define acceptable evidence-sensitive reasoning and feasibility rubrics before seeing outputs. Use ordinal quality scores and report rater disagreement. This track tests realism and process quality; it does not estimate causal long-term commercial outcomes.

Split by source/topic/time before tuning and retain held-out contexts. A public fictional fixture demonstrates the contract only; it is not an independently sampled benchmark or user study.

### 6.3 Randomized comparison

![Figure 3. Proposed controlled study; conceptual, not a result.](../figures/nubble-study-design.png)

**Figure 3.** All arms can inspect the available original. The primary contrast is D versus C; shared elapsed time and text budgets prevent an extra-reading-time advantage. Separate artifact audits and human decisions avoid evaluating advice solely by its prose.

| Arm | Displayed material |
|---|---|
| A | Available original only: human baseline. |
| B | Generic source-grounded summary plus original access. |
| C | Personalized source-grounded Short plus original access. |
| D | Personalized Short plus explicit implications/options and original access. |

All readers receive the same case task and role context. Generated arms use the same source access, model/version, and generation settings where applicable. B/C/D have the same total display budget; D divides it between Short and So what? C/D use a neutral style, the same evidence-link treatment, and comparable uncertainty conventions. C may explain relevance but does not prescribe action or forecast consequences. Report output crossover under a predeclared handling policy. A supplementary unconstrained personalized-summary baseline checks that this boundary does not artificially weaken the comparator. A staged-prompt baseline inspired by the financial-news precedent tests whether generic added prompting explains the benefit.

Randomize and counterbalance conditions across participants and cases; no participant sees the same case in multiple forms. Freeze generated artifacts for the confirmatory human trial. Pilot case difficulty, time pressure, rater reliability, and score variance. Determine sample size from a declared minimum useful effect and an analysis accounting for participant/case clustering. Predefine timeouts, exclusions, missingness, multiplicity, and stopping rules. No convenient pilot size is presented as a powered study.

### 6.4 Outcomes, support audit, and overreliance

The primary estimand is the intention-to-treat D-C difference in final case-defined utility or regret at common B in the controlled track. Report confidence intervals and sensitivity to defensible payoff weights. Analyze realistic ordinal judgments separately.

Audit atomic factual support, missing decision-critical evidence, inferential validity, hard-constraint violations, inappropriate action, false reassurance, missed beneficial action, verification success, and total time. The atomic-claim rubric adapts citation-evaluation concepts; it is not identical to ALCE's or Liu and colleagues' metrics. Publish segmentation, support and partial-support rules, denominators, rater agreement, and adjudication. A supported premise can still produce an invalid inference.

Measure recommendation coverage together with error risk. The declared recommendation set includes act, verify, monitor, and maintain; abstain is tracked separately. Count missed opportunities and costs of verification/deferral so that abstaining everywhere cannot appear successful. Human helpfulness and action acceptance are secondary diagnostic outcomes.

Run the corresponding AI-only decision policy on the same cases and evidence. Claim human-AI complementarity only if the combined system improves on both human-only and AI-only outcomes in that setting. A separate robustness stratum supplies matched plausible erroneous advice or missing prerequisites and measures harmful acceptance. Its chosen error prevalence must not be presented as the product's natural error rate. Test optional assumption checks in a separately randomized experiment and include their effort costs.

### 6.5 Ablations and construct checks

Swap goals, knowledge, constraints, and horizons while holding source facts fixed. Remove the pending decision/current plan. Withhold original evidence from the implication step. Compare complete and explicitly incomplete source versions. Remove the abstention option. Vary word allocation and explanation-on-request. Reader-context and source facts should remain separately traceable through these perturbations.

Content-preserving length changes and audience changes test construct validity. A system should not appear better solely because an automatic judge prefers longer answers or familiar wording. Human calibration of automated ratings is required before relying on them for secondary artifact measures.

## 7. Release artifacts and reproducibility

The release includes this manuscript, a focused 17-study ledger with access/version limits, a method specification, a structured fictional fixture, a schema, reference prompts, an annotation rubric, a detailed protocol, and scripts producing the original SVG/PNG figures and PDF. The package is a research specification and authoring toolkit, not a production inference implementation. The offline validation command checks artifact structure and cross-references, not the truth of model implications.

Actual study claims require a separately versioned benchmark, independent annotations, frozen model/prompt/settings records, run costs/timings, and analysis code with observed outputs. Publish negative and adverse-error results. Context, private source documents, and legacy credentials must not enter public artifacts. Bibliographic facts and linked papers retain their respective rights.

The proposed business structure uses open-source AGPL tooling with a paid ongoing-intelligence service. Open core processes supplied content; Cloud continuously collects, connects and prioritizes developments against maintained business context, with material-change alerts and decision follow-up. Collaboration is deferred. Commercial use remains permitted under the applicable obligations. Original research materials use CC BY 4.0. This release does not launch the planned service.

## 8. Limitations and conclusion

The literature review is focused and non-exhaustive; some sources are preprints or partially read. Their results concern different tasks and cannot be transferred as Nubble performance estimates. The prototype context may be stale or incomplete. Professional consequences often depend on unknown causal mechanisms; a source association does not prove the effect of an action. Personalization can narrow exposure or reinforce a mistaken plan. Fluent explanations may increase reliance, and a short card can transfer work into unmeasured verification.

Nubble proposes an explicit connection between available evidence, personal relevance, conditional implications, and feasible decisions. Existing work motivates and constrains that proposal. Its scientific value depends on whether the complete interaction improves decisions, retains critical evidence, and handles uncertainty within the attention it asks the reader to spend. The release makes that claim inspectable and testable; it does not claim it has already been established.

## References and evidence ledger

Canonical metadata and machine-readable BibTeX are supplied in [references.bib](references.bib). The [literature review](../research/LITERATURE_REVIEW.md) links each study to its evidence level, relevant findings, limits, and implications for this protocol. Search dates, queries, manuscript versions, and partial-access restrictions are retained in the two source registries rather than hidden behind an unsupported claim of exhaustive coverage.

<!-- GENERATED-REFERENCES -->

### References cited

1. Chao-Chun Hsu, Chenhao Tan. 2021. **Decision-Focused Summarization**. Proceedings of EMNLP 2021. [Canonical record](https://aclanthology.org/2021.emnlp-main.10/).

2. Lemei Zhang, Peng Liu, Marcus Tiedemann Oekland Henriksboe, Even W. Lauvrak, Jon Atle Gulla, Heri Ramampiaro. 2024. **PersonalSum: A User-Subjective Guided Personalized Summarization Dataset for Large Language Models**. Advances in Neural Information Processing Systems 37, Datasets and Benchmarks. [Canonical record](https://proceedings.neurips.cc/paper_files/paper/2024/hash/b3c318cd7ee132d8a6b1895a2d6436c7-Abstract-Datasets_and_Benchmarks_Track.html).

3. Samira Ghodratnama, Mehrdad Zakershahrak. 2024. **SumRecom: A Personalized Summarization Approach by Learning from Users' Feedback**. arXiv. [Canonical record](https://arxiv.org/abs/2408.07294).

4. Cesare Spinoso-Di Piano, Jackie Chi Kit Cheung. 2024. **Does This Summary Answer My Question? Modeling Query-Focused Summary Readers with Rational Speech Acts**. arXiv. [Canonical record](https://arxiv.org/abs/2411.06524).

5. Tianyi Zhang, Mu Chen. 2025. **Personalized Chain-of-Thought Summarization of Financial News for Investor Decision Support**. arXiv; author comments state Proceedings of ICDM Workshops. [Canonical record](https://arxiv.org/abs/2511.05508).

6. Haoyuan Li, Snigdha Chaturvedi. 2025. **Comparative Personalization for Multi-document Summarization**. arXiv. [Canonical record](https://arxiv.org/abs/2509.21562).

7. Xiao Pu, Mingqi Gao, Xiaojun Wan. 2024. **Is Summary Useful or Not? An Extrinsic Human Evaluation of Text Summaries on Downstream Tasks**. LREC-COLING 2024. [Canonical record](https://aclanthology.org/2024.lrec-main.821/).

8. Frederic Kirstein, Sonu Kumar, Terry Ruas, Bela Gipp. 2025. **Re-FRAME the Meeting Summarization SCOPE: Fact-Based Summarization and Personalization via Questions**. arXiv. [Canonical record](https://arxiv.org/abs/2509.15901).

9. Isabel Cachola, William Walden, Reno Kriz, Mark Dredze. 2026. **Information Satisfaction: A Reader-Centered Axis for Summarization Evaluation**. ACM publication linked by DOI; exact conference name not established from inspected metadata. [Canonical record](https://dl.acm.org/doi/10.1145/3834580.3838749).

10. Gagan Bansal, Tongshuang Wu, Joyce Zhou, Raymond Fok, Besmira Nushi, Ece Kamar, Marco Tulio Ribeiro, Daniel S. Weld. 2021. **Does the Whole Exceed its Parts? The Effect of AI Explanations on Complementary Team Performance**. Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems. [Canonical record](https://doi.org/10.1145/3411764.3445717).

11. Zana Buçinca, Maja Barbara Malaya, Krzysztof Z. Gajos. 2021. **To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making**. Proceedings of the ACM on Human-Computer Interaction 5, CSCW1, Article 188. [Canonical record](https://doi.org/10.1145/3449287).

12. Helena Vasconcelos, Matthew Jörke, Madeleine Grunde-McLaughlin, Tobias Gerstenberg, Michael Bernstein, Ranjay Krishna. 2023. **Explanations Can Reduce Overreliance on AI Systems During Decision-Making**. Proceedings of the ACM on Human-Computer Interaction 7, CSCW1, Article 129. [Canonical record](https://doi.org/10.1145/3579605).

13. Tianyu Gao, Howard Yen, Jiatong Yu, Danqi Chen. 2023. **Enabling Large Language Models to Generate Text with Citations**. Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing. [Canonical record](https://aclanthology.org/2023.emnlp-main.398/).

14. Nelson F. Liu, Tianyi Zhang, Percy Liang. 2023. **Evaluating Verifiability in Generative Search Engines**. Findings of the Association for Computational Linguistics: EMNLP 2023. [Canonical record](https://aclanthology.org/2023.findings-emnlp.467/).

15. Yonatan Geifman, Ran El-Yaniv. 2019. **SelectiveNet: A Deep Neural Network with an Integrated Reject Option**. Proceedings of the 36th International Conference on Machine Learning, PMLR 97. [Canonical record](https://proceedings.mlr.press/v97/geifman19a.html).

16. Hussein Mozannar, David Sontag. 2020. **Consistent Estimators for Learning to Defer to an Expert**. Proceedings of the 37th International Conference on Machine Learning, PMLR 119. [Canonical record](https://proceedings.mlr.press/v119/mozannar20b.html).

17. Peter Pirolli, Wai-Tat Fu. 2003. **SNIF-ACT: A Model of Information Foraging on the World Wide Web**. User Modeling 2003, UM 2003, Lecture Notes in Computer Science 2702. [Canonical record](https://link.springer.com/chapter/10.1007/3-540-44963-9_8).
