# Evaluating Nubble as decision support

Research date: 2026-10-25. Scope: the transition from original source to personalized relevance summary to explicit conditional implications and feasible action or inaction under a time budget. This is an original methodological synthesis, not experimental results or a claim of scientific novelty. Bibliographic metadata, queries, access limits, and versions are recorded in `evaluation-sources.json`.

## Main conclusion

The strongest defensible contribution is a falsifiable decision-support hypothesis: **under a stated information and time budget, source-grounded, personalized, conditional implications help users choose better feasible actions than a personalized summary alone.** Fluent or persuasive text, perceived helpfulness, citation presence, and increased willingness to act do not establish that hypothesis. Inaction can be correct; a recommendation can be well cited and still be a poor decision.

## Eight useful primary studies

1. **Bansal et al. (CHI 2021), “Does the Whole Exceed its Parts? The Effect of AI Explanations on Complementary Team Performance.”** Their experiments used three tasks—beer and book sentiment and LSAT reasoning—with human and AI accuracy made comparable. Teams showed complementarity, but explanation conditions did not significantly outperform the confidence baseline. Explaining the top prediction could improve decisions when AI was right and hurt them when AI was wrong. This separates persuasion from effective collaboration. For Nubble: compare end-to-end human decisions with human-only and AI-only performance, and separately inspect correct and incorrect advice. The selected task distribution limits extrapolation. [Published paper](https://doi.org/10.1145/3411764.3445717); [author-hosted final PDF](https://idl.cs.washington.edu/files/2021-AIExplanationsTeamPerformance-CHI.pdf).

2. **Buçinca, Malaya, and Gajos (CSCW 2021), “To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making.”** A 199-person experiment compared three forcing interventions, two simple explainable-AI designs, and a no-AI baseline in a nutrition task. Interventions reduced overreliance without eliminating it; the more effective designs received less favorable subjective ratings, and benefits differed by Need for Cognition. For Nubble: test a short assumption/prerequisite check when advice may be wrong, while measuring its time and effort costs. Do not infer that adding friction everywhere improves constrained utility. The task and simulated advice differ from professional knowledge work. [Published paper](https://doi.org/10.1145/3449287); [indexed manuscript](https://arxiv.org/abs/2102.09692).

3. **Vasconcelos et al. (CSCW 2023), “Explanations Can Reduce Overreliance on AI Systems During Decision-Making.”** Five maze-task studies manipulated task difficulty, explanation effort, and incentives. Their cost-benefit account predicts engagement when checking advice becomes worthwhile relative to accepting it or solving the task alone. Findings reconcile some earlier null effects: an explanation must reduce the cost of useful verification. For Nubble: expose the exact supporting passage and the decision-changing assumption, then test verification success per unit time. A maze permits an unusually clear answer and controlled verification; the mechanism is a hypothesis to test in Nubble’s domain. [Published paper](https://doi.org/10.1145/3579605); [indexed manuscript](https://arxiv.org/abs/2212.06823).

4. **Gao et al. (EMNLP 2023), “Enabling Large Language Models to Generate Text with Citations.”** ALCE separates fluency, answer correctness, and citation quality across ASQA, QAMPARI, and ELI5. It uses entailment-based citation evaluation and checks automatic metrics against human judgments; reported limitations include NLI errors and incomplete coverage of open-ended answer content. For Nubble: audit factual support and useful content coverage separately. A short extract can have excellent citation support while omitting the evidence needed for a decision. Automated entailment should assist, not replace, a validated human audit. [Canonical paper](https://aclanthology.org/2023.emnlp-main.398/).

5. **Liu, Zhang, and Liang (Findings of EMNLP 2023), “Evaluating Verifiability in Generative Search Engines.”** Their human audit separates perceived utility from citation recall and precision. Recall concerns verification-worthy statements supported by their citations; precision concerns whether citations support their associated statements, including a specific rule for collectively supporting citations. The authors explicitly distinguish verifiability from factuality. For Nubble: measure whether claims are supported, whether important evidence is missing, and whether the resulting decision is good as different constructs. Their audit describes the systems and queries studied in 2023, not current-system performance. [Canonical paper](https://aclanthology.org/2023.findings-emnlp.467/).

6. **Geifman and El-Yaniv (ICML 2019), “SelectiveNet: A Deep Neural Network with an Integrated Reject Option.”** A selective predictor combines a predictor with a selection function; coverage is the probability of predicting, and selective risk is expected loss conditional on prediction. The experiments concern classification/regression, not generative recommendations. For Nubble: publish risk–coverage curves and count missed useful recommendations, so a system cannot appear safe simply by abstaining on everything. Thresholds need held-out calibration. Epistemic abstention (“insufficient evidence to recommend”) differs from substantive inaction (“given the evidence and your objective, maintain the current course”). [Canonical paper](https://proceedings.mlr.press/v97/geifman19a.html).

7. **Mozannar and Sontag (ICML 2020), “Consistent Estimators for Learning to Defer to an Expert.”** The framework learns prediction and deferral together, accounting for the downstream expert’s errors and optional deferral costs. The authors analyze a consistent surrogate and evaluate on image/text tasks with human and synthetic experts. For Nubble: evaluate a combined human–system policy, including the cost and quality of a request for more information or expert review. “Send to human” is not automatically a correct or free outcome. The paper’s prediction/delegation setup is not the same as a human deciding whether to follow natural-language advice. [Original proceedings PDF](https://proceedings.mlr.press/v119/mozannar20b/mozannar20b.pdf).

8. **Pirolli and Fu (UM 2003), “SNIF-ACT: A Model of Information Foraging on the World Wide Web.”** The model relates navigation to information scent, or the relevance of visible cues to a user’s goal, and models leaving a site as its expected usefulness falls. User tracing combines browser logs, eye tracking, and think-aloud protocols. The study fits traces from only four users on two tasks. For Nubble: record source openings, returns, abandoned paths, and time to decision-relevant evidence; a click or engagement increase is not itself improved decision quality. This supplies a process hypothesis and measurement approach, not evidence that personalized summaries improve real-world outcomes. [Published chapter](https://doi.org/10.1007/3-540-44963-9_8); [full author manuscript](https://www.peterpirolli.com/ewExternalFiles/Pirolli-Fu%20UM2003.pdf).

Pirolli and Card’s 1999 *Information foraging* is an important antecedent, corroborated in the 2003 paper’s references. Attempts to read the CMU-hosted original failed; it is not counted as a full-text-read study here. No empirical claim above relies on the unread original. Horvitz/Barry and Simon are existing foundations, not independent evidence that Nubble works.

## Decision-theoretic formulation: proposed, with explicit assumptions

Let D be the fixed source bundle, u the user’s stated goals/resources/constraints, θ the task-relevant world state, and A(u) the feasible actions, including the status quo. Nubble produces message m = π(D,u,B); the user then chooses a = h(m,D,u). A policy may instead request missing information or defer to a specified expert. Let B be the total permitted elapsed decision time, including opening and checking sources.

The target is expected net decision utility:

`J(π,h) = E[V_u(a,θ) − C_u(a) − C_read − C_verify − C_defer]`, subject to `T_read + T_verify + T_decide ≤ B` and `a ∈ A(u)`.

This is an adaptation of established decision/effort/deferral frameworks, not a new theorem. If action costs are already part of V, omit C_u to avoid double counting. If time has no defensible conversion into utility units, compare utility at equal B and show utility–time frontiers instead of inventing a scalar exchange rate. Across a queue of items, enforce the session budget; do not maximize an average utility/time ratio that hides costly failures or skipped items.

Ground truth is available only where a defensible task model exists. For controlled cases, specify a utility table or simulator and feasible set before generating the messages. The case oracle is `max_{a∈A(u)} E[V_u(a,θ)−C_u(a) | task truth]`; regret is oracle utility minus final chosen-action utility. Label this a **case-defined oracle**, not the objectively best real-world decision. For open professional decisions without an identifiable utility function or causal outcome model, use blinded, pre-specified expert rubrics and report disagreement; do not call rubric scores proven downstream utility.

Do not replace unknown causal consequences `E[Y | do(a)]` with a correlational source claim `E[Y | a]`. A conditional implication must identify its source facts, user facts, external premises, causal assumptions where applicable, and feasibility requirements. The source need not literally recommend the proposed action; the inference chain, uncertainty, and normative objective must be visible.

## A stronger study that can be preregistered

### Stage 1: independently score the artifacts

Create a versioned benchmark of source bundles, role profiles, stated goals, budgets, and feasible options. Include conflicting evidence, missing prerequisites, irrelevant developments, missing user facts, and cases where inaction or obtaining information is best. Split by source/topic/time before prompt tuning to reduce leakage. Use held-out role profiles to test whether personalization generalizes. Include both controlled cases with explicit payoffs and real-domain cases assessed by experts; analyze them separately.

Have qualified annotators independently mark the decision-relevant source facts and prerequisites before seeing model outputs. Audit outputs with condition labels masked and order randomized. Annotators should separate:

- source assertions, user-supplied facts, assumptions, predictions, and proposed choices;
- supported/contradicted/unsupported atomic factual claims, with source spans;
- omitted decision-critical evidence and counterevidence;
- prerequisites and resource/authority constraints for each proposed action;
- correct handling of “irrelevant,” “insufficient information,” and “best to do nothing.”

This atomic-claim rubric adapts ALCE/Liu; it is not numerically identical to their sentence-based precision measures. Report the denominator, segmentation rule, how partial/joint support is treated, inter-rater reliability, and adjudication procedure. Do not merge factual support and inferential validity into one citation score. Keep critical-error rate visible even if a composite score is also reported. Automated judges require a blinded human validation sample and uncertainty estimates; they must not be the sole judges of the primary human decision outcome.

### Stage 2: randomized constrained-decision experiment

Use four arms with a common interface and the same available source bundle:

1. Original source access alone (human baseline).
2. Generic source-grounded summary.
3. Personalized source-grounded relevance summary.
4. The same personalized design plus explicit conditional implications, feasible options, prerequisites, and inaction/deferral where warranted.

All participants receive the same task and user-role context. Give each arm the same elapsed time budget, including source checking. Keep generated arms within the same display budget and document actual lengths; use a matched-length sensitivity analysis if lengths differ. All arms can open the original. Freeze model versions, prompts, retrieval, temperature, and generated artifacts for the confirmatory trial. A human should never see multiple versions of the same case. Randomize and counterbalance case/condition assignment; model participant and case effects. Pilot with representative users to assess case difficulty, floor/ceiling effects, variance, and feasible completion time. Determine sample size using a minimum meaningful utility difference and a power analysis that respects case and participant clustering; do not invent an impressive participant count.

**Primary estimand:** intention-to-treat difference in final case-defined utility (or regret) between arm 4 and arm 3 at the fixed time budget. Predefine timeout/missing-response scoring. The other comparisons identify personalization (3 vs 2) and complete-product effect (4 vs 1); preregister which are confirmatory and handle multiplicity. Present CIs, effect sizes, and sensitivity to plausible utility weights. A nonsignificant difference is not equivalence; a noninferiority design needs a justified margin and power calculation.

Run the corresponding AI-only policy on the same cases and information, scoring its selected action using the same rubric. Define complementarity only when the team improves over **both** human-only and AI-only on the same outcome and case distribution. Also report the human–AI error overlap: there may be little potential for correction when their errors coincide. More agreement with AI is not a success metric.

**Pre-specified secondary outcomes:** decision-critical evidence comprehension; hard-constraint violations; consequential unsupported claims; appropriate deferral; inappropriate action on inaction-optimal cases; missed beneficial action; verified-source success and time; total time; workload; and perceived helpfulness. Keep persuasion/helpfulness as diagnostic outcomes. For probability forecasts with resolvable targets, use a proper scoring rule and calibration; do not treat a fluent confidence statement as a calibrated probability.

Add a separately labeled robustness stratum with matched, plausible erroneous advice or a missing prerequisite and measure acceptance of wrong advice. Its error prevalence is experimentally chosen, not an estimate of product error frequency. Keep it separate from the natural-output effectiveness analysis. To test a cognitive-forcing intervention, randomize a short prerequisite/assumption check in a follow-up experiment, and count its time cost. Obtaining an independent preliminary answer can reveal harmful switches but also changes cognition; use a dedicated elicitation study or give the same elicitation to every compared arm.

### Stage 3: external validity and resource allocation

After controlled benefit and artifact quality are established, run a longitudinal, consented study with representative professionals and their actual information queues. Measure agreed, observable decision outcomes or decision-process quality, opportunity costs, deferred items, and sustained use. Random assignment supports causal claims about the tested interface; observational adoption and self-reported productivity do not establish causal downstream benefit. Hold-out domains and changing sources test robustness. Treat demographic, expertise, and cognitive-motivation subgroup analyses as pre-specified only if adequately powered; otherwise label them exploratory.

## Minimum scorecard and scientific claim boundary

| Construct | Operational metric | Failure it prevents |
|---|---|---|
| Better choices | Utility/regret at common time budget | Mistaking convincing prose for better decisions |
| Evidence grounding | Supported atomic factual claims; critical unsupported claims | Decorating advice with citations |
| Evidence sufficiency | Coverage of pre-annotated decision-changing facts/counterevidence | Winning by saying little |
| Feasibility | Rate of violations of predeclared hard constraints | Recommending actions the user cannot take |
| Appropriate restraint | Inaction, request-information, and expert-deferral outcomes separately | Confusing uncertainty with “do nothing” |
| Reliable selectivity | Risk–coverage curve and missed-opportunity cost | Winning by abstaining on everything |
| Collaboration | Team utility vs human-only and AI-only | Calling human improvement complementarity |
| Bounded attention | Utility–time frontier; time to verified relevant evidence | Optimizing engagement or reading speed alone |

Preregister a meaningful primary contrast, case distribution, payoff/rubric rules, exclusions, stop rule, missing-data policy, analysis model, multiplicity policy, and adverse-error categories. Publish source snapshots where rights permit, role schemas, prompts, model identifiers, output artifacts, annotation guidelines, and analysis code. Report all arms, failures, and CIs. Until those experiments exist, claims should be “proposed and theoretically motivated,” not “proven,” “optimal,” “more actionable by X%,” or “scientifically novel.”
