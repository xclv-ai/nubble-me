# Nubble repository review and public research release proposal

**Reviewed:** October 25, 2026  
**Repository:** `/Users/xclv/dev/nubble-me`  
**Remote:** `https://github.com/xclv-ai/nubble-me.git`  
**Local HEAD:** `19b2fbbc4bac7666a8614220c91f83e42745028a`, dated October 15, 2026  
**Scope:** read-only source/documentation review. No application builds, credential rotation, deployment testing, remote visibility audit, or public release performed.

## Assessment

The repository contains substantial prototype work for the idea, especially on iOS. It is currently a product-development archive rather than a reproducible research release. The public-facing README describes depth-controlled reading; newer code already contains personalized meaning, implications, and actions. The new research story should explain that transition and test whether it helps readers make better decisions.

The strongest framing is:

> **Attention is currency. Information should earn it.**  
> Nubble connects the original source to what matters for your focus and what it could change in your next decision.

The recommended paper title is **Beyond the Summary: Nubble and the So-What Layer**, with the subtitle *An Evidence-Grounded Framework for Personalized Implications and Proposed Actions Under an Attention Budget*.

This review and its companion documents are local proposals. They do not make the existing repository publication-ready.

## What already exists

| Intended representation | Existing implementation | Gap to the proposed method |
|---|---|---|
| Full / original | iOS retains extracted article text or an RSS snippet as `standard`; web file imports retain original chunks. | Retrieval scope must be explicit. Generated web news feeds do not preserve originals. |
| Short / relevant to you | iOS ranks against an editable product profile. Web has a POKPOK-specific generation script. | Generic summary/condensed fields are not a distinct, consistently personalized Short representation. |
| So what? | iOS generates product relevance, meaning, longer-term impact, and three actions; actions can become prescriptions. | Source-linked premises, assumptions, feasibility, appropriate inaction, and controlled evaluation are needed. |

Evidence: `ios/Nubble/Services/NewsConversionPipeline.swift:31–43,63–70`; `server/notebooklm.ts:87–94`; `ios/Nubble/Services/RelevanceRanker.swift:22–48`; `ios/Nubble/Services/NewsDepthWriter.swift:314–346`; `ios/Nubble/Models/Prescription.swift:3–11`.

The UI still exposes five labels—Summary, Condensed, Article, Expanded, For you—at `ios/Nubble/Views/Rounds/DepthSheet.swift:10`. The older web README describes four depths at `README.md:7–11`. The proposed Full/Short/So what? model concerns function; text length/depth is a separate interaction choice.

## Prioritized findings

### P0: tracked API credentials

Hardcoded provider-key fallbacks occur at `server/generate-personalized.ts:16` and `server/add-pokpok-insights.ts:16`. Credential values are intentionally omitted. The personalized script is present in historical commit `ba86713` from April 9, 2026.

Before distributing this history: revoke/rotate the affected credentials, remove hardcoded fallbacks, inspect historical exposure, and scan the intended release and history. Removing a line from the current tree does not invalidate a credential already present in an older revision. No credential has been revoked or changed during this review.

### P1: provenance is incompatible with the research claim

The feed generator asks for outputs without sources/URLs at `server/feed-pipeline.ts:264`, without citations at `:300`, and removes citation/metadata material at `:491–507`. It writes `source = "nubble"` and `source_url = "unknown"` at `:525–535`. Its Standard representation is assembled from generated condensed text and generated significance at `:305–306`.

All **50 stories across the five public `latest.json` snapshots** have `source_url: "unknown"`. Example: `client/public/data/feed/ai-news/latest.json:12`. This blocks source-faithfulness evaluation and any claim that these generated feeds expose the original article. Notebook IDs/source counts do not establish claim-to-source lineage.

**Acceptance criterion:** every research fixture identifies the exact available original, retrieval scope, and claim-support spans. A generated depth is never labeled original.

### P1: there is no empirical research package yet

No tracked manuscript, controlled study protocol, baseline dataset, annotation rubric, ablations, or reproducible results package was found. User testing remains unfinished at `TODO.md:12`.

