# Nubble licensing and paid hosting

Research checked against official sources on 2026-10-25. This is the recommended policy for the user's current direction: genuine open-source code, an openly licensed paper, and the option to charge for a managed service. It does not claim a hosted product or an enterprise license already exists.

## Recommendation

- **Nubble code: `AGPL-3.0-only`.** Use the unmodified GNU AGPL version 3 license text and an explicit version-3-only notice. This matches the request for AGPLv3 without silently granting a choice of future licenses. `AGPL-3.0-or-later` is also a legitimate choice if the author explicitly wants that future-version permission; it does not determine whether paid hosting is allowed. Avoid the ambiguous/deprecated shorthand `AGPL-3.0` in machine-readable metadata. [SPDX's exact identifier and distinction](https://spdx.org/licenses/AGPL-3.0-only.html).
- **Original paper text and original figures: `CC-BY-4.0`.** This permits commercial reuse with attribution, a license link, and indication of changes. Identify third-party material separately. A paper's license does not replace the software license or relicense the papers and datasets it cites. [Creative Commons terms](https://creativecommons.org/licenses/by/4.0/).
- **Optional Nubble Cloud: paid managed hosting.** Charge for operating the service, compute, model/API consumption, maintenance, updates, integrations, and support. Set service terms and pricing separately from the code license. This is a proposed commercial model, not a promise of current features or availability.

## Why Firecrawl can be open source and charge money

Open source does not mean noncommercial or zero price. GNU explicitly supports charging for free-software distribution; users retain the license's freedoms. A business can offer a paid managed service while others run the openly licensed software themselves. [GNU: Selling Free Software](https://www.gnu.org/philosophy/selling.en.html).

Firecrawl's repository identifies its principal license as AGPLv3, with MIT-licensed SDKs and some UI components under their own directory licenses. Its official product documentation distinguishes operating the open-source stack yourself from buying Cloud operation and additional product capabilities. [Repository and license declaration](https://github.com/firecrawl/firecrawl#license); [actual LICENSE](https://github.com/firecrawl/firecrawl/blob/main/LICENSE).

The official comparison lists core scrape/crawl/map/search APIs on both paths, while Agent, Browser, managed dashboards, enhanced proxy paths, and enterprise controls are Cloud product surfaces. Its self-hosting guide says Fire-engine is absent from the default stack and needs separate configuration; screenshot/action support also depends on that service. These are documented product boundaries, not a claim that every service outside the default stack is closed source. Self-hosting still has infrastructure and provider costs. No current subscription price is asserted here. [Open Source vs Cloud](https://docs.firecrawl.dev/contributing/open-source-or-cloud); [Self-hosted feature support](https://docs.firecrawl.dev/contributing/self-host#self-hosted-feature-support).

Nubble can follow the same broad operating model without copying Firecrawl's exact feature boundaries: provide a useful, runnable AGPL core and sell convenience, reliability, and service. Clearly document anything unavailable in the self-hosted edition.

## What AGPL changes—and what it does not

Section 13 specifically addresses modifying the covered program: a modified network-interactive version must prominently offer its remote users no-charge access to that version's Corresponding Source. Section 1 includes the source and relevant scripts needed to generate, install, run, and modify the covered work. Distribution also has source-and-notice conditions in sections 4–6. [GNU AGPLv3, sections 1, 4–6, and 13](https://www.gnu.org/licenses/agpl-3.0.en.html#section13).

This is not a blanket requirement to publish every independent application that calls an API. The scope of the covered or combined work matters; section 5 also distinguishes separate, independent aggregated works. Likewise, software licensing does not automatically license generated output or customer data. [GNU AGPLv3, sections 2 and 5](https://www.gnu.org/licenses/agpl-3.0.en.html#section5).

**Commercial self-hosting and compliant competing services remain possible.** AGPL is a reciprocity license, not an exclusive right to sell hosting. It cannot guarantee that nobody builds a legal competitor. Adding a noncommercial or no-competing-service condition would change this open-source strategy. [GNU AGPLv3, sections 2, 4, and 10](https://www.gnu.org/licenses/agpl-3.0.en.html#section10).

For Nubble's service, adopt a prominent source link tied to the deployed revision and retain the associated build/install instructions. This is a practical compliance design, not a statement that section 13 requires every unmodified deployment to produce new code. Keep operational credentials and customer content out of public release artifacts.

## Optional future commercial licenses

A separate proprietary commercial permission can be considered later for customers who need rights beyond AGPL. This is distinct from charging for AGPL-compliant hosting. GNU discusses selling such exceptions and explains that the relevant copyright holder must have the authority to grant them. [GNU: Selling Exceptions](https://www.gnu.org/philosophy/selling-exceptions.html).

Do not promise this option until ownership and inbound contribution rights are clear. Third-party AGPL contributions do not automatically become yours to relicense. A carefully drafted contributor agreement or appropriate copyright assignment can address needed permissions; a sign-off alone should not be assumed to do so. Preserve dependency licenses and review any planned proprietary combination and contract with counsel. Existing compliant AGPL grants are not revoked by offering another license later. These are future governance choices, not grounds to delay the open-source release.

## Suggested public wording

> Nubble's software is available under GNU AGPL version 3 only (`AGPL-3.0-only`). You may self-host and use it commercially under that license. A managed hosted service may be offered separately for a fee. The research paper and original figures are licensed under CC BY 4.0; identified third-party materials retain their own terms.

Apply this scope consistently in the README, package metadata, file notices, and contribution guidance. Keep code and paper license notices separate; use the standard license texts without adding custom restrictions.
