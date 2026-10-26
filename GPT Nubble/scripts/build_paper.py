#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Generate portable LaTeX, compile the manuscript, and package arXiv inputs.

Uses only the standard library. PDF compilation needs Tectonic or latexmk.
No submission is performed. --source-only works without a TeX installation.
"""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'paper/arxiv'
METADATA = ROOT / 'paper/submission/metadata.json'
FIGURES = ['nubble-framework.png', 'nubble-evidence-graph.png', 'nubble-verification-model.png', 'nubble-study-design.png']
TITLE = 'Beyond the Summary: Nubble and the So-What Layer'
SUBTITLE = 'Evidence-linked, context-dependent decision support under limited attention'


def escape(text):
    mapping = {'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}', '^': r'\textasciicircum{}', '→': r'$\rightarrow$', '≤': r'$\leq$', '≥': r'$\geq$', '–': '--', '—': '---', '’': "'", '“': '``', '”': "''"}
    return ''.join(mapping.get(ch, ch) for ch in text)


def inline(text):
    pattern = r'(\[@[^\]]+\]|\$[^$\n]+\$|`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\))'
    output = []
    for part in re.split(pattern, text):
        if part.startswith('[@'):
            keys = re.findall(r'@([A-Za-z0-9_]+)', part)
            output.append(r'\citep{' + ','.join(keys) + '}')
        elif part.startswith('$') and part.endswith('$'):
            output.append(part)
        elif part.startswith('`'):
            output.append(r'\texttt{' + escape(part[1:-1]) + '}')
        elif part.startswith('**'):
            output.append(r'\textbf{' + inline(part[2:-2]) + '}')
        elif part.startswith('['):
            match = re.fullmatch(r'\[([^\]]+)\]\(([^)]+)\)', part)
            output.append(r'\href{' + escape(match[2]) + '}{' + escape(match[1]) + '}')
        else:
            output.append(escape(part))
    return ''.join(output)


def validate_citations(body, known):
    cited = set(re.findall(r'@([A-Za-z0-9_]+)', body.split('<!-- GENERATED-REFERENCES -->')[0]))
    if cited - known:
        raise ValueError('Unknown citation keys: ' + ', '.join(sorted(cited - known)))
    return cited


def metadata_errors(metadata):
    errors = []
    authors = metadata.get('authors', [])
    if not authors:
        errors.append('Confirmed author names and affiliations are missing.')
    for author in authors:
        for field in ['name', 'affiliation']:
            value = author.get(field, '').strip()
            if not value or re.search(r'pending|placeholder|\btbd\b|\btodo\b', value, re.I):
                errors.append(f'Author {field} must be confirmed, not a placeholder.')
    if not metadata.get('title') or not metadata.get('abstract'):
        errors.append('Title and abstract are required.')
    if len(metadata.get('abstract', '')) > 1920:
        errors.append('Abstract exceeds the 1920-character arXiv limit.')
    if any(ord(ch) > 127 for ch in metadata.get('title', '') + metadata.get('abstract', '')):
        errors.append('Upload title and abstract must use ASCII/TeX-compatible metadata.')
    return errors


def allowed_source(name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts:
        return False
    return name in {'main.tex', 'main.bbl', 'references.bib'} or name in {'figures/' + f for f in FIGURES}


def render_body(markdown):
    lines = markdown.split('<!-- GENERATED-REFERENCES -->')[0].splitlines()
    output, i = [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            output.append('')
            i += 1
            continue
        if line.startswith('```math'):
            # Keep an introductory sentence with its display rather than
            # leaving it stranded at the bottom of the previous page.
            while output and not output[-1]:
                output.pop()
            i += 1
            block = []
            while i < len(lines) and not lines[i].startswith('```'):
                block.append(lines[i])
                i += 1
            output.append('\\[\n' + '\n'.join(block) + '\n\\]')
        elif line.startswith('::: proposition'):
            output.append(r'\begin{proposition}[' + escape(line[len('::: proposition'):].strip()) + ']')
        elif line == '::: proof':
            output.append(r'\begin{proof}')
        elif line == ':::':
            # Input fences are flat; find the preceding opening fence.
            previous = next(x.strip() for x in reversed(lines[:i]) if x.startswith('::: ') )
            output.append(r'\end{proof}' if previous == '::: proof' else r'\end{proposition}')
        elif line.startswith('!['):
            match = re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)', line)
            name = Path(match[2]).name
            if name not in FIGURES:
                raise ValueError('Unapproved scientific figure: ' + name)
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j >= len(lines) or not re.match(r'\*\*Figure \d+\.\*\* ', lines[j]):
                raise ValueError('Figure is missing its manuscript caption: ' + name)
            caption = re.sub(r'^\*\*Figure \d+\.\*\* ', '', lines[j])
            output.append('\\begin{figure}[!htbp]\n\\centering\n\\includegraphics[width=\\linewidth]{figures/' + name + '}\n\\caption{' + inline(caption) + '}\n\\label{fig:' + name.removesuffix('.png') + '}\n\\end{figure}')
            i = j
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [cell.strip() for cell in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\-\s]+', cell) for cell in cells):
                    rows.append(cells)
                i += 1
            count = len(rows[0])
            output.append('\\begin{center}\n\\small\n\\begin{tabularx}{\\linewidth}{@{}' + 'X'*count + '@{}}\n\\toprule')
            for n, row in enumerate(rows):
                output.append(' & '.join(inline(cell) for cell in row) + r' \\')
                if n == 0:
                    output.append(r'\midrule')
            output.append('\\bottomrule\n\\end{tabularx}\n\\end{center}')
            continue
        elif line.startswith('#'):
            match = re.match(r'(#+) (.*)', line)
            heading = re.sub(r'^\d+(?:\.\d+)*\.?(?:\s+)', '', match[2])
            if heading.startswith('Appendix A.'):
                output.append(r'\appendix')
            heading = re.sub(r'^Appendix [A-Z]\.\s*', '', heading)
            command = 'subsection' if len(match[1]) >= 3 else 'section'
            output.append('\\' + command + '{' + inline(heading) + '}')
        elif line.startswith('- '):
            output.append(r'\begin{itemize}')
            while i < len(lines) and lines[i].strip().startswith('- '):
                output.append(r'\item ' + inline(lines[i].strip()[2:]))
                i += 1
            output.append(r'\end{itemize}')
            continue
        else:
            output.append(inline(line))
        i += 1
    return '\n'.join(output)


def prepare_sources():
    markdown = (ROOT / 'paper/manuscript.md').read_text()
    title = markdown.splitlines()[0].removeprefix('# ')
    subtitle = markdown.splitlines()[2].removeprefix('## ')
    abstract = markdown.split('## Abstract\n\n', 1)[1].split('\n\n', 1)[0]
    metadata = json.loads(METADATA.read_text()) if METADATA.exists() else {'authors': [], 'corresponding_email': '', 'primary_category': 'cs.HC', 'cross_list': ['cs.CL'], 'author_review_complete': False, 'all_authors_consented': False}
    metadata.setdefault('venue_confirmed', False)
    metadata.update(title=title, subtitle=subtitle, abstract=abstract, version='0.3', date='2026-10-25', license='CC BY 4.0')
    METADATA.parent.mkdir(parents=True, exist_ok=True)
    METADATA.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    bib = (ROOT / 'paper/references.bib').read_text()
    known = set(re.findall(r'@\w+\{([^,]+),', bib))
    cited = validate_citations(markdown, known)
    errors = metadata_errors(metadata)
    author_text = r' \and '.join(
        escape(a.get('name') or 'Author name pending confirmation')
        + r'\\{\small ' + escape(a.get('affiliation') or 'Affiliation pending confirmation') + '}'
        for a in metadata['authors']
    ) or r'\textit{Author metadata pending confirmation}'
    email = metadata.get('corresponding_email', '').strip()
    if email:
        author_text += r'\\{\small\href{mailto:' + escape(email) + '}{' + escape(email) + '}}'
    draft_requirement = 'author metadata and author review required' if errors else 'author review required'
    draft = r'\par\smallskip{\small\textbf{Pre-submission draft: ' + draft_requirement + '.}}' if errors or not metadata.get('author_review_complete') else ''
    pdf_author = ', '.join(a.get('name', '') for a in metadata['authors'])
    body = markdown.split('## 1. Introduction', 1)[1]
    body = '## 1. Introduction' + body
    source = r'''% Generated from paper/manuscript.md by scripts/build_paper.py.
% Original research materials: CC BY 4.0. No submission has been performed.
\documentclass[11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=1in]{geometry}
\usepackage{amsmath,amssymb,amsthm}
\usepackage{graphicx,booktabs,tabularx}
\usepackage[round,authoryear]{natbib}
\usepackage[hidelinks]{hyperref}
\urlstyle{same}
\newtheorem{proposition}{Proposition}
\setlength{\emergencystretch}{2em}
\setlength{\parskip}{0.25em}
\renewcommand{\topfraction}{0.9}
\renewcommand{\bottomfraction}{0.9}
\renewcommand{\textfraction}{0.1}
\renewcommand{\floatpagefraction}{0.85}
\hypersetup{pdftitle={''' + escape(title) + r'''},pdfauthor={''' + escape(pdf_author) + r'''},pdfsubject={Methods manuscript, version 0.3}}
\title{''' + escape(title) + r'''\\[0.5em]{\large ''' + escape(subtitle) + '}' + draft + r'''}
\author{''' + author_text + r'''}
\date{October 25, 2026}
\begin{document}
\maketitle
\begin{abstract}
''' + inline(abstract) + r'''
\end{abstract}
\noindent\textbf{Keywords:} personalized summarization; decision support; evidence attribution; limited attention; human--AI interaction; selective recommendation.

''' + render_body(body) + r'''

\begingroup
\small
\setlength{\bibsep}{0.5em}
\bibliographystyle{plainnat}
\bibliography{references}
\endgroup
\end{document}
'''
    SOURCE.mkdir(parents=True, exist_ok=True)
    (SOURCE / 'main.tex').write_text(source)
    shutil.copyfile(ROOT / 'paper/references.bib', SOURCE / 'references.bib')
    (SOURCE / 'figures').mkdir(exist_ok=True)
    for name in FIGURES:
        shutil.copyfile(ROOT / 'figures' / name, SOURCE / 'figures' / name)
    # Metadata is outside the upload archive; no fabricated author or publication identifier.
    authors_field = '; '.join(a['name'] + ' (' + a['affiliation'] + ')' for a in metadata['authors'] if a.get('name'))
    fields = ['Title: ' + title, 'Authors: ' + (authors_field or '[REQUIRED: confirmed names in order]'), 'Corresponding email: ' + (email or '[not supplied]'), 'Primary category (author to confirm): ' + metadata['primary_category'], 'Suggested cross-list (author to confirm): ' + ', '.join(metadata['cross_list']), 'License: CC BY 4.0', '', 'Abstract:', abstract]
    (METADATA.parent / 'arxiv-metadata.txt').write_text('\n'.join(fields) + '\n')
    print(f'Prepared LaTeX: {len(cited)} cited primary sources; abstract {len(abstract)}/1920 characters.')
    return metadata


def compile_pdf(engine):
    build = ROOT / 'tmp/texbuild'
    build.mkdir(parents=True, exist_ok=True)
    executable = shutil.which(engine) or (str(Path(engine).resolve()) if Path(engine).is_file() else None)
    if not executable:
        raise SystemExit('Install Tectonic or latexmk; or use --source-only to generate portable LaTeX.')
    executable = str(Path(executable).resolve())
    if 'tectonic' in Path(executable).name:
        command = [executable, '--untrusted', '--keep-logs', '--keep-intermediates', '--outdir', str(build), 'main.tex']
    else:
        command = [executable, '-pdf', '-interaction=nonstopmode', '-halt-on-error', '-outdir=' + str(build), 'main.tex']
    with (build / 'compiler-output.txt').open('w') as log:
        result = subprocess.run(command, cwd=SOURCE, stdout=log, stderr=subprocess.STDOUT)
    if result.returncode:
        raise SystemExit('TeX compilation failed; inspect tmp/texbuild/compiler-output.txt')
    log_text = (build / 'main.log').read_text(errors='replace')
    for pattern in [r'Citation .* undefined', r'There were undefined references', r'Overfull \\hbox', r'Overfull \\vbox']:
        if re.search(pattern, log_text):
            raise SystemExit('TeX output needs repair: ' + pattern + '; inspect tmp/texbuild/main.log')
    target = ROOT / 'output/pdf/nubble-method-paper.pdf'
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(build / 'main.pdf', target)
    shutil.copyfile(build / 'main.bbl', SOURCE / 'main.bbl')
    print('Compiled PDF and matching pre-generated bibliography.')


def package_sources(metadata, final=False):
    blockers = metadata_errors(metadata)
    for field in ['author_review_complete', 'all_authors_consented']:
        if not metadata.get(field):
            blockers.append(field.replace('_', ' ') + ' has not been confirmed.')
    if not metadata.get('venue_confirmed'):
        blockers.append('The requested venue is assumed to be arXiv and needs confirmation.')
    if final and blockers:
        raise SystemExit('Final submission package blocked: ' + '; '.join(blockers))
    if not (SOURCE / 'main.bbl').is_file():
        raise SystemExit('Compile before packaging: matching main.bbl is required.')
    paths = sorted(p for p in SOURCE.rglob('*') if p.is_file() and allowed_source(p.relative_to(SOURCE).as_posix()))
    prefix = 'nubble-arxiv-v0.3' if not blockers else 'nubble-arxiv-draft-v0.3'
    archive = ROOT / 'dist' / (prefix + '.zip')
    archive.parent.mkdir(exist_ok=True)
    manifest = []
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in paths:
            name = path.relative_to(SOURCE).as_posix()
            data = path.read_bytes()
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 25, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            bundle.writestr(info, data)
            manifest.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert all(allowed_source(name) for name in bundle.namelist())
    report = {'version': '0.3', 'submission_ready': not blockers, 'blockers': blockers,
              'archive': archive.name, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
              'pdf_sha256': hashlib.sha256((ROOT / 'output/pdf/nubble-method-paper.pdf').read_bytes()).hexdigest(),
              'files': manifest}
    (METADATA.parent / 'package-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Packaged {len(paths)} manuscript inputs as {archive.name}. Submission ready: {not blockers}.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine', default='tectonic', help='Tectonic executable or latexmk')
    parser.add_argument('--source-only', action='store_true')
    parser.add_argument('--package', action='store_true')
    parser.add_argument('--final', action='store_true', help='Fail unless author/venue/review fields are confirmed')
    args = parser.parse_args()
    metadata = prepare_sources()
    if not args.source_only:
        compile_pdf(args.engine)
    if args.package or args.final:
        if args.source_only:
            parser.error('Compile matching sources before packaging; omit --source-only.')
        package_sources(metadata, final=args.final)


if __name__ == '__main__':
    main()
