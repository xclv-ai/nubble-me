# Nubble: Beyond the Summary

**Attention is currency. Information should earn it.**

Nubble is a proposed method for turning news and market signals into personally relevant understanding and evidence-linked next steps. Its unit of value is the decision a reader can make with the information.

> **Full → Short → So what?**  
> What happened? → What matters to my focus? → What could this change, and what should I consider doing?

**Status:** research proposal and repository review, October 25, 2026. This folder contains documentation drafts, not a validated paper or a standalone runnable software release. The existing product prototype lives in the parent repository. No study results are claimed here, and no new license has been applied.

## Proposed paper

### Beyond the Summary: Nubble and the So-What Layer

*An Evidence-Grounded Framework for Personalized Implications and Proposed Actions Under an Attention Budget*

The research question: **Does an explicit So-What Layer improve decision quality beyond a personalized summary alone, within the same attention budget?**

[Read the paper proposal](PAPER_PROPOSAL.md) · [Read the method](METHOD.md) · [Inspect the worked example](examples/competitor-update.md) · [Read the repository review](REPO_REVIEW.md)

## Three representations, three jobs

| Representation | Reader's question | Required behavior |
|---|---|---|
| **Full / original** | What does the source actually say? | Preserve the available source faithfully, with attribution and retrieval scope. A snippet stays labeled as a snippet. |
| **Short / relevant to you** | What matters for my current focus? | Select and summarize source-supported information against an explicit goal, decision, and constraints. |
| **So what? / implications and next steps** | What could this change for me? | Connect evidence to the reader's situation, label assumptions and uncertainty, and propose a feasible next step—or explain why none is warranted. |

These are different functions. Summary length and reading depth can vary within them. Expanding an AI summary does not recreate the original source; a shorter article does not automatically explain its implications.

## A small example

**Fictional source:** a competitor adds weekly monitoring of AI brand mentions, but its announcement says nothing about whether it compares AI answers with human brand perception.

**Reader's focus:** a hypothetical POKPOK positioning decision about comparing how people and AI engines perceive a brand. This is an example context supplied for the method, not a verified product specification.

**Short:** “The competitor is moving into AI brand monitoring. Weekly mentions overlap with part of this positioning, but the announcement does not establish a human-versus-AI comparison.”

**So what?** “This could increase buyer confusion about what distinguishes your offering. First verify the competitor's actual comparison features; then revise the comparison copy if the overlap is real. This announcement alone does not justify changing the product roadmap.”

The [complete example](examples/competitor-update.md) includes the full fictional source, a second reader profile, evidence links, assumptions, and a no-action case.

## What would make the research useful

- A source trail from every factual claim back to the available original.
- An explicit reader context that can be inspected, corrected, and changed.
- A visible distinction between source facts, contextual inferences, and proposed actions.
- A finite attention budget and a reason to stop reading.
- Evaluation against personalized summaries, including mistakes, irrelevant signals, and appropriate inaction.

Personalized summarization and decision-aware information presentation have substantial prior work. The [proposal](PAPER_PROPOSAL.md#related-work-and-contribution-boundary) identifies relevant precedents and limits the novelty claim to the proposed integration and its evaluation.

## Release direction

The recommended public project is **Nubble Method**: paper, method, small reproducible examples, prompts, and an evaluation package. The existing web/iOS app can serve as a prototype reference once its release blockers are resolved. See the [prioritized review](REPO_REVIEW.md#recommended-release-order).

The requested restriction to noncommercial use requires a licensing decision. Such a restriction is incompatible with the [OSI Open Source Definition, section 6](https://opensource.org/osd). Until the terms are selected, describe the intended project as a **public research repository with planned noncommercial terms**. This draft is not a license grant. Existing MIT declarations and third-party rights must be reviewed before release.
