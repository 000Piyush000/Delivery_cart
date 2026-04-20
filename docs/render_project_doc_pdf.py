from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import ListFlowable, ListItem, PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
MARKDOWN_PATH = ROOT / "Project_Documentation.md"
PDF_PATH = ROOT / "Project_Documentation.pdf"


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        name="DocH1",
        parent=styles["Heading1"],
        fontSize=17,
        leading=22,
        textColor=colors.HexColor("#111827"),
        spaceBefore=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="DocH2",
        parent=styles["Heading2"],
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#1f2937"),
        spaceBefore=10,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="DocBody",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="DocCode",
        fontName="Courier",
        fontSize=8.5,
        leading=10.5,
        leftIndent=8,
        rightIndent=8,
        spaceBefore=4,
        spaceAfter=8,
        backColor=colors.HexColor("#f3f4f6"),
        borderPadding=6,
    )
)


def escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_story() -> list:
    lines = MARKDOWN_PATH.read_text(encoding="utf-8").splitlines()
    story = []
    buffer = []
    bullet_items = []
    code_buffer = []
    in_code = False

    def flush_paragraph():
        nonlocal buffer
        if buffer:
            text = " ".join(part.strip() for part in buffer).strip()
            if text:
                story.append(Paragraph(escape_html(text), styles["DocBody"]))
            buffer = []

    def flush_bullets():
        nonlocal bullet_items
        if bullet_items:
            story.append(
                ListFlowable(
                    [ListItem(Paragraph(escape_html(item), styles["DocBody"])) for item in bullet_items],
                    bulletType="bullet",
                    start="circle",
                    leftIndent=18,
                )
            )
            story.append(Spacer(1, 4))
            bullet_items = []

    def flush_code():
        nonlocal code_buffer
        if code_buffer:
            story.append(Preformatted("\n".join(code_buffer), styles["DocCode"]))
            code_buffer = []

    for line in lines:
        stripped = line.rstrip()

        if stripped.startswith("```"):
            flush_paragraph()
            flush_bullets()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_buffer.append(stripped)
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            flush_bullets()
            title = stripped[2:].strip()
            story.append(Spacer(1, 18))
            story.append(Paragraph(escape_html(title), styles["DocTitle"]))
            story.append(Paragraph("Project Documentation", styles["DocBody"]))
            story.append(PageBreak())
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            flush_bullets()
            story.append(Paragraph(escape_html(stripped[3:].strip()), styles["DocH1"]))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            flush_bullets()
            story.append(Paragraph(escape_html(stripped[4:].strip()), styles["DocH2"]))
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            bullet_items.append(stripped[2:].strip())
            continue

        if not stripped:
            flush_paragraph()
            flush_bullets()
            continue

        buffer.append(stripped)

    flush_paragraph()
    flush_bullets()
    flush_code()
    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawRightString(A4[0] - 0.65 * inch, 0.5 * inch, f"Page {doc.page}")
    canvas.restoreState()


def main():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Logistics Delivery Management System - Project Documentation",
        author="OpenAI Codex",
    )
    story = build_story()
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Created {PDF_PATH}")


if __name__ == "__main__":
    main()
