"""ReportLab PDF renderer for CareerMap reports."""

import io
from datetime import date

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak, HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch, cm
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

from education_context import SALARY_DISCLAIMER, UG_AMBER_NOTE, COUNSELLOR_CALLOUT

# ── Brand colours ──────────────────────────────────────────────────────────────
CORAL       = HexColor('#a53600')
CORAL_LIGHT = HexColor('#FFF8F5')
PURPLE      = HexColor('#3C3489')
PURPLE_LIGHT= HexColor('#F7F4FF')
GREEN       = HexColor('#1D9E75')
GREEN_LIGHT = HexColor('#F0FAF6')
AMBER_LIGHT = HexColor('#FFFBF0')
AMBER_BORDER= HexColor('#E8A900')
DARK        = HexColor('#1a1a1a')
MUTED       = HexColor('#555555')
RULE_LINE   = HexColor('#E8DDD8')
TABLE_HEADER= HexColor('#F5F0EE')

# ── Shared styles ──────────────────────────────────────────────────────────────
def _style(name, **kwargs):
    defaults = dict(fontName='Helvetica', fontSize=11, textColor=DARK, leading=16, spaceAfter=0)
    defaults.update(kwargs)
    return ParagraphStyle(name, **defaults)

STYLES = {
    'cover_title':   _style('cover_title',   fontName='Helvetica-Bold', fontSize=28, textColor=CORAL,  leading=34, spaceAfter=8, alignment=TA_CENTER),
    'cover_sub':     _style('cover_sub',     fontName='Helvetica',      fontSize=14, textColor=MUTED,  leading=20, spaceAfter=4, alignment=TA_CENTER),
    'cover_email':   _style('cover_email',   fontName='Helvetica-Bold', fontSize=13, textColor=DARK,   leading=18, alignment=TA_CENTER),
    'cover_date':    _style('cover_date',    fontName='Helvetica',      fontSize=11, textColor=MUTED,  leading=16, alignment=TA_CENTER),
    'h1':            _style('h1',            fontName='Helvetica-Bold', fontSize=18, textColor=CORAL,  leading=24, spaceAfter=6),
    'h2':            _style('h2',            fontName='Helvetica-Bold', fontSize=14, textColor=PURPLE, leading=20, spaceAfter=4),
    'h3':            _style('h3',            fontName='Helvetica-Bold', fontSize=12, textColor=DARK,   leading=17, spaceAfter=3),
    'body':          _style('body',          fontName='Helvetica',      fontSize=11, textColor=DARK,   leading=17, spaceAfter=6, alignment=TA_JUSTIFY),
    'body_left':     _style('body_left',     fontName='Helvetica',      fontSize=11, textColor=DARK,   leading=17, spaceAfter=6),
    'bullet':        _style('bullet',        fontName='Helvetica',      fontSize=11, textColor=DARK,   leading=17, spaceAfter=4, leftIndent=16, bulletIndent=0),
    'caption':       _style('caption',       fontName='Helvetica',      fontSize=9,  textColor=MUTED,  leading=13, spaceAfter=4, alignment=TA_JUSTIFY),
    'caption_amber': _style('caption_amber', fontName='Helvetica',      fontSize=9,  textColor=HexColor('#7A5A00'), leading=13, spaceAfter=4, alignment=TA_JUSTIFY),
    'callout':       _style('callout',       fontName='Helvetica',      fontSize=11, textColor=HexColor('#145C44'), leading=16, spaceAfter=4, alignment=TA_JUSTIFY),
    'callout_bold':  _style('callout_bold',  fontName='Helvetica-Bold', fontSize=11, textColor=HexColor('#145C44'), leading=16),
    'section_label': _style('section_label', fontName='Helvetica',      fontSize=9,  textColor=MUTED,  leading=12, spaceAfter=2),
    'path_name':     _style('path_name',     fontName='Helvetica-Bold', fontSize=11, textColor=PURPLE, leading=15),
    'path_desc':     _style('path_desc',     fontName='Helvetica',      fontSize=10, textColor=MUTED,  leading=14),
    'tag_text':      _style('tag_text',      fontName='Helvetica-Bold', fontSize=9,  textColor=white,  leading=12, alignment=TA_CENTER),
    'table_header':  _style('table_header',  fontName='Helvetica-Bold', fontSize=10, textColor=DARK,   leading=14),
    'table_body':    _style('table_body',    fontName='Helvetica',      fontSize=10, textColor=DARK,   leading=14),
}

W = inch * 6.5  # usable width at 1" margins on A4


# ── Helpers ────────────────────────────────────────────────────────────────────

def sp(pts=6):
    return Spacer(1, pts)


def rule():
    return HRFlowable(width='100%', thickness=0.5, color=RULE_LINE, spaceAfter=8, spaceBefore=4)


