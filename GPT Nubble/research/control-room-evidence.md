# Control Room evidence and prototype-to-method mapping

Reviewed 25 October 2026, Europe/Warsaw. This is a sanitized implementation evidence memo, not a study result. No production system, application source, database row, draft, or publishing workflow was changed. No generation, refresh, publish, message, deployment, commit, or push was triggered.

## What was actually inspected

The relevant **Control Room is POKPOK's marketing dashboard**, at [share.pokpok.ai/ControlRoom.html](https://share.pokpok.ai/ControlRoom.html). It is a separate implementation from the Nubble reading application. Its local source is `/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html`, built with `public_build.py` and the sign-in/data connector. The dashboard's README supplies that address; a dated handoff is historical evidence, not proof of the present deployment.

Two evidence channels were used:

- **Current source inspection by this research agent:** the POKPOK dashboard page, its builder and data connector, and the limited news-consumption section of its worker. These are private integration sources; they were read for feature-level understanding and are not copied into the public research fixtures.
- **Signed-in live inspection by the parent agent on 25 October 2026:** confirmed short news text, original-article links, generated “For POKPOK” implications, optional “Next step,” and an “Explain for POKPOK” button on unexplained stories. One displayed card said the news did not change the company's measurement approach and offered no next action. The live page also disclosed stale news/competitor information and incomplete competitor coverage. These observations establish what the interface displayed, not the truth of a story or the correctness of a model's business assessment. No button was triggered.

Separately, the Nubble application was inspected at local Git revision `7b72cd942f9060e5cd7bd1add80e87e43e4b243d`. It contains a web depth reader and a more developed native iOS profile/ranking/implication/action prototype. Neither application was built or run in this inspection. No current browser tab initially identified the Control Room; its address was located through the adjacent POKPOK source.

No private metrics, unpublished drafts, competitor assertions, account identities, screenshots, credentials, or production data have been reproduced here or converted into public examples.

## The Control Room already demonstrates the core distinction

| Research representation | Observed Control Room behavior | What the observation supports |
|---|---|---|
| **Full**: what did the source say? | Each industry-news slide can link to the original article in another tab. | Access to a source is present. A link alone does not prove successful full-text extraction or preserved source content. |
| **Short**: what is the relevant signal? | Unexplained rows show a title and short description; explained rows use a generated headline and essence. | A compact representation precedes further analysis. The UI alone does not establish that every initial description is personalized. |
| **So what?**: what could this change for this reader? | Explained rows add “For POKPOK” and may add “Next step.” An explanation is requested for one story at a time. | Contextual implication is a distinct output role beyond shortening. Actions can be omitted. |
| **Attention allocation** | Further explanation is requested only when a reader chooses it; news is presented as individually navigable slides. | Progressive investment of attention is implemented. Its benefit has not been measured. |
| **Appropriate inaction** | A live displayed explanation found no effect on the company's measurement and had no next action. | The product can display a meaningful no-change conclusion; this should be an explicit method outcome. |

Useful public wording:

> Nubble connects an information source, the part relevant to an identified reader, and what it could change in that reader's next decision. Its So-What Layer may recommend acting, investigating, monitoring, or taking no action.

This is a proposed definition informed by the prototype. It is not a claim that every safeguard in the research method is already implemented.

## What the dashboard code establishes

The relevant implementation is concentrated in [the news rendering and explanation functions](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:699).

- The page reads separate `news` and `news_card` collections and joins a news story to its explanation by the same identifier. The explanation contains `headline`, `essence`, `pokpok_meaning`, and `pokpok_action`. See [collection subscriptions](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:1001) and [card rendering](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:717).
- Before an explanation exists, the page offers “Explain for POKPOK” if the story has an explanation URL. The button calls that stored URL and waits for a corresponding card to appear. The code comment identifies a separate model-backed workflow; the underlying workflow itself was not inspected. Do not assert an exact deployed model, model revision, prompt, retrieval scope, or model behavior from that comment. See [request handling](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:703).
- The reader sees a title, essence, contextual meaning, optional next step, and a source-domain link. A literal action value of `none` is omitted. This omission supports optional action presentation, not a complete formal abstention policy. See [the displayed fields](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:721).
- Only the eight newest industry-news entries are rendered by this function. Character-based display caps shorten the headline, essence, meaning and action. Those caps are UI constraints; they are not experimental attention budgets. See [selection and truncation](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:719).
- The source is opened through its stored original URL. No claim-to-passage evidence identifiers are rendered by this function. A model's implication and proposed action therefore remain assessments a reader must check, rather than verified consequences. See [the original link](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:729).
- Progress phrases change according to elapsed time. They are not backend stage telemetry. A missing result produces a retry offer after two minutes. A demonstration must not treat “Reading the full article” or “Almost there” as evidence of a completed backend operation. See [progress handling](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/dashboard/control-room.html:705).
- The downstream worker consumes selected news and available contextual meanings when preparing marketing work. This establishes an integration path from information to proposed work; it does not establish that the recommendation was adopted or improved an outcome. See [news consumption](/Users/xclv/dev/pokpok-ai/marketing/threads-lab/watcher/bot.py:165).

