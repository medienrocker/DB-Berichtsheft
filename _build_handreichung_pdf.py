"""
Build HANDREICHUNG_feedBOOK.pdf aus HANDREICHUNG_feedBOOK.md
mit bildungssprit-Branding und bs-Logo oben links in der Kopfzeile
auf jeder Seite.
"""
import os
import re
import sys
import urllib.request
import tempfile

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)
from reportlab.lib.utils import ImageReader

# === KONFIGURATION ===
HERE = os.path.dirname(os.path.abspath(__file__))
INPUT_MD = os.path.join(HERE, "HANDREICHUNG_feedBOOK.md")
OUTPUT_PDF = os.path.join(HERE, "HANDREICHUNG_feedBOOK.pdf")

LOGO_URL = "https://img.bildungssprit.de/dbimg/bildungssprit_logo.png"
LOGO_LOCAL = os.path.join(tempfile.gettempdir(), "bs_logo_header.png")

# Brand-Farben (bildungssprit)
COLOR_DARK = HexColor("#031627")      # primary
COLOR_TEAL = HexColor("#019798")      # teal
COLOR_PINK = HexColor("#ff4080")      # pink accent
COLOR_BG_ALT = HexColor("#f5f5f5")
COLOR_CREAM = HexColor("#fff8e1")
COLOR_MUTED = HexColor("#555555")


def ensure_logo():
    """Download logo once to temp file if not cached."""
    if not os.path.exists(LOGO_LOCAL) or os.path.getsize(LOGO_LOCAL) < 100:
        try:
            urllib.request.urlretrieve(LOGO_URL, LOGO_LOCAL)
        except Exception as e:
            print(f"Warnung: Logo konnte nicht geladen werden ({e}).")
            return None
    return LOGO_LOCAL