def career_header(text: str, color=CORAL) -> Paragraph:
    """Coloured section label block."""
    style = _style('_ch', fontName='Helvetica-Bold', fontSize=12, textColor=white,
                   backColor=color, leading=17, leftPadding=10, rightPadding=10,
                   topPadding=6, bottomPadding=6, spaceAfter=10)
    return Paragraph(text, style)


def domain_banner(name: str, number: int) -> list:
    """Large coloured domain title block."""
    label_style = _style('_dl', fontName='Helvetica', fontSize=10, textColor=white,
                         backColor=CORAL, leading=14, alignment=TA_CENTER,
                         leftPadding=8, rightPadding=8, topPadding=4, bottomPadding=0)
    name_style = _style('_dn', fontName='Helvetica-Bold', fontSize=20, textColor=white,
                        backColor=CORAL, leading=26, alignment=TA_CENTER,
                        leftPadding=12, rightPadding=12, topPadding=0, bottomPadding=10)
    return [
        Paragraph(f'Domain {number}', label_style),
        Paragraph(name, name_style),
        sp(10),
    ]


def colored_box(content_flowables: list, bg=PURPLE_LIGHT, padding=10) -> Table:
    """Wraps flowables in a coloured background box via single-cell Table."""
    inner = Table([[content_flowables]], colWidths=[W - padding * 2])
    inner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('LEFTPADDING',  (0, 0), (-1, -1), padding),
        ('RIGHTPADDING', (0, 0), (-1, -1), padding),
        ('TOPPADDING',   (0, 0), (-1, -1), padding),
        ('BOTTOMPADDING',(0, 0), (-1, -1), padding),
        ('ROUNDEDCORNERS', (0, 0), (-1, -1), 6),
    ]))
    return inner


# ── Cover page ─────────────────────────────────────────────────────────────────

def build_cover(ctx: dict) -> list:
    email = ctx.get('email', '')
    grade = ctx.get('grade', '')
    today = date.today().strftime('%d %B %Y')

    return [
        sp(60),
        Paragraph('CareerMap', STYLES['cover_title']),
        sp(4),
        Paragraph('Your Personalised Career Report', STYLES['cover_sub']),
        sp(40),
        rule(),
        sp(12),
        Paragraph(email, STYLES['cover_email']),
        sp(6),
        Paragraph(grade, STYLES['cover_sub']),
        sp(6),
        Paragraph(today, STYLES['cover_date']),
        sp(12),
        rule(),
        sp(40),
        Paragraph(
            'This report was generated from your CareerMap assessment responses. '
            'Everything in it is specific to how you answered — not a generic profile.',
            STYLES['caption'],
        ),
    ]


# ── About this report ──────────────────────────────────────────────────────────

def build_about(ctx: dict) -> list:
    from prompts import DECISION_WINDOW_GRADES
    grade = ctx.get('grade', '')
    urgency = grade in DECISION_WINDOW_GRADES

    parts = [
        Paragraph('About This Report', STYLES['h1']),
        sp(6),
        Paragraph(
            'The CareerMap assessment collected seven signals: how you think, how you reason, '
            'what subjects and activities energise you, who inspires you, and what motivates you. '
            'The Virtual Edu Guide used these to identify three domains worth exploring, '
            'and this report goes deeper into each of them.',
            STYLES['body'],
        ),
        sp(8),
        Paragraph(
            'This is not a verdict. It is a starting point. The domains identified are not a ceiling '
            'on what you can do; they are directions that match how you actually think and what '
            'genuinely interests you. Career paths shift. Your interests will keep evolving. '
            'Use this report to open conversations, not to close them.',
            STYLES['body'],
        ),
    ]

    if urgency:
        parts += [
            sp(8),
            colored_box([
                Paragraph('A note for this stage', STYLES['h3']),
                sp(4),
                Paragraph(
                    'You are at the Decision Window: stream and subject choices are close. '
                    'This report includes specific stream and subject guidance for each domain. '
                    'Those sections are worth reading carefully before finalising your choices.',
                    STYLES['body_left'],
                ),
            ], bg=AMBER_LIGHT),
        ]

    return parts


# ── Thinking style + Strengths ─────────────────────────────────────────────────

def build_thinking_section(data: dict) -> list:
    ts = data.get('thinking_style', {})
    strengths = data.get('strengths', [])
    blind_spots = data.get('blind_spots', [])

    parts = [
        Paragraph('How You Think', STYLES['h1']),
        rule(),
        sp(4),
    ]

    for key in ('para1', 'para2'):
        text = ts.get(key, '')
        if text:
            parts += [Paragraph(text, STYLES['body']), sp(6)]

    parts += [sp(10), Paragraph('Your Strengths', STYLES['h1']), rule(), sp(4)]

    for s in strengths:
        parts += [Paragraph(f'• {s}', STYLES['bullet']), sp(4)]

    parts += [sp(10), Paragraph('Areas to Watch', STYLES['h1']), rule(), sp(4)]

    for b in blind_spots:
        parts += [Paragraph(f'• {b}', STYLES['bullet']), sp(4)]

    return parts


