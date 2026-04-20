from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "Delivery_Cart_App_Explanation.md"
OUTPUT = ROOT / "Delivery_Cart_App_Explanation.pdf"


def escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="DocTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#1c1c1c"),
            spaceAfter=16,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#8a5a2b"),
            spaceBefore=10,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#2d2d2d"),
            spaceBefore=8,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyTextTight",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#2d2d2d"),
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletText",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            leftIndent=14,
            firstLineIndent=-10,
            bulletIndent=0,
            textColor=colors.HexColor("#2d2d2d"),
            spaceAfter=4,
        )
    )
    return styles


def parse_markdown(lines, styles):
    story = []
    pending_paragraph = []

    def flush_paragraph():
        nonlocal pending_paragraph
        if pending_paragraph:
            text = " ".join(pending_paragraph).strip()
            if text:
                story.append(Paragraph(escape(text), styles["BodyTextTight"]))
            pending_paragraph = []

    for raw_line in lines:
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            continue

        if stripped == "---PAGEBREAK---":
            flush_paragraph()
            story.append(PageBreak())
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(escape(stripped[2:].strip()), styles["DocTitle"]))
            story.append(Spacer(1, 6))
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(escape(stripped[3:].strip()), styles["SectionHeading"]))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(escape(stripped[4:].strip()), styles["SubHeading"]))
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            story.append(Paragraph(escape(stripped[2:].strip()), styles["BulletText"], bulletText="•"))
            continue

        numbered_match = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if numbered_match:
            flush_paragraph()
            number = numbered_match.group(1)
            body = numbered_match.group(2)
            story.append(Paragraph(escape(body), styles["BulletText"], bulletText=f"{number}."))
            continue

        pending_paragraph.append(stripped)

    flush_paragraph()
    return story


def add_page_number(canvas, doc):
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#7b6f63"))
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Page {doc.page}")


def main():
    styles = build_styles()
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story = parse_markdown(lines, styles)

    doc = SimpleDocTemplate(
      str(OUTPUT),
      pagesize=A4,
      rightMargin=36,
      leftMargin=36,
      topMargin=42,
      bottomMargin=36,
      title="Delivery Cart App Explanation",
      author="OpenAI Codex",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Created PDF at {OUTPUT}")


if __name__ == "__main__":
    main()