The dashboard's private sign-in/data connector and broader publishing controls are operational product infrastructure. They are not required components of the research method and should not be copied into a credential-free reference implementation.

## The Nubble iOS prototype supplies a generalizable context mechanism

These are **source-code observations**, not live-tested behavior in this session.

| Component | Existing behavior in code | Research-method implication |
|---|---|---|
| Reader context | A product has a URL, name, editable description, update timestamp, extracted offering names, and market topics. A product page can initialize the description. [Profile](/Users/xclv/dev/nubble-me/ios/Nubble/Models/ProductProfile.swift:5), [editor](/Users/xclv/dev/nubble-me/ios/Nubble/Views/Feed/ProductView.swift:46). | Treat context as inspectable input. Add decision objective, constraints, horizon, unknowns and review/version history to the proposed contract. |
| Source collection | Users can add/discover, enable, disable and delete news feeds. The feed service fetches active sources and bounds the recency window/items per source. [Source editor](/Users/xclv/dev/nubble-me/ios/Nubble/Views/Feed/SourcesView.swift:3), [local reader](/Users/xclv/dev/nubble-me/ios/Nubble/Services/LocalFeedService.swift:5). | Record collection boundaries and source coverage. “Nothing relevant found” must be distinct from “all relevant sources checked.” |
| Relevance | A model evaluates a title plus a short snippet against the product description. High means act this week; medium means worth knowing with no action; low means outside the business. A lexical overlap check can demote a High answer. [Ranker](/Users/xclv/dev/nubble-me/ios/Nubble/Services/RelevanceRanker.swift:22). | This is screening, not comprehensive reading or calibrated probability. Separate relevance, confidence, urgency and actionability in the research model. |
| Attention selection | Rounds chooses at most three recent stories, prioritizing watchlist mentions and then model-reviewed, in-market, relevant items. [Selection](/Users/xclv/dev/nubble-me/ios/Nubble/Models/FeedState.swift:87). | Selection is part of the mechanism. Evaluate missed signals and unnecessary interruptions alongside output quality. A watchlist match is not proof of actual threat. |
| Full/source text | Conversion prefers extracted article text when longer than the feed snippet; otherwise it retains the snippet. The chosen text is stored as `standard`. [Conversion](/Users/xclv/dev/nubble-me/ios/Nubble/Services/NewsConversionPipeline.swift:31). | “Full” needs a retrieval-scope field: complete article, excerpt, feed snippet, or unavailable. Do not label a snippet a full original. |
| Short | Summary and condensed prompts are written from source text or compressed notes. Their prompts do not include the product context. [Brief generation](/Users/xclv/dev/nubble-me/ios/Nubble/Services/NewsDepthWriter.swift:77). | The proposed reader-relevant Short layer is a deliberate extension; current summaries are not consistently personalized. |
| So what? | The product-specific output asks for relevance, meaning for the product/customers, impact over six to twelve months, and exactly three short actions. [Product-level prompt](/Users/xclv/dev/nubble-me/ios/Nubble/Services/NewsDepthWriter.swift:314). | Existing code establishes contextual implication/action intent. Replace mandatory three-action generation with justified choice among action, investigation, monitoring and no action. Forecasts need assumptions and uncertainty. |
| Human choice | A reader can accept a prescription; stored items have todo/done/later/skipped states. Accepted items may be sent to Reminders if access is granted. [Model](/Users/xclv/dev/nubble-me/ios/Nubble/Models/Prescription.swift:3), [acceptance](/Users/xclv/dev/nubble-me/ios/Nubble/Models/FeedState.swift:106). | A recommendation is not an executed decision or a successful outcome. Record acceptance, later execution and outcome separately if studied. |
| Versioning | Profile changes prompt rescoring; generated documents carry a product timestamp and writer version; stale product layers can be rewritten. [Refresh](/Users/xclv/dev/nubble-me/ios/Nubble/Services/NewsConversionPipeline.swift:103). | Extend this into explicit source/context/prompt/model lineage for each study item. |