The iOS self-test at `ios/Nubble/Services/SelfTest.swift:5–34` is useful debugging infrastructure. Internal notes report invented products/actions, generic recommendations, and irrelevant stories ranked High at `docs/HANDOFF-2026-10-13-IOS-ON-DEVICE-AND-REDESIGN.md:19–20,40–52`. Those failures should become evaluation cases.

**Acceptance criterion:** publish a frozen protocol and compare original-only, generic summary, personalized summary, and personalized summary plus So what? under controlled text/time budgets. Report failures as well as aggregate quality. See [the proposed protocol](PAPER_PROPOSAL.md#evaluation-protocol).

### P1: clean-clone reproduction is incomplete

`README.md:58–74` contains pasted npm output and empty setup/build/structure sections. There is no tracked `.env.example`.

`server/feed-nightly.sh:11` changes to a machine-specific absolute path. Its lines `74–76` automatically stage feeds, commit with `--no-verify`, and push `main`. It should not be the default research reproduction command.

The iOS cloud service requires `Secrets.aiGatewayKey` at `ios/Nubble/Services/HaosCloud.swift:13`; its generated definition is ignored by Git, and `ios/scripts/secrets.sh:2–10` reads configuration from another private repository. A documented optional configuration path or no-key stub is needed for an independent clone.

**Acceptance criterion:** offline example works from a clean clone without credentials or private repositories; live inference is opt-in with documented dependencies and configuration; the reproduction path never commits or pushes automatically.

### P1: disclose actual data transfers before hosting private uploads

Local depth generation does not make the entire pipeline local. `ios/Nubble/Services/HaosCloud.swift:16–49` sends product context and candidate excerpts through an external AI gateway. `server/notebooklm.ts:61–69` uploads input documents to NotebookLM.

Web document results reside in a shared in-memory map with list/get routes lacking user isolation at `server/routes.ts:34–42,135–158`. This is a conditional blocker for hosting a public demo that accepts private documents. The review did not test a deployed service and does not establish that a live deployment currently exposes private content.

**Acceptance criterion:** document transfer/storage behavior; keep the first demo on public or fictional fixtures; add appropriate isolation before accepting private user documents.

### P2: licensing and bundled materials need an explicit release decision

`README.md:76–78` and `package.json:5` both declare MIT. No standalone license text or third-party asset inventory was found. Missing a LICENSE file is not proof that no licensing statement exists: GitHub recognizes licensing statements in README files. MIT permits commercial use and sale subject to its conditions. [GitHub licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [official MIT text](https://opensource.org/license/mit).

A noncommercial-use restriction is incompatible with OSI's open-source definition. If the restriction is essential, use “source-available” or “public research repository under noncommercial terms.” If OSI open source is essential, permit commercial use. This is a terminology and licensing choice, not a reason to change the research idea. [Open Source Definition, section 6](https://opensource.org/osd).

For the paper, documentation, and original examples, CC BY-NC 4.0 is a candidate to evaluate; its noncommercial condition concerns the purpose of a use, rather than simply whether the user is a company. CC recommends against using CC licenses for software, so code needs a separate, appropriate decision. A license on a document also does not by itself give control over an abstract method or independent implementation. [CC BY-NC legal text](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en), [NC guidance](https://creativecommons.org/faq/#does-my-use-violate-the-noncommercial-clause-of-the-licenses), [software guidance](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software).

Review authorship/contribution history before changing distribution terms. Do not promise that a new label withdraws permissions associated with earlier MIT-distributed copies. Preserve applicable notices when reusing MIT material. [GitHub's guide to changing a license](https://opensource.guide/legal/#what-if-i-want-to-change-the-license-of-my-project).

Inventory fonts, screenshots, reference art, generated media, and source-derived text individually. The existing product plan itself flags content-rights questions at `docs/PRODUCT_PLAN.md:184`. No license has been selected or applied in this packet.

### P2: output metadata and repository weight undermine trust

`server/feed-pipeline.ts:89–91` parses the first integer in CLI output as a count, which is later used for `sources_found` at `:230`. The AI feed reports **5,378,320 sources** at `client/public/data/feed/ai-news/latest.json:5`, despite requesting 25 imports. Treat this as unreliable metadata, not evidence of research breadth.

Four generic latest snapshots are dated May 11, 2026; the personalized snapshot is dated April 8, 2026. Tracked content is approximately 234 MB, much of it design renders/references and audio. Use a small curated research release rather than making every reader clone a design archive. Archive snapshots should carry their dates and must not be described as current market intelligence.

## Recommended public repository

**Working name:** `nubble-method`  
**One-line description:** “Full → Short → So what? A research framework for turning information into contextual implications and next steps under limited attention.”

Prefer a small, clearly scoped research repository with provenance-checked materials and an explicit reference to the prototype. This can reduce accidental inclusion of legacy credentials, personal paths, private configuration, and unverified assets. A new repository does not fix prior credential exposure or erase existing third-party licensing obligations.

Suggested eventual layout:

```text
README.md              Three representations, one complete example, research status
LICENSE*               Explicit terms for each material type, after the decision
CITATION.cff           Real authors and release/paper identifiers when available
paper/                 Manuscript source and versioned publication artifacts
method/                Context contract, provenance, prompts, failure taxonomy
examples/              Small rights-cleared sources and contrasting reader contexts
evaluation/            Protocol, rubric, baseline runner, analysis, failure cases
CONTRIBUTING.md        How to submit a case or reproduce a result
SECURITY.md            Private reporting route established by the maintainer
```

This is a target structure, not a claim that these artifacts already exist. Do not add a fabricated DOI, author list, study result, or citation badge.

## Recommended release order

1. **Clear the release boundary.** Resolve exposed credentials, choose what can be shared, review existing MIT statements and asset rights, and decide the noncommercial terms for the new materials.
2. **Make the method inspectable.** Publish the draft as a proposal, with one source shown across different contexts and explicit fact/inference/action distinctions. This review packet supplies a starting draft.
3. **Make an independent run possible.** Build a small fixture-first reference pipeline with pinned inputs/prompts/settings and optional live model access. Add source-lineage checks and document requirements. Existing application build/test status is unverified here.
4. **Make the claim testable.** Freeze the evaluation protocol and publish a modest development corpus with irrelevant and no-action cases. Pilot the tasks, then determine the confirmatory sample size.
5. **Release findings.** Publish the results and failure cases, including a negative outcome if the So-What Layer does not help. Add release/citation metadata and a short demo showing evidence inspection.
6. **Invite focused participation.** Offer case-submission and reproduction tasks that improve the research instead of only soliciting stars.

## Making the repo worth sharing

The first screen should show one source becoming different decisions for different readers. A reader should understand the claim and inspect the evidence without an API key. Keep a short, accurate visual demonstration beside the method and link directly to reproducible cases.

Useful first contribution types: a missed caveat; a profile-swap failure; a case where no action should be taken; a reproduction using another model; or an unsupported implication with its source span. Those contributions accumulate an evaluation asset other researchers can use and cite.

Track successful independent reproductions, contributed cases that pass review, and research use/citations. Stars and visits can measure reach, but they do not validate the method. No documentation or launch tactic can guarantee popularity.

## Work performed and verification limits

- Reviewed the local Git tree, relevant web/iOS pipelines, generated feed snapshots, setup docs, and existing research/strategy notes.
- Used primary research and official licensing sources to bound claims and clarify the noncommercial decision.
- Created documentation proposals only in `GPT Nubble/`: [README](README.md), [method](METHOD.md), [paper proposal](PAPER_PROPOSAL.md), and [worked example](examples/competitor-update.md), plus this review.
- Existing local edits to `ios/Nubble/Info.plist` and untracked home-render assets were left untouched.
- No application builds/tests ran: dependencies are absent and production code was not changed. The review does not certify runtime behavior, security, legal clearance, or readiness for publication.
- Checked all five Markdown documents for balanced code fences and their 25 local links/anchors. A separate final documentation reviewer could not run because of an account usage limit; the final coherence review was performed by the authoring agent. The earlier repository audit and source research were completed independently.
