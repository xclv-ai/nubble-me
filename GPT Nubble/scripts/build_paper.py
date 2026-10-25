#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Build the Nubble working methods paper from its Markdown source.

The original manuscript, captions and diagrams are CC BY 4.0. The renderer is
AGPL-3.0-only. No author identity, study result or bibliography is synthesized.

Requirements: Python 3.10+, ReportLab, Pillow and pypdf. No network is used.
Run from any directory, using the Codex bundled Python if needed::

    /path/to/python3 scripts/build_paper.py

The default input is paper/manuscript.md; the default output is
output/pdf/nubble-method-paper.pdf. Figures resolve relative to the Markdown
file. Use --font-dir to select a directory containing Noto Serif/Sans TTFs.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab import rl_config
import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
RUNTIME = Path.home() / ".cache/codex-runtimes/codex-primary-runtime"
BUNDLED_FONTS = RUNTIME / (
    "dependencies/native/libreoffice-headless/libreoffice/"
    "LibreOfficeDev.app/Contents/Resources/fonts/truetype"
)
INK = colors.HexColor("#24312F")
TEAL = colors.HexColor("#185D58")
MUTED = colors.HexColor("#5D6B67")
LINE = colors.HexColor("#CBD5D0")
PALE = colors.HexColor("#F0F5F1")
PAGE_W, PAGE_H = A4
LEFT = RIGHT = 47
TOP = 47
BOTTOM = 49
TEXT_W = PAGE_W - LEFT - RIGHT


def normalize(text: str) -> str:
    """Use ordinary hyphens and avoid platform-specific nonbreaking spaces."""
    return text.translate(str.maketrans({
        "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-",
        "\u2014": " - ", "\u2212": "-", "\u00a0": " ", "\u202f": " ",
    }))


def register_fonts(font_dir: Path | None) -> None:
    """Embed portable open fonts; the native fallback is also Unicode capable."""
    candidates = [font_dir] if font_dir else []
    candidates += [BUNDLED_FONTS, Path("/usr/share/fonts/truetype/noto")]
    chosen = next((p for p in candidates if p and (p / "NotoSerif-Regular.ttf").is_file()), None)
    if chosen:
        families = {
            "PaperSerif": ("NotoSerif", ["Regular", "Bold", "Italic", "BoldItalic"]),
            "PaperSans": ("NotoSans", ["Regular", "Bold", "Italic", "BoldItalic"]),
        }
        for family, (stem, variants) in families.items():
            names = [family, family + "-Bold", family + "-Italic", family + "-BoldItalic"]
            for name, variant in zip(names, variants):
                file = chosen / f"{stem}-{variant}.ttf"
                if not file.is_file():
                    raise FileNotFoundError(f"Font family incomplete: {file}")
                pdfmetrics.registerFont(TTFont(name, str(file)))
            pdfmetrics.registerFontFamily(family, normal=names[0], bold=names[1], italic=names[2], boldItalic=names[3])
        mono = chosen / "DejaVuSansMono.ttf"
        if not mono.is_file():
            mono = chosen / "LiberationMono-Regular.ttf"
    else:
        native = Path(reportlab.__file__).resolve().parent / "fonts"
        variants = {"": "Vera.ttf", "-Bold": "VeraBd.ttf", "-Italic": "VeraIt.ttf", "-BoldItalic": "VeraBI.ttf"}
        for family in ("PaperSerif", "PaperSans"):
            for suffix, filename in variants.items():
                pdfmetrics.registerFont(TTFont(family + suffix, str(native / filename)))
        for family in ("PaperSerif", "PaperSans"):
            pdfmetrics.registerFontFamily(family, normal=family, bold=family + "-Bold", italic=family + "-Italic", boldItalic=family + "-BoldItalic")
        mono = native / "Vera.ttf"
    if not mono.is_file():
        mono = Path(reportlab.__file__).resolve().parent / "fonts/Vera.ttf"
    pdfmetrics.registerFont(TTFont("PaperMono", str(mono)))


TOKEN = re.compile(
    r"(?P<code>`[^`]+`)|(?P<link>\[(?P<label>[^\]]+)\]\((?P<url>[^\s]+?)\))"
    r"|(?P<strong>\*\*(?P<strongtext>.+?)\*\*)|(?P<em>\*(?P<emtext>[^*]+)\*)"
)