The UI still offers five depths—Summary, Condensed, Article, Expanded, For you—rather than a literal three-tab implementation. See [depth labels](/Users/xclv/dev/nubble-me/ios/Nubble/Views/Rounds/DepthSheet.swift:10). **Full / Short / So what? are semantic roles. Length and navigation depth are separate interface choices.** The paper can describe both without claiming they are the same system.

## Limitations that should be explicit in the paper

1. **Prototype evidence is separate from effectiveness evidence.** The live Control Room demonstrates the output roles. It supplies no controlled comparison, causal estimate, decision-quality score, error rate, or validated attention saving.
2. **Links are not claim-level provenance.** The next research step is stable source passages supporting factual premises, plus explicitly labeled reasoning connecting those premises to context. No source inspection establishes the future market consequences of a news story.
3. **The existing implementations are uneven.** Control Room is organization-specific; iOS allows an editable product description. Neither observation alone demonstrates generalization across people, domains, or decision types.
4. **Reader context can be stale or wrong.** Product descriptions are model-initialized and editable. A useful research case must freeze the context used and identify missing information rather than filling gaps with invented strategy.
5. **Compression adds another failure opportunity.** The iOS writer may repeatedly summarize long inputs before generating other views. Research records need the exact source and intermediate notes, not only final prose. See [long-text handling](/Users/xclv/dev/nubble-me/ios/Nubble/Services/NewsDepthWriter.swift:260).
6. **Action pressure is a known design risk.** The iOS prompt's “exactly 3 moves” and short prescription prompts can manufacture activity. Control Room's optional next step is a better starting behavior for a formal no-action outcome; correctness still needs annotation.
7. **Processing is hybrid.** Local extraction/on-device generation coexist with an optional external call carrying product context and candidate excerpts for relevance/headline/verdict/action. Do not describe the whole system as local or as never sending context to an AI service. See [external request](/Users/xclv/dev/nubble-me/ios/Nubble/Services/HaosCloud.swift:16).
8. **Freshness and coverage are observable limitations.** The live dashboard explicitly showed stale/partial monitoring. A no-change implication and a low-value story should not be confused with missing, old or unreadable evidence.
9. **Presentation claims need verification.** Static “~90 s,” “stories read,” stage text and confident persona wording are interface copy, not measured latency, full-text coverage, calibrated confidence, or proof of factual grounding.

The prior repository audit already records credentials and public-feed provenance failures. This inspection did not repeat those scans or alter their findings.

## What the new release should describe and show

The paper should introduce the three output roles using a rights-cleared or fictional source and two contrasting reader contexts. It should separately identify the operational observation: a private Control Room already displays short source information, contextual implications, optional next steps and an original link. The implementation section can then explain the iOS profile/ranking/action prototype and its differences from the proposed research contract.

Suitable publication figures are:

- **Mechanism diagram:** source and versioned reader context feed Short and So what?; evidence remains accessible; the reader chooses an outcome. Label the arrows as designed information flow, not measured causal effects.
- **One source, two readers:** identical facts, different relevance and implications; one reader receives a bounded investigation, another no action. Label the case synthetic.
- **Grounding chain:** source passage → factual premise → context match → conditional implication → proposed response, with assumptions and uncertainty visible.
- **Evaluation schematic:** fixed source/context/task, matched reading budget, randomized condition, blinded decision assessment. Any expected benefit should be shown as a hypothesis, never an invented result curve.

Do not reuse private dashboard screenshots, stored news assessments, drafts, metrics, or competitor conclusions as the research corpus. A figure may recreate the observed interaction using synthetic data and must be labeled as an illustrative reconstruction. Any public reference package should work without POKPOK accounts, the private dashboard repository, or live generation credentials.

## Claim boundary for README and abstract

Safe: “The framework is motivated by a working interface that exposes source access, a compact signal, and organization-specific implications with optional next steps.”

Safe: “The proposed evaluation tests whether this additional layer improves decisions under a matched attention budget, while accounting for unsupported inference, unnecessary actions and appropriate inaction.”

Unsupported: “Nubble improves decision quality,” “Nubble saves a quantified amount of attention,” “Nubble reads every source in full,” “Nubble produces verified implications,” or “the method has been validated in production.”

The implementation is a motivating prototype. The proposed reproducible method and its empirical validation remain distinct deliverables.
