# Contributing to Nubble Method

Useful contributions make the method easier to inspect, reproduce, or disprove. Start with a missed caveat, an unsupported implication, a profile-swap failure, a case where the correct outcome is to maintain or abstain, or an independently reproduced artifact.

## Submit a case

Provide a rights-cleared or self-authored source, its available scope and stable spans, an explicit reader context/decision/constraints, the proposed output, and an explanation of the failure. Label synthetic cases. Do not include private strategy, personal data, credentials, copyrighted article copies without permission, or private dashboard exports. A URL is not itself redistribution permission.

## Submit a change

Keep the claim proportional to its evidence. Distinguish proposed features from implemented behavior; report failed runs. Run `python3 scripts/validate_release.py` and `python3 -m unittest discover -s tests -v`. If editing figures, regenerate with `python3 scripts/make_figures.py` and inspect the PNGs. Changes to the paper require a fresh PDF build and visual inspection before release.

Use the existing file responsibilities: manuscript in `paper/`, method contract in `METHOD.md`, study protocol in `evaluation/`, cited metadata in `research/`, and hand-authored examples in `examples/`. Do not add DOI, author, benchmark, or performance claims that have not been verified.

## Research corrections

Include the canonical paper URL, version, relevant section, and what the existing text gets wrong. Partial reads must remain labeled. Versions of one study are not independent corroboration. Methodological disagreement is welcome; the project has no controlled effectiveness result to defend.

## Inbound rights

Contribute software under AGPL-3.0-only and original research text/assets under CC BY 4.0, consistent with [LICENSE.md](LICENSE.md). Confirm that you have the right to submit the material and identify third-party terms. Contributions do not assign copyright or grant special proprietary relicensing rights. A future dual-license program would need an explicit, separately reviewed governance arrangement.

Discuss evidence and behavior respectfully. Avoid attacks on authors, contributors, or users. Report security-sensitive information privately through the route described in [SECURITY.md](SECURITY.md).