# ── Career deep-dive ───────────────────────────────────────────────────────────

def build_career_section(domain: dict, career_data: dict, internships: list,
                         next_30: str, market: dict, ctx: dict) -> list:
    from education_context import SALARY_DISCLAIMER, UG_AMBER_NOTE
    from prompts import DECISION_WINDOW_GRADES, UNDERGRAD_GRADES
    grade = ctx.get('grade', '')
    is_decision_window = grade in DECISION_WINDOW_GRADES
    is_undergrad = grade in UNDERGRAD_GRADES
    domain_number = ctx['domains'].index(domain) + 1

    parts = domain_banner(domain['name'], domain_number)

    # Why this fits you
    fit = career_data.get('fit_rationale', '')
    if fit:
        parts += [
            career_header('Why this fits you', PURPLE),
            Paragraph(fit, STYLES['body']),
            sp(10),
        ]

    # Paths within this domain
    paths = career_data.get('paths', [])
    if paths:
        parts.append(career_header('Paths within this domain', PURPLE))
        path_rows = []
        for p in paths[:5]:
            path_rows.append([
                Paragraph(p.get('name', ''), STYLES['path_name']),
                Paragraph(p.get('description', ''), STYLES['path_desc']),
            ])
        path_table = Table(path_rows, colWidths=[1.8*inch, W - 1.8*inch - 12])
        path_table.setStyle(TableStyle([
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING',   (0, 0), (-1, -1), 6),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
            ('TOPPADDING',    (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [PURPLE_LIGHT, white]),
        ]))
        parts += [path_table, sp(10)]

    # Stream guidance (Decision Window only)
    if is_decision_window:
        sg = career_data.get('stream_guidance', '')
        if sg:
            parts += [
                career_header('Stream and Subject Guidance', CORAL),
                Paragraph(sg, STYLES['body']),
                sp(4),
                Paragraph(
                    'Note: Maths board requirements and course prerequisites vary across schools and boards. '
                    'Always verify current requirements directly with your school.',
                    STYLES['caption'],
                ),
                sp(10),
            ]

    # UG / Postgrad degrees
    degree_key = 'postgrad_degrees' if is_undergrad else 'ug_degrees'
    degrees = career_data.get(degree_key, [])
    degree_label = 'Postgraduate Degrees to Consider' if is_undergrad else 'UG Degrees to Consider'
    if degrees:
        deg_rows = [[
            Paragraph('Degree', STYLES['table_header']),
            Paragraph('What it opens up', STYLES['table_header']),
        ]]
        for d in degrees[:6]:
            deg_rows.append([
                Paragraph(d.get('name', ''), STYLES['table_body']),
                Paragraph(d.get('note', ''), STYLES['table_body']),
            ])
        deg_table = Table(deg_rows, colWidths=[2.2*inch, W - 2.2*inch - 12])
        deg_table.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0),  TABLE_HEADER),
            ('FONTNAME',      (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING',   (0, 0), (-1, -1), 6),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
            ('TOPPADDING',    (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('GRID',          (0, 0), (-1, -1), 0.5, RULE_LINE),
        ]))
        parts += [
            career_header(degree_label, PURPLE),
            KeepTogether([
                deg_table,
                sp(4),
                Paragraph(UG_AMBER_NOTE, STYLES['caption_amber']),
            ]),
            sp(10),
        ]

    # Market demand + salary (static)
    sal_rows = [
        [Paragraph('Market demand', STYLES['table_header']), Paragraph(market['demand'], STYLES['table_body'])],
        [Paragraph('Entry-level salary', STYLES['table_header']), Paragraph(market['entry_salary'], STYLES['table_body'])],
        [Paragraph('Mid-career salary', STYLES['table_header']), Paragraph(market['mid_career_salary'], STYLES['table_body'])],
        [Paragraph('Top earners', STYLES['table_header']), Paragraph(market['top_salary'], STYLES['table_body'])],
    ]
    sal_table = Table(sal_rows, colWidths=[2.2*inch, W - 2.2*inch - 12])
    sal_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, -1),  TABLE_HEADER),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID',          (0, 0), (-1, -1), 0.5, RULE_LINE),
    ]))
    parts += [
        career_header('Market Demand and Salary', PURPLE),
        KeepTogether([
            Paragraph(market.get('note', ''), STYLES['body_left']),
            sp(4),
            sal_table,
            sp(4),
            Paragraph(SALARY_DISCLAIMER, STYLES['caption']),
        ]),
        sp(10),
    ]

    # Internships (Haiku)
    if internships:
        int_rows = [[
            Paragraph('Opportunity', STYLES['table_header']),
            Paragraph('Type', STYLES['table_header']),
            Paragraph('How to find it', STYLES['table_header']),
        ]]
        for entry in internships[:4]:
            int_rows.append([
                Paragraph(entry.get('name', ''), STYLES['table_body']),
                Paragraph(entry.get('type', ''), STYLES['table_body']),
                Paragraph(entry.get('how', ''), STYLES['table_body']),
            ])
        int_table = Table(int_rows, colWidths=[1.8*inch, 1.1*inch, W - 2.9*inch - 12])
        int_table.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0),  TABLE_HEADER),
            ('FONTNAME',      (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING',   (0, 0), (-1, -1), 5),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 5),
            ('TOPPADDING',    (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('GRID',          (0, 0), (-1, -1), 0.5, RULE_LINE),
        ]))
        parts += [career_header('Internships to Target', PURPLE), int_table, sp(10)]

    # Next 30 days (Haiku)
    if next_30:
        parts += [
            KeepTogether([
                career_header('Your Next 30 Days', GREEN),
                colored_box([Paragraph(next_30, STYLES['body_left'])], bg=GREEN_LIGHT),
            ]),
        ]

    return parts


# ── Parent summary ─────────────────────────────────────────────────────────────

def build_parent_summary(data: dict, ctx: dict) -> list:
    parts = [
        Paragraph('For Your Parent', STYLES['h1']),
        rule(),
        sp(4),
        Paragraph(
            'This section is written for the parent or guardian reading this report.',
            STYLES['section_label'],
        ),
        sp(8),
    ]

    for key in ('para1', 'para2', 'para3'):
        text = data.get(key, '')
        if text:
            parts += [Paragraph(text, STYLES['body']), sp(8)]

    parts += [
        sp(4),
        colored_box([
            Paragraph('Free counsellor call included', STYLES['callout_bold']),
            sp(4),
            Paragraph(COUNSELLOR_CALLOUT, STYLES['callout']),
        ], bg=GREEN_LIGHT),
    ]

    return parts


# ── What happens next ──────────────────────────────────────────────────────────

def build_what_next() -> list:
    steps = [
        ('Read the report once without pressure',
         'Go through each domain. Note what resonates and what does not. You do not need to decide anything yet.'),
        ('Talk to the counsellor',
         'A CareerMap counsellor will call within 48 hours. They have read this report. '
         'Come with questions, doubts, and anything that felt off.'),
        ('Pick one explore action',
         'Each domain has a "Next 30 Days" section. Pick one thing from any domain and do it. '
         'One conversation, one video, one visit. Start small.'),
        ('Share with someone who knows you',
         'A parent, an older sibling, a teacher who has seen you work. '
         'Ask them what they recognise and what surprises them.'),
    ]

    parts = [
        Paragraph('What Happens Next', STYLES['h1']),
        rule(),
        sp(6),
    ]

    for i, (title, desc) in enumerate(steps, 1):
        parts += [
            Paragraph(f'{i}. {title}', STYLES['h3']),
            Paragraph(desc, STYLES['body']),
            sp(8),
        ]

    parts += [
        sp(16),
        rule(),
        Paragraph(
            'CareerMap · Virtual Edu Guide · V1 · '
            'CBSE/ISC 2025 pathways · atrios.in',
            STYLES['caption'],
        ),
    ]

    return parts


# ── Main entry point ───────────────────────────────────────────────────────────

def build_pdf(ctx: dict, content: dict) -> bytes:
    """Render the full PDF and return as bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=0.9 * inch,
        bottomMargin=0.75 * inch,
        title='CareerMap Report',
        author='CareerMap',
    )

    story = []

    story.extend(build_cover(ctx))
    story.append(PageBreak())

    story.extend(build_about(ctx))
    story.append(PageBreak())

    story.extend(build_thinking_section(content['thinking_and_strengths']))
    story.append(PageBreak())

    domains = ctx['domains']
    market_data = ctx['market_data']
    internships_all = content.get('internships', {})
    next_30_all = content.get('next_30_days', {})

    for i, domain in enumerate(domains):
        key = f'domain_{i + 1}'
        career_data = content.get(f'career_{i + 1}', {})
        internships = internships_all.get(key, [])
        next_30 = next_30_all.get(key, '')
        market = market_data[i]

        story.extend(build_career_section(domain, career_data, internships, next_30, market, ctx))
        story.append(PageBreak())

    story.extend(build_parent_summary(content.get('parent_summary', {}), ctx))
    story.append(PageBreak())

    story.extend(build_what_next())

    doc.build(story)
    return buf.getvalue()
