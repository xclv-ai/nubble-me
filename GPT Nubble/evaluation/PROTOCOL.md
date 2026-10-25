# Nubble preregistration draft

**Status:** protocol proposal, not a registration or a completed study. Version 0.2, October 25, 2026. Resolve the declared design choices and freeze a dated version before confirmatory data collection.

## Estimand and hypotheses

The primary estimand is the intention-to-treat difference in final case-defined decision utility (or equivalently defined regret) between personalized Short plus So what? (D) and personalized Short alone (C), at a common elapsed time budget. Choose utility or regret as the primary presentation before registration; do not switch based on significance.

H1 predicts improved decisions. Secondary hypotheses concern contextual fit, decision-critical evidence comprehension, feasible options, and appropriate restraint. A statistically nonsignificant result is not equivalence. Any noninferiority claim requires a declared, justified margin and a design powered for it.

## Materials: two distinct tracks

**Controlled:** self-authored or rights-cleared cases with states, evidence, feasible options, costs, uncertainty, and a status-quo action. Freeze a payoff table or simulator and a reference policy using the same permitted information as the participant. The reference cannot use hidden future knowledge. Include act-optimal, maintain-optimal, verify-optimal, monitor-optimal, irrelevant, conflicting, and insufficient-information cases. Realized outcomes and expected decision quality are different quantities.

**Realistic:** actual professional tasks with explicit reader-owned goals and constraints. Domain reviewers define an ordinal rubric before seeing outputs. Report agreement and alternative acceptable choices. Analyze separately from controlled utility/regret; do not treat a panel score as observed commercial benefit.

The current public fixture is hand-authored and fictional. It is for demonstrating and validating the contract, not evidence of model quality or a representative benchmark.

## Arms and fair comparisons

| Arm | Condition |
|---|---|
| A | Original-only human baseline. |
| B | Generic evidence-linked summary plus original access. |
| C | Personalized evidence-linked Short plus original access. |
| D | Personalized Short plus conditional implications/options plus original access. |

All participants receive the task/role brief. All arms can inspect the same original bundle. B/C/D share a total display-word budget; D allocates words across its two generated roles. C/D share model/version, source/context access, evidence navigation, neutral style, and uncertainty conventions. Freeze source versions, prompts, settings, generated outputs, and their failures before the human trial.

In C, contextual relevance explains why source facts were selected. Forecasts and proposed plan changes belong to D. Predeclare how crossover is identified and analyzed. Add an unconstrained personalized-summary sensitivity baseline so a constrained C is not the only comparator. Add a staged-prompt implication/recommendation baseline inspired by prior financial-news work. These sensitivity comparisons require their own declared budgets and multiplicity policy.

## Time and other resource accounting

`T_total = T_read + T_source + T_verify + T_decide`. Include source opening/checking, interpretation requests, and deliberation once. Record context-entry/onboarding and delayed verification effort separately; do not omit them from a full-product cost claim. Define exactly when timing starts/ends, whether loading is counted, and how sessions interrupted by unavailable sources are handled.

The primary comparison uses fixed B rather than an arbitrary conversion from seconds to utility. Later budget sweeps can estimate a quality-time frontier. Log generation calls, tokens, latency, errors and provider cost separately from participant attention.

## Sampling, assignment, and missing data

Use a representative pilot to assess floor/ceiling effects, variance, rater reliability, and feasible completion time. Determine the confirmatory sample size from a minimum useful effect and power simulation accounting for participant and case clustering. Record that decision before the confirmatory run.

Split cases by source/topic/time before prompt tuning. Include held-out contexts and expertise levels. Randomize and counterbalance arm/case assignments. No participant sees the same underlying case in more than one arm. Predefine inclusion/exclusion, timeout, incomplete response, technical-failure, participant withdrawal, and missing-data rules. Intention-to-treat analysis must not silently discard hard cases or failed outputs.

## Artifact annotation

Use at least two independent, qualified annotators where feasible and a predeclared adjudication process. Annotators identify decision-critical facts and counterevidence before seeing outputs. Mask system labels/order during output annotation where practical.

Audit source assertions, reader-provided facts, assumptions, predictions, inference mechanisms, and proposed decisions separately. The [rubric CSV](annotation-rubric.csv) provides a draft ordinal scheme; it has not been validated. Publish segmentation, joint/partial support policy, denominators, agreement estimates, disagreements, and adjudication changes. Automatic judges require a held-out human calibration sample and cannot be sole judges of the primary human outcome.

## Outcome reporting

- Primary: final controlled-case utility/regret for D-C at common B, with uncertainty and sensitivity to justified payoff weights.
- Secondary: decision-critical evidence comprehension; unsupported premises; omitted counterevidence; hard-constraint violations; inappropriate action; false reassurance; missed beneficial action; verification success and time; workload; helpfulness.
- Report selectivity: risk among non-abstaining outputs and coverage, with recommendation types act/verify/monitor/maintain declared in advance. Count the cost of missed opportunities and verification/delegation. Maintaining a plan can be erroneous; abstention can also be costly.
- Run an AI-only policy on the same cases/information. Human-AI complementarity requires improvement over both human-only and AI-only on the same outcome/case distribution.

Choose an analysis appropriate to the outcome scale, participant/case clustering, and planned contrasts. Predefine primary/secondary status and multiplicity handling. Report effect estimates and confidence intervals, all tested arms, exclusions, missingness, and adverse-error categories. Do not treat persuasive wording, action acceptance, speed alone, or a citation's presence as success.

## Robustness and ablations

Hold source facts fixed while swapping goal, prior knowledge, resources, authority, and horizon. Remove the pending decision/current plan. Compare original-evidence and summary-only implication input. Vary source completeness, conflicting evidence, word allocation, and explanation on request. Remove the abstention option. Test content-preserving length and audience perturbations to reveal evaluator preferences unrelated to useful content.

A separate stress stratum injects matched plausible erroneous advice or missing prerequisites to measure harmful reliance. The injection prevalence is an experimental setting, not an estimate of natural product error. Test a short prerequisite/assumption check in a separately randomized study and count its effort. An initial independent answer can reveal harmful switches but changes cognition; use a dedicated study or matched elicitation across arms.

## Release and claim boundary

Publish the frozen protocol, rights-cleared inputs or retrieval manifests, reader-role schemas, prompts, model/settings, outputs including failures, run logs with private content removed, annotations, and analysis code. Record deviations from preregistration. No human study, effect size, or validated decision benefit exists in the current release. Report negative findings if the method adds no benefit or increases unsupported action.