# === STYLES ===
def build_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("DocTitle", parent=s["Title"],
        fontSize=22, textColor=COLOR_DARK, spaceAfter=3*mm,
        fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("DocSubtitle", parent=s["Normal"],
        fontSize=11, textColor=COLOR_TEAL, spaceAfter=6*mm,
        fontName="Helvetica-Oblique", alignment=TA_CENTER))
    s.add(ParagraphStyle("H2", parent=s["Heading2"],
        fontSize=15, textColor=COLOR_DARK, spaceBefore=8*mm, spaceAfter=3*mm,
        fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("H3", parent=s["Heading3"],
        fontSize=11.5, textColor=COLOR_TEAL, spaceBefore=5*mm, spaceAfter=2*mm,
        fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("H4", parent=s["Heading4"],
        fontSize=10, textColor=COLOR_DARK, spaceBefore=3*mm, spaceAfter=1.5*mm,
        fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("Body", parent=s["Normal"],
        fontSize=9.5, leading=13, spaceAfter=2*mm, fontName="Helvetica"))
    s.add(ParagraphStyle("BulletItem", parent=s["Normal"],
        fontSize=9.5, leading=13, spaceAfter=1.5*mm,
        leftIndent=12*mm, bulletIndent=6*mm, fontName="Helvetica"))
    s.add(ParagraphStyle("NumberedItem", parent=s["Normal"],
        fontSize=9.5, leading=13, spaceAfter=1.5*mm,
        leftIndent=12*mm, bulletIndent=6*mm, fontName="Helvetica"))
    s.add(ParagraphStyle("CodeBlock", parent=s["Normal"],
        fontSize=8, leading=10, spaceAfter=2*mm, fontName="Courier",
        backColor=COLOR_BG_ALT, leftIndent=6*mm, rightIndent=6*mm,
        borderPadding=4, spaceBefore=2*mm))
    s.add(ParagraphStyle("Hint", parent=s["Normal"],
        fontSize=9, leading=12, spaceAfter=3*mm,
        fontName="Helvetica-Oblique", textColor=COLOR_MUTED,
        leftIndent=6*mm, borderPadding=4, backColor=COLOR_CREAM))
    s.add(ParagraphStyle("DocFooter", parent=s["Normal"],
        fontSize=8, textColor=HexColor("#999999"), alignment=TA_CENTER))
    return s


# === HILFSFUNKTIONEN ===
def escape_html(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline_format(text):
    """Wandelt **bold** und `code` in ReportLab-XML um."""
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font face="Courier" size="8.5">\1</font>', text)
    return text


# === PAGE HEADER / FOOTER ===
def draw_page_decorations(canvas, doc, logo_path):
    """Zeichnet Logo oben links, dünne Akzentlinie, Seitenzahl unten rechts."""
    canvas.saveState()

    page_width, page_height = A4

    # === HEADER ===
    header_y = page_height - 12*mm  # Baseline für Logo
    logo_h = 10*mm
    logo_x = 15*mm
    logo_y = page_height - 15*mm

    if logo_path and os.path.exists(logo_path):
        try:
            img = ImageReader(logo_path)
            iw, ih = img.getSize()
            aspect = iw / float(ih) if ih else 1.0
            logo_w = logo_h * aspect
            canvas.drawImage(
                img, logo_x, logo_y,
                width=logo_w, height=logo_h,
                mask="auto", preserveAspectRatio=True
            )
        except Exception as e:
            print(f"Warnung: Logo-Render fehlgeschlagen ({e}).")

    # Rechtsbündige Header-Kennzeichnung
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(COLOR_MUTED)
    canvas.drawRightString(
        page_width - 15*mm, page_height - 10*mm,
        "Handreichung - feedBOOK"
    )

    # Akzentlinie (Brand-Gradient-Ersatz: feste Farbe)
    canvas.setStrokeColor(COLOR_PINK)
    canvas.setLineWidth(0.8)
    canvas.line(15*mm, page_height - 18*mm,
                page_width - 15*mm, page_height - 18*mm)

    # === FOOTER ===
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#999999"))
    canvas.drawString(
        15*mm, 10*mm,
        "CC-BY-SA bildungssprit.de - Falk Szyba @medienrocker"
    )
    canvas.drawRightString(
        page_width - 15*mm, 10*mm,
        f"Seite {doc.page}"
    )

    canvas.restoreState()


# === MARKDOWN PARSER ===
def parse_md_to_story(md_text, styles):
    story = []
    lines = md_text.split("\n")
    i = 0
    title_done = False
    in_code_block = False
    code_lines = []

    while i < len(lines):
        line = lines[i]

        # Code-Block Anfang/Ende
        if line.strip().startswith("```"):
            if in_code_block:
                code_text = "<br/>".join(escape_html(cl) for cl in code_lines)
                story.append(Paragraph(code_text, styles["CodeBlock"]))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # Horizontale Linie
        if stripped == "---":
            story.append(Spacer(1, 2*mm))
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_PINK))
            story.append(Spacer(1, 2*mm))
            i += 1
            continue

        # H1 Titel (nur einmal)
        if stripped.startswith("# ") and not title_done:
            story.append(Paragraph(stripped[2:], styles["DocTitle"]))
            title_done = True
            i += 1
            continue

        # Untertitel (fette Zeile direkt nach Titel)
        if stripped.startswith("**") and stripped.endswith("**") and len(story) < 4:
            story.append(Paragraph(stripped[2:-2], styles["DocSubtitle"]))
            i += 1
            continue

        # H4 / H3 / H2
        if stripped.startswith("#### "):
            story.append(Paragraph(inline_format(stripped[5:]), styles["H4"]))
            i += 1
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline_format(stripped[4:]), styles["H3"]))
            i += 1
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(inline_format(stripped[3:]), styles["H2"]))
            i += 1
            continue

        # Blockquote -> Hinweis-Box
        if stripped.startswith("> "):
            story.append(Paragraph(inline_format(stripped[2:]), styles["Hint"]))
            i += 1
            continue

        # Tabelle
        if stripped.startswith("|"):
            table_rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                row_line = lines[i].strip()
                if re.match(r'\|[\s\-:|]+\|', row_line):
                    i += 1
                    continue
                cells = [c.strip() for c in row_line.split("|")[1:-1]]
                table_rows.append(cells)
                i += 1

            if table_rows:
                formatted = []
                for ri, row in enumerate(table_rows):
                    fmt_row = []
                    for cell in row:
                        cell_text = f"<b>{cell}</b>" if ri == 0 else inline_format(cell)
                        fmt_row.append(Paragraph(cell_text, styles["Body"]))
                    formatted.append(fmt_row)

                col_count = len(formatted[0])
                col_widths = [170*mm / col_count] * col_count

                t = Table(formatted, colWidths=col_widths, repeatRows=1)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                     [HexColor("#ffffff"), COLOR_BG_ALT]),
                ]))
                story.append(Spacer(1, 2*mm))
                story.append(t)
                story.append(Spacer(1, 2*mm))
            continue

        # Nummerierte Liste
        m = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m:
            story.append(Paragraph(
                inline_format(m.group(2)), styles["NumberedItem"],
                bulletText=f"{m.group(1)}."))
            i += 1
            continue

        # Aufzählungsliste
        if stripped.startswith("- "):
            story.append(Paragraph(
                inline_format(stripped[2:]), styles["BulletItem"],
                bulletText="\u2022"))
            i += 1
            continue

        # Kursiver Footer (Lizenzzeile)
        if stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
            story.append(Spacer(1, 4*mm))
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_PINK))
            story.append(Spacer(1, 2*mm))
            story.append(Paragraph(stripped[1:-1], styles["DocFooter"]))
            i += 1
            continue

        # Normaler Absatz
        story.append(Paragraph(inline_format(stripped), styles["Body"]))
        i += 1

    return story


# === HAUPTFUNKTION ===
def build_pdf():
    logo_path = ensure_logo()

    with open(INPUT_MD, "r", encoding="utf-8") as f:
        md_text = f.read()

    styles = build_styles()
    story = parse_md_to_story(md_text, styles)

    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=28*mm, bottomMargin=18*mm,
        title="Handreichung feedBOOK - bildungssprit",
        author="bildungssprit.de - Falk Szyba"
    )

    def on_page(canvas, doc_):
        draw_page_decorations(canvas, doc_, logo_path)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF erstellt: {OUTPUT_PDF}")


if __name__ == "__main__":
    build_pdf()