def inline(text: str, *, links: bool = True) -> str:
    """Convert the supported inline Markdown subset to safe Paragraph markup."""
    text = normalize(text)
    output: list[str] = []
    pos = 0
    for match in TOKEN.finditer(text):
        output.append(html.escape(text[pos:match.start()]))
        if match.group("code"):
            output.append('<font name="PaperMono" size="9">' + html.escape(match.group()[1:-1]) + "</font>")
        elif match.group("link"):
            label = inline(match.group("label"), links=False)
            url = match.group("url")
            if links and re.match(r"^(https?://|mailto:)", url):
                output.append(f'<a href="{html.escape(url, quote=True)}" color="#185D58">{label}</a>')
            else:
                output.append(label)
        elif match.group("strong"):
            output.append("<b>" + inline(match.group("strongtext"), links=links) + "</b>")
        else:
            output.append("<i>" + inline(match.group("emtext"), links=links) + "</i>")
        pos = match.end()
    output.append(html.escape(text[pos:]))
    return "".join(output)


def styles() -> dict[str, ParagraphStyle]:
    sheet = getSampleStyleSheet()
    common = dict(textColor=INK, alignment=TA_LEFT, allowWidows=0, allowOrphans=0,
                  splitLongWords=True, uriWasteReduce=0.1)
    base = ParagraphStyle("PaperBody", fontName="PaperSerif", fontSize=10.65,
                          leading=15, spaceAfter=7.1, **common)
    s = {"body": base}
    s["title"] = ParagraphStyle("PaperTitle", parent=base, fontName="PaperSans-Bold",
        fontSize=23.6, leading=28.8, textColor=TEAL, spaceAfter=10, keepWithNext=True)
    s["subtitle"] = ParagraphStyle("PaperSubtitle", parent=base, fontName="PaperSans",
        fontSize=13.1, leading=18, textColor=MUTED, spaceAfter=14, keepWithNext=True)
    s["meta"] = ParagraphStyle("PaperMeta", parent=base, fontName="PaperSans",
        fontSize=8.7, leading=12.3, textColor=MUTED, spaceAfter=9, keepWithNext=True)
    s["status"] = ParagraphStyle("PaperStatus", parent=base, fontName="PaperSans",
        fontSize=9.1, leading=13.1, textColor=INK, spaceAfter=0)
    s["h2"] = ParagraphStyle("PaperH2", parent=base, fontName="PaperSans-Bold",
        fontSize=13.4, leading=18, textColor=TEAL, spaceBefore=13, spaceAfter=7.5, keepWithNext=True)
    s["h3"] = ParagraphStyle("PaperH3", parent=base, fontName="PaperSans-Bold",
        fontSize=11.1, leading=15, textColor=INK, spaceBefore=9.5, spaceAfter=5.5, keepWithNext=True)
    s["h4"] = ParagraphStyle("PaperH4", parent=s["h3"], fontSize=10.5, spaceBefore=7)
    s["abstract"] = ParagraphStyle("PaperAbstract", parent=base, fontSize=10.2,
        leading=14.2, textColor=INK)
    s["caption"] = ParagraphStyle("PaperCaption", parent=base, fontName="PaperSans",
        fontSize=8.6, leading=11.7, textColor=MUTED, spaceAfter=10)
    s["cell"] = ParagraphStyle("PaperCell", parent=base, fontName="PaperSans",
        fontSize=9, leading=12, spaceAfter=0, allowWidows=1, allowOrphans=1)
    s["cellhead"] = ParagraphStyle("PaperCellHead", parent=s["cell"], fontName="PaperSans-Bold", textColor=TEAL)
    s["bullet"] = ParagraphStyle("PaperBullet", parent=base, leftIndent=13,
        firstLineIndent=0, bulletIndent=0, spaceAfter=5.2)
    s["quote"] = ParagraphStyle("PaperQuote", parent=base, leftIndent=14,
        borderColor=LINE, borderWidth=0, textColor=MUTED, fontName="PaperSerif-Italic")
    s["reference"] = ParagraphStyle("PaperReference", parent=base, fontSize=9.15,
        leading=12.8, spaceAfter=7, leftIndent=16, firstLineIndent=-16)
    s["code"] = ParagraphStyle("PaperCode", fontName="PaperMono", fontSize=8.6,
        leading=12.2, textColor=INK, backColor=PALE, borderPadding=11,
        spaceBefore=4, spaceAfter=12)
    return s


class Rule(Flowable):
    def __init__(self, width: float):
        super().__init__()
        self.width, self.height = width, 8

    def draw(self) -> None:
        self.canv.setStrokeColor(LINE)
        self.canv.setLineWidth(0.7)
        self.canv.line(0, 4, self.width, 4)


