"""Erzeugt die Handreichung als PDF im bildungssprit-Design aus Markdown.

Aufruf:
    python handreichung.py             # PDF im Projektordner
    python handreichung.py --ablegen   # zusätzlich ins Zielverzeichnis aus bau.json kopieren und prüfen

Liest bau.json (titel, lizenz, ziel, handreichung.md/pdf/bild) und die Baukennung
aus dem Vorlagensatz. Gestaltung nach D:/codebase/marke/bildungssprit/ci-moodle-und-druck.md,
Abschnitt „Druck und PDF“: Navy für Überschriften und Tabellenkopf, Pink für Linien,
Hinweise als hellgelbe Box, Lizenzzeile auf jeder Seite, Fußbanner auf der letzten Seite.

Markdown: # Titel, Untertitel als erste Zeile in **…**, ## und ###, Absätze, - und 1.,
Tabellen, > Hinweis, **fett**, *kursiv*, [Text](URL), ![Unterschrift](bild.png)
(aufeinanderfolgende Bilder stehen nebeneinander), <!-- umbruch --> für einen Seitenumbruch.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle, Flowable,
)

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from bau import BauFehler, current_build, load_config  # noqa: E402

NAVY = HexColor("#031627")
DUNKELBLAU = HexColor("#072E3D")
TEAL = HexColor("#019798")
TEAL_TEXT = HexColor("#017A7B")
PINK = HexColor("#FF4080")
BEERE = HexColor("#C2185B")
CYAN = HexColor("#08E0CF")
GOLD = HexColor("#F6C83B")
SCHIEFER = HexColor("#4A5D73")
HINWEIS_BG = HexColor("#FFF8E1")
HINWEIS_TEXT = HexColor("#555555")
RASTER = HexColor("#CCCCCC")
WECHSEL = HexColor("#F5F5F5")
GRAU_LIZENZ = HexColor("#999999")
HELL = HexColor("#F9F9F9")

LOGO_URL = "https://img.bildungssprit.de/dbimg/bildungssprit_logo.png"
DEFAULT_URL = "https://img.bildungssprit.de/dbimg/default.png"
LINKTREE = "https://linktr.ee/bildungssprit"
CACHE = Path(tempfile.gettempdir()) / "bs_handreichung"

PAGE_W, PAGE_H = A4
MARGIN_X = 20 * mm
MARGIN_TOP = 15 * mm
MARGIN_BOTTOM = 15 * mm
HEADER_H = 14 * mm
FOOTER_H = 9 * mm
TEXT_W = PAGE_W - 2 * MARGIN_X


def register_fonts() -> tuple[str, str, str]:
    fonts = Path("C:/Windows/Fonts")
    files = {"Roboto": "Roboto-Regular.ttf", "Roboto-Bold": "Roboto-Bold.ttf",
             "Roboto-Italic": "Roboto-Italic.ttf", "Roboto-BoldItalic": "Roboto-BoldItalic.ttf"}
    if all((fonts / f).exists() for f in files.values()):
        for name, f in files.items():
            pdfmetrics.registerFont(TTFont(name, str(fonts / f)))
        pdfmetrics.registerFontFamily("Roboto", normal="Roboto", bold="Roboto-Bold",
                                      italic="Roboto-Italic", boldItalic="Roboto-BoldItalic")
        return "Roboto", "Roboto-Bold", "Roboto-Italic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


REG, BOLD, ITAL = register_fonts()


def cached_image(url: str, size: int = 240) -> Path | None:
    """Lädt ein Bild einmal und legt eine kleine Fassung ab, damit das PDF schlank bleibt."""
    CACHE.mkdir(exist_ok=True)
    name = url.rsplit("/", 1)[-1]
    original, small = CACHE / name, CACHE / f"{Path(name).stem}_{size}.png"
    if small.exists():
        return small
    try:
        if not original.exists() or original.stat().st_size < 100:
            urllib.request.urlretrieve(url, original)
        with PILImage.open(original) as im:
            im.thumbnail((size, size))
            im.save(small)
    except OSError as err:
        print(f"Hinweis: Bild nicht geladen ({url}): {err}")
        return None
    return small


def styles() -> dict[str, ParagraphStyle]:
    base = dict(fontName=REG, fontSize=9.5, leading=13.8, textColor=NAVY)
    return {
        "Body": ParagraphStyle("Body", **base, spaceAfter=2 * mm),
        "Bullet": ParagraphStyle("Bullet", **base, spaceAfter=1.2 * mm, leftIndent=6 * mm, bulletIndent=1.5 * mm),
        "H2": ParagraphStyle("H2", fontName=BOLD, fontSize=13, leading=16, textColor=NAVY,
                             spaceBefore=5 * mm, spaceAfter=2.2 * mm, keepWithNext=1),
        "H3": ParagraphStyle("H3", fontName=BOLD, fontSize=10.5, leading=13.5, textColor=TEAL_TEXT,
                             spaceBefore=3.2 * mm, spaceAfter=1.4 * mm, keepWithNext=1),
        "Hint": ParagraphStyle("Hint", fontName=ITAL, fontSize=9, leading=12.5, textColor=HINWEIS_TEXT),
        "Cell": ParagraphStyle("Cell", **{**base, "fontSize": 8.8, "leading": 11.6}),
        "CellHead": ParagraphStyle("CellHead", fontName=BOLD, fontSize=8.8, leading=11.6, textColor=white),
        "Caption": ParagraphStyle("Caption", fontName=ITAL, fontSize=8, leading=10.5, textColor=SCHIEFER,
                                  alignment=TA_CENTER, spaceBefore=1 * mm),
    }


def inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#C2185B"><u>\1</u></link>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"<i>\1</i>", text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.5">\1</font>', text)
    return text


class TitleBanner(Flowable):
    """Kopf wie das Banner der Datenbank: Verlauf Navy, Dunkelblau, Teal, darunter die Akzentlinie."""

    def __init__(self, title: str, subtitle: str, meta: str, image: Path | None):
        super().__init__()
        self.title, self.subtitle, self.meta, self.image = title, subtitle, meta, image
        self.height = 30 * mm

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height + 3 * mm

    def draw(self):
        c, w, h = self.canv, self.width, self.height
        y0 = 3 * mm
        c.saveState()
        banner = c.beginPath()
        banner.roundRect(0, y0, w, h, 1.4 * mm)
        c.clipPath(banner, stroke=0, fill=0)
        c.linearGradient(0, y0 + h, w, y0, (NAVY, DUNKELBLAU, TEAL), positions=(0, 0.6, 1), extend=False)
        c.restoreState()
        # Akzentlinie direkt unter dem Banner: Cyan, Gold, Pink.
        c.saveState()
        line = c.beginPath()
        line.rect(0, y0 - 1 * mm, w, 1 * mm)
        c.clipPath(line, stroke=0, fill=0)
        c.linearGradient(0, y0, w, y0, (CYAN, GOLD, PINK), extend=False)
        c.restoreState()
        x = 7 * mm
        if self.image:
            size = 24 * mm
            c.drawImage(ImageReader(str(self.image)), w - size - 4 * mm, 3 * mm + (h - size) / 2,
                        size, size, mask="auto")
        c.setFillColor(white)
        c.setFont(BOLD, 21)
        c.drawString(x, 3 * mm + h - 11.5 * mm, self.title)
        c.setFont(REG, 10.5)
        c.drawString(x, 3 * mm + h - 18 * mm, self.subtitle)
        c.setFillColor(HexColor("#BFE9EC"))
        c.setFont(REG, 8.5)
        c.drawString(x, 3 * mm + 6 * mm, self.meta)


class HintBox(Flowable):
    def __init__(self, para: Paragraph):
        super().__init__()
        self.para = para

    def wrap(self, aw, ah):
        self.width = aw
        _, ph = self.para.wrap(aw - 10 * mm, ah)
        self.height = ph + 5 * mm
        return aw, self.height + 2.5 * mm

    def draw(self):
        c = self.canv
        c.setFillColor(HINWEIS_BG)
        c.roundRect(0, 2.5 * mm, self.width, self.height, 1.4 * mm, stroke=0, fill=1)
        c.setFillColor(GOLD)
        c.rect(0, 2.5 * mm, 1.2 * mm, self.height, stroke=0, fill=1)
        self.para.drawOn(c, 5.5 * mm, 2.5 * mm + 2.5 * mm)


class FooterBanner(Flowable):
    """Fußbanner wie in den Ansichten: Bildmarke, Titel mit Build, Lizenz, Logo, Rahmen in Pink."""

    def __init__(self, title: str, build: str, lizenz: str, default_img: Path | None, logo: Path | None):
        super().__init__()
        self.title, self.build, self.lizenz = title, build, lizenz
        self.default_img, self.logo = default_img, logo
        self.height = 14 * mm

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height + 4 * mm

    def draw(self):
        c, w, h = self.canv, self.width, self.height
        y = 0
        c.setFillColor(HELL)
        c.setStrokeColor(PINK)
        c.setLineWidth(0.8)
        c.roundRect(0, y, w, h, 1.4 * mm, stroke=1, fill=1)
        if self.default_img:
            c.drawImage(ImageReader(str(self.default_img)), 4 * mm, y + 2.5 * mm, 9 * mm, 9 * mm, mask="auto")
        c.setFillColor(NAVY)
        c.setFont(BOLD, 9)
        c.drawCentredString(w / 2, y + 7.8 * mm, self.title)
        c.setFillColor(SCHIEFER)
        c.setFont("Courier", 8)
        c.drawCentredString(w / 2, y + 3.6 * mm, f"Build {self.build}")
        if self.logo:
            c.drawImage(ImageReader(str(self.logo)), w - 11 * mm, y + 3 * mm, 8 * mm, 8 * mm, mask="auto")
        c.setFont(BOLD, 8.5)
        c.setFillColor(BEERE)
        text = f"{self.lizenz} bildungssprit"
        tw = c.stringWidth(text, BOLD, 8.5)
        c.drawString(w - 14 * mm - tw, y + 5.8 * mm, text)
        c.linkURL(LINKTREE, (w - 14 * mm - tw, y + 4 * mm, w - 14 * mm, y + 9 * mm), relative=1)


def image_row(items: list[tuple[str, str]], st) -> Table:
    n = len(items)
    gap = 5 * mm
    col_w = (TEXT_W - gap * (n - 1)) / n
    cells = []
    for caption, src in items:
        path = (ROOT / src)
        reader = ImageReader(str(path))
        iw, ih = reader.getSize()
        w = col_w
        h = w * ih / iw
        max_h = 56 * mm
        if h > max_h:
            h = max_h
            w = h * iw / ih
        img = Image(str(path), width=w, height=h)
        cells.append([img, Paragraph(inline(caption), st["Caption"])])
    data = [[c[0] for c in cells], [c[1] for c in cells]]
    widths = []
    for i in range(n):
        widths += [col_w] + ([gap] if i < n - 1 else [])
    data = [[x for i, c in enumerate(row) for x in ([c] + ([""] if i < n - 1 else []))] for row in data]
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def md_table(rows: list[list[str]], st) -> Table:
    data = []
    for ri, row in enumerate(rows):
        style = st["CellHead"] if ri == 0 else st["Cell"]
        data.append([Paragraph(inline(c), style) for c in row])
    cols = len(rows[0])
    def plain(s):
        return re.sub(r"[*`]", "", s)
    min_w = [max(pdfmetrics.stringWidth(w, BOLD, 8.8) for r in rows for w in plain(r[i]).split() or [""]) + 10
             for i in range(cols)]
    lengths = [max(len(plain(r[i])) for r in rows) for i in range(cols)]
    total = sum(lengths) or 1
    # Erst jeder Spalte ihr längstes Wort geben, den Rest nach Textmenge verteilen.
    want = [max(TEXT_W * l / total - m, 0) for l, m in zip(lengths, min_w)]
    rest = max(TEXT_W - sum(min_w), 0)
    share = rest / (sum(want) or 1)
    widths = [m + w * share for m, w in zip(min_w, want)]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, RASTER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, WECHSEL]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.6), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def parse(md: str, st, banner_factory) -> list:
    story: list = []
    lines = md.splitlines()
    i = 0
    title = subtitle = None
    while i < len(lines):
        raw = lines[i]
        line = raw.strip()
        if not line:
            i += 1
            continue
        if line == "<!-- umbruch -->":
            story.append(PageBreak())
            i += 1
            continue
        if line.startswith("<!--"):
            i += 1
            continue
        if line.startswith("# ") and title is None:
            title = line[2:].strip()
            if i + 1 < len(lines) and lines[i + 1].strip().startswith("**"):
                subtitle = lines[i + 1].strip().strip("*")
                i += 1
            story.append(banner_factory(title, subtitle or ""))
            story.append(Spacer(1, 2 * mm))
            i += 1
            continue
        if line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), st["H2"]))
            i += 1
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), st["H3"]))
            i += 1
            continue
        if line.startswith(">"):
            parts = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                parts.append(lines[i].strip().lstrip("> ").strip())
                i += 1
            story.append(HintBox(Paragraph(inline(" ".join(parts)), st["Hint"])))
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = lines[i].strip()
                if not re.match(r"^\|[\s:|-]+\|$", row):
                    rows.append([c.strip() for c in row.strip("|").split("|")])
                i += 1
            story.append(Spacer(1, 1 * mm))
            story.append(md_table(rows, st))
            story.append(Spacer(1, 2.5 * mm))
            continue
        if line.startswith("!["):
            items = []
            while i < len(lines) and lines[i].strip().startswith("!["):
                m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", lines[i].strip())
                if m:
                    items.append((m.group(1), m.group(2)))
                i += 1
            story.append(Spacer(1, 1.5 * mm))
            story.append(image_row(items, st))
            story.append(Spacer(1, 3 * mm))
            continue
        m = re.match(r"^(\d+)\.\s+(.*)", line)
        if m:
            story.append(Paragraph(inline(m.group(2)), st["Bullet"], bulletText=f"{m.group(1)}."))
            i += 1
            continue
        if line.startswith("- "):
            story.append(Paragraph(inline(line[2:]), st["Bullet"], bulletText="\u2022"))
            i += 1
            continue
        para = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#|>|\||!\[|- |\d+\.\s|<!--)", lines[i].strip()):
            para.append(lines[i].strip())
            i += 1
        story.append(Paragraph(inline(" ".join(para)), st["Body"]))
    return story


def build(cfg: dict) -> Path:
    hr = cfg.get("handreichung") or {}
    for key in ("md", "pdf"):
        if not hr.get(key):
            raise BauFehler(f"bau.json: handreichung.{key} fehlt.")
    md_path = ROOT / hr["md"]
    pdf_path = ROOT / hr["pdf"]
    build_id = current_build(ROOT / cfg["preset"])
    if not build_id or build_id == "0" * 12:
        raise BauFehler("Keine Baukennung im Vorlagensatz, zuerst python bau.py ausführen.")
    st = styles()
    lizenz = cfg["lizenz"]
    titel = cfg["titel"]
    bild = ROOT / hr["bild"] if hr.get("bild") else None
    logo, default_img = cached_image(LOGO_URL), cached_image(DEFAULT_URL)
    meta = f"Vorlagensatz Build {build_id}  ·  getestet mit Moodle 5.3  ·  {lizenz}"

    def banner(title, subtitle):
        return TitleBanner(title, subtitle, meta, bild if bild and bild.exists() else None)

    story = parse(md_path.read_text(encoding="utf-8"), st, banner)
    story.append(Spacer(1, 4 * mm))
    story.append(FooterBanner(titel, build_id, lizenz, default_img, logo))

    def on_page(c, doc):
        c.saveState()
        top = PAGE_H - MARGIN_TOP
        if logo:
            c.drawImage(ImageReader(str(logo)), MARGIN_X, top - 9 * mm, 9 * mm, 9 * mm, mask="auto")
        c.setFont(BOLD, 9)
        c.setFillColor(NAVY)
        c.drawString(MARGIN_X + 11.5 * mm, top - 5.6 * mm, "bildungssprit")
        c.setFont(REG, 8.5)
        c.setFillColor(SCHIEFER)
        c.drawRightString(PAGE_W - MARGIN_X, top - 5.6 * mm, f"Handreichung  ·  Moodle-Datenbank {titel}")
        c.setStrokeColor(PINK)
        c.setLineWidth(0.6)
        c.line(MARGIN_X, top - 11.5 * mm, PAGE_W - MARGIN_X, top - 11.5 * mm)
        c.setFont(REG, 8)
        c.setFillColor(GRAU_LIZENZ)
        text = f"{lizenz} bildungssprit  ·  linktr.ee/bildungssprit"
        c.drawCentredString(PAGE_W / 2, MARGIN_BOTTOM - 4 * mm, text)
        tw = c.stringWidth(text, REG, 8)
        c.linkURL(LINKTREE, (PAGE_W / 2 - tw / 2, MARGIN_BOTTOM - 5 * mm, PAGE_W / 2 + tw / 2, MARGIN_BOTTOM - 1 * mm))
        c.drawRightString(PAGE_W - MARGIN_X, MARGIN_BOTTOM - 4 * mm, f"Seite {doc.page}")
        c.restoreState()

    frame = Frame(MARGIN_X, MARGIN_BOTTOM + FOOTER_H - 4 * mm, TEXT_W,
                  PAGE_H - MARGIN_TOP - HEADER_H - MARGIN_BOTTOM - FOOTER_H + 4 * mm,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    tmp = pdf_path.with_suffix(".pdf.tmp")
    doc = BaseDocTemplate(str(tmp), pagesize=A4, title=f"Handreichung: {titel}",
                          author="bildungssprit, Falk Szyba", subject=f"Moodle-Datenbank {titel}, {lizenz}")
    doc.addPageTemplates([PageTemplate(id="seite", frames=[frame], onPage=on_page)])
    doc.build(story)
    tmp.replace(pdf_path)
    return pdf_path


def page_count(pdf: Path) -> int:
    return len(re.findall(rb"/Type\s*/Page[^s]", pdf.read_bytes()))


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ablegen", action="store_true", help="PDF ins Zielverzeichnis kopieren")
    args = parser.parse_args()
    try:
        cfg = load_config()
        pdf = build(cfg)
        pages = page_count(pdf)
        print(f"{pdf.name}: {pages} Seite(n)")
        if pages > 2:
            print("Hinweis: mehr als zwei Seiten, Vorgabe sind höchstens zwei.")
        if args.ablegen:
            ziel = Path(cfg.get("ziel", ""))
            if not ziel.is_dir():
                raise BauFehler(f"Zielverzeichnis fehlt: {ziel}")
            dst = ziel / pdf.name
            shutil.copyfile(pdf, dst)
            if hashlib.sha256(pdf.read_bytes()).digest() != hashlib.sha256(dst.read_bytes()).digest():
                raise BauFehler(f"Kopie nach {dst} weicht vom Original ab.")
            print(f"Abgelegt und geprüft: {dst}")
    except BauFehler as err:
        print(f"FEHLER: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
