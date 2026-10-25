# Submission preparation: Nubble v0.3

**Target assumed: arXiv. Status: compiled author-review draft; not ready to submit until author and venue details are confirmed.** “avox” was interpreted as arXiv; this assumption still needs the author's confirmation. No upload or submission has been performed.

The scientific manuscript is [manuscript.md](manuscript.md), built as a [PDF](../output/pdf/nubble-method-paper.pdf). The portable [LaTeX project](arxiv/main.tex) uses standard article, math, graphics, table, citation, and hyperlink packages. It has compiled both with Tectonic 0.17.0 and the desktop editor's compiler. The [draft upload archive](../dist/nubble-arxiv-draft-v0.3.zip) contains exactly seven inputs at its root: `main.tex`, `references.bib`, `main.bbl`, and four PNG figures in `figures/`. The pre-generated bibliography matches the manuscript. No build logs, generated PDF, promotional graphics, private notes, or Git history are included.

## What the paper establishes

The paper defines an inspectable Full / Short / So what? contract, proves two elementary decision-theoretic properties, calculates a declared hypothetical verification model, and audits metadata in 50 archived prototype records. It does not report a completed human or LLM comparison. Its future evaluation design is labeled as prospective. Source assertions, interpretation, decision validity, and observed outcomes are separate constructs.

The contribution should be presented as a methods manuscript with explicit analytical and descriptive results. arXiv can decline research proposals or work it considers insufficiently substantive; adding formal sections does not guarantee acceptance. Review the [moderation policy](https://info.arxiv.org/help/moderation/index.html) before submission. The paper's two propositions are deliberately described as elementary properties, not a claim to new general decision theory.

## Details the authors must supply

Edit [submission/metadata.json](submission/metadata.json). Provide real author names in the intended order, exact affiliations (or Independent Researcher where accurate), a corresponding email if it is to be printed, and optional ORCIDs. Do not infer these from account names or Git configuration. Confirm the intended venue and category; `cs.HC` is a suggested primary category and `cs.CL` a possible cross-list, subject to the authors' judgment and arXiv moderation.

Each author record has the form:

```json
{"name": "Confirmed full name", "affiliation": "Confirmed affiliation"}
```

The current empty author list is intentional. It prevents a misleading anonymous or fabricated submission. Once the authors have reviewed the complete text, references, calculations, figure captions, AI disclosure, funding/conflict disclosures, and rights, set `author_review_complete` and `all_authors_consented` to true. Set `venue_confirmed` to true only after confirming arXiv. These fields record real confirmations; the build does not supply them.

## Rebuild and verify

From the research folder, using Python 3.10+, Matplotlib for plot generation, and a separately installed [Tectonic](https://tectonic-typesetting.github.io/book/latest/installation/) or latexmk:

```sh
python3 scripts/build_bibliography.py
python3 scripts/analyze_paper.py
python3 scripts/make_figures.py
python3 scripts/build_paper.py --engine tectonic --package
python3 -m unittest discover -s tests -v
python3 scripts/validate_release.py
```

The analytical outputs and plot can be regenerated without network access or a model key. To reproduce the historical metadata audit from a checkout of the parent repository, add `--audit-repo ..` to the analysis command. The [audit manifest](analysis/metadata_audit.json) pins the exact input revision and hashes. It publishes counts and metadata, not article bodies.

The source generator preserves existing author fields in the JSON metadata, refreshes the abstract and title from the manuscript, and copies only the four referenced scientific figures. `--engine /path/to/tectonic` accepts an explicit compiler path; `--engine latexmk` uses pdfLaTeX. `--source-only` generates sources without compiling. The compiler rejects unresolved citations and overfull boxes. Render and inspect all PDF pages after substantive changes.

After genuine author/venue confirmations, use:

```sh
python3 scripts/build_paper.py --engine tectonic --final
```

This command refuses a final package while required metadata or confirmations are absent. A successful final build produces `dist/nubble-arxiv-v0.3.zip`. The current draft file remains clearly named as a draft. The [package report](submission/package-report.json) records blockers and SHA-256 hashes for the archive, PDF, and every source input.

## Upload guidance for the submitting author

arXiv requires the actual TeX source when a paper was written in TeX. Upload the generated source ZIP, select `main.tex`, compile in arXiv, and inspect that preview. Do not upload the research-toolkit ZIP as the manuscript. The project uses relative figure paths and ASCII filenames, has a fixed date, and requires no shell escape, custom class, or SVG conversion. See [submission instructions](https://info.arxiv.org/help/submit/index.html) and [TeX preparation](https://info.arxiv.org/help/submit_tex.html).

Copy the title, confirmed author list, and plain-text abstract from [arxiv-metadata.txt](submission/arxiv-metadata.txt). The abstract is 1,323 characters, below arXiv's 1,920-character limit. There is no invented journal reference, DOI, or peer-review status. The submitting author may need account endorsement and must resolve any moderation questions. See [metadata instructions](https://info.arxiv.org/help/prep.html).

The original manuscript and figures are released under CC BY 4.0, one of arXiv's supported licenses. Confirm authority to grant that license; an arXiv grant is irrevocable. Third-party cited works keep their own rights. See [arXiv licenses](https://info.arxiv.org/help/license/index.html) and the repository's [license scope](../LICENSE.md). The manuscript discloses substantial generative-AI assistance; AI is not an author and named authors retain responsibility, consistent with the [moderation policy](https://info.arxiv.org/help/moderation/index.html).