class PaperDoc(BaseDocTemplate):
    def __init__(self, path: Path, title: str):
        super().__init__(str(path), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT,
            topMargin=TOP, bottomMargin=BOTTOM, title=title, author="",
            subject="Proposed Nubble methods framework; no controlled effectiveness results",
            creator="Nubble reproducible methods-paper renderer", pageCompression=1)
        frame = Frame(LEFT, BOTTOM, TEXT_W, PAGE_H - TOP - BOTTOM,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="paper", frames=frame))
        self.heading_count = 0

    def afterFlowable(self, flowable: Flowable) -> None:
        if isinstance(flowable, Paragraph) and flowable.style.name in {"PaperH2", "PaperH3"}:
            text = flowable.getPlainText()
            key = f"heading-{self.heading_count}"
            self.heading_count += 1
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0 if flowable.style.name == "PaperH2" else 1, closed=False)


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        super().__init__(*args, **kwargs)
        self._page_states: list[dict] = []

    def showPage(self) -> None:
        self._page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        count = len(self._page_states)
        for state in self._page_states:
            self.__dict__.update(state)
            self.draw_footer(count)
            super().showPage()
        super().save()

    def draw_footer(self, count: int) -> None:
        self.saveState()
        self.setStrokeColor(LINE)
        self.setLineWidth(0.55)
        self.line(LEFT, 35, PAGE_W - RIGHT, 35)
        self.setFillColor(MUTED)
        self.setFont("PaperSans", 7.15)
        self.drawString(LEFT, 23, "NUBBLE METHOD  /  PROPOSED FRAMEWORK  /  CC BY 4.0")
        self.drawRightString(PAGE_W - RIGHT, 23, f"{self._pageNumber} / {count}")
        self.restoreState()


def is_table_separator(line: str) -> bool:
    return bool(re.match(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$", line))


def table_cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def make_table(lines: list[str], s: dict) -> Table:
    raw = [table_cells(line) for line in lines if not is_table_separator(line)]
    ncols = len(raw[0])
    if any(len(row) != ncols for row in raw):
        raise ValueError("Inconsistent Markdown table column count")
    if ncols == 2:
        first = max(len(re.sub(r"\*|`", "", row[0])) for row in raw)
        ratio = 0.22 if first <= 18 else 0.31
        widths = [TEXT_W * ratio, TEXT_W * (1 - ratio)]
    elif ncols == 3:
        widths = [TEXT_W * 0.265, TEXT_W * 0.325, TEXT_W * 0.410]
    else:
        widths = [TEXT_W / ncols] * ncols
    rows = [[Paragraph(inline(cell), s["cellhead"] if i == 0 else s["cell"])
             for cell in row] for i, row in enumerate(raw)]
    table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1,
                  spaceBefore=5, spaceAfter=12)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("LINEABOVE", (0, 0), (-1, 0), 0.7, TEAL),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, LINE),
        ("LINEBELOW", (0, 1), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def build_story(source: Path, s: dict) -> tuple[list[Flowable], dict]:
    lines = source.read_text(encoding="utf-8").splitlines()
    story: list[Flowable] = []
    counts = {"paragraphs": 0, "tables": 0, "figures": 0, "equations": 0}
    i, has_title, abstract, references = 0, False, False, False
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("<!--"):
            while "-->" not in lines[i]:
                i += 1
                if i >= len(lines):
                    raise ValueError("Unclosed Markdown HTML comment")
            i += 1
            continue
        if line.startswith("```"):
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(normalize(lines[i]))
                i += 1
            if i == len(lines):
                raise ValueError("Unclosed Markdown code fence")
            block = "\n".join(code)
            longest = max((pdfmetrics.stringWidth(x, "PaperMono", 8.6) for x in code), default=0)
            style = ParagraphStyle("Equation", parent=s["code"], fontSize=min(8.6, 8.6 * (TEXT_W - 28) / max(longest, 1)))
            if style.fontSize < 7.5:
                raise ValueError("Code/equation too long for a legible line; wrap the Markdown source")
            story.append(KeepTogether([Preformatted(block, style)]))
            counts["equations"] += 1
            i += 1
            continue
        image = re.match(r"!\[(.*?)\]\((.+?)\)\s*$", line)
        if image:
            path = (source.parent / image.group(2)).resolve()
            if not path.is_file():
                raise FileNotFoundError(f"Figure missing: {path}")
            with PILImage.open(path) as bitmap:
                w, h = bitmap.size
            width = TEXT_W
            height = width * h / w
            if height > 350:
                height, width = 350, 350 * w / h
            figure = Image(str(path), width=width, height=height)
            figure.hAlign = "CENTER"
            group: list[Flowable] = [Spacer(1, 4), figure, Spacer(1, 6)]
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and re.match(r"\*\*Figure\s+\d+[.:]", lines[j].strip()):
                group.append(Paragraph(inline(lines[j].strip()), s["caption"]))
                i = j
            else:
                group.append(Paragraph(inline(image.group(1)), s["caption"]))
            story.append(KeepTogether(group))
            counts["figures"] += 1
            i += 1
            continue
        if "|" in line and i + 1 < len(lines) and is_table_separator(lines[i + 1]):
            table_lines = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and "|" in lines[i]:
                table_lines.append(lines[i].strip())
                i += 1
            story.append(make_table(table_lines, s))
            counts["tables"] += 1
            continue
        heading = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading:
            level, text = len(heading.group(1)), heading.group(2)
            if level == 1 and not has_title:
                story.append(Paragraph(inline(text), s["title"]))
                has_title = True
            elif level == 2 and not any(isinstance(x, Paragraph) and x.style.name == "PaperMeta" for x in story) and len(story) <= 2:
                story.append(Paragraph(inline(text), s["subtitle"]))
            else:
                abstract = text.lower() == "abstract"
                references = text.lower().startswith("references")
                story.append(Paragraph(inline(text), s.get(f"h{level}", s["h3"])))
            i += 1
            continue
        if line.startswith("**Working methods paper"):
            story.append(Paragraph(inline(line), s["meta"]))
            i += 1
            continue
        if line.startswith("**Status:"):
            box = Table([[Paragraph(inline(line), s["status"])]], colWidths=[TEXT_W], spaceAfter=12)
            box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]))
            story.append(box)
            i += 1
            continue
        if re.match(r"^[-*_]{3,}$", line):
            story.append(Rule(TEXT_W))
            i += 1
            continue
        bullet = re.match(r"^(?:[-*]\s+|(?P<number>\d+)\.\s+)(.+)$", line)
        if bullet:
            text = bullet.group(2)
            i += 1
            while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                text += " " + lines[i].strip()
                i += 1
            label = bullet.group("number") + "." if bullet.group("number") else "•"
            story.append(Paragraph(inline(text), s["reference"] if references else s["bullet"], bulletText=label))
            counts["paragraphs"] += 1
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip():
            if re.match(r"^(#{1,4}\s|```|!\[|[-*]\s|\d+\.\s|>)", lines[i].strip()):
                break
            if "|" in lines[i] and i + 1 < len(lines) and is_table_separator(lines[i + 1]):
                break
            paragraph.append(lines[i].strip())
            i += 1
        text = " ".join(paragraph)
        if text.startswith(">"):
            style = s["quote"]
            text = re.sub(r"^>\s*", "", text)
        elif references:
            style = s["reference"]
        elif text.startswith("**Keywords:"):
            style = s["meta"]
        else:
            style = s["abstract"] if abstract else s["body"]
        story.append(Paragraph(inline(text), style))
        counts["paragraphs"] += 1
    if counts["figures"] != 3:
        raise ValueError(f"Expected the three manuscript figures; found {counts['figures']}")
    return story, counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "paper/manuscript.md")
    parser.add_argument("--output", type=Path, default=ROOT / "output/pdf/nubble-method-paper.pdf")
    parser.add_argument("--font-dir", type=Path, default=None)
    args = parser.parse_args()
    source, destination = args.input.resolve(), args.output.resolve()
    register_fonts(args.font_dir)
    rl_config.warnOnMissingFontGlyphs = 1
    story, counts = build_story(source, styles())
    destination.parent.mkdir(parents=True, exist_ok=True)
    title = next((line[2:].strip() for line in source.read_text().splitlines() if line.startswith("# ")), "Nubble working methods paper")
    doc = PaperDoc(destination, normalize(title))
    doc.build(story, canvasmaker=NumberedCanvas)
    reader = PdfReader(destination)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if not text.strip() or "No controlled Nubble effectiveness study is reported" not in " ".join(text.split()):
        raise RuntimeError("PDF text/proposal-status verification failed")
    links = sum(len(page.get("/Annots", [])) for page in reader.pages)
    print(json.dumps({"output": str(destination), "pages": len(reader.pages),
        "bytes": destination.stat().st_size, "link_annotations": links, **counts}, indent=2))


if __name__ == "__main__":
    main()
