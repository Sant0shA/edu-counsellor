"""ReportLab PDF renderer for CareerShifu reports — visual layer from reference design."""

import io

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak, HRFlowable,
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4

from education_context import SALARY_DISCLAIMER, COUNSELLOR_CALLOUT

# ── Page dimensions ─────────────────────────────────────────────────────────────
W_PAGE, H_PAGE = A4
FULL_W = 170 * mm          # usable width at 20 mm margins

# ── Brand colours ────────────────────────────────────────────────────────────────
C_PURPLE        = HexColor('#3C3489')
C_PURPLE_LIGHT  = HexColor('#EEEDFE')
C_PURPLE_TEXT   = HexColor('#26215C')
C_PURPLE_BORDER = HexColor('#7F77DD')
C_GREEN         = HexColor('#1D9E75')
C_GREEN_BG      = HexColor('#E1F5EE')
C_GREEN_BORDER  = HexColor('#9FE1CB')
C_GREEN_TEXT    = HexColor('#085041')
C_AMBER_BG      = HexColor('#FAEEDA')
C_AMBER_TEXT    = HexColor('#633806')
C_MUTED         = HexColor('#6B7280')
C_BODY          = HexColor('#1F1F2E')
C_RULE          = HexColor('#E5E7EB')
C_WHITE         = white
C_URGENCY_BG    = HexColor('#FFF4F4')
C_URGENCY_BORDER= HexColor('#F9BCBC')
C_URGENCY_TEXT  = HexColor('#8B1A1A')

# ── Styles ───────────────────────────────────────────────────────────────────────
def _s(name, **kw):
    return ParagraphStyle(name, **kw)

S = {
    'section_label': _s('sl',  fontName='Helvetica-Bold',
        fontSize=8,  textColor=C_PURPLE,      leading=10,  spaceAfter=5,  letterSpacing=0.8),
    'h1':  _s('h1',  fontName='Helvetica-Bold',
        fontSize=19, textColor=C_PURPLE_TEXT,  leading=24,  spaceAfter=4),
    'h2':  _s('h2',  fontName='Helvetica-Bold',
        fontSize=13, textColor=C_PURPLE_TEXT,  leading=17,  spaceAfter=3,  spaceBefore=8),
    'h3':  _s('h3',  fontName='Helvetica-Bold',
        fontSize=10, textColor=C_PURPLE_TEXT,  leading=14,  spaceAfter=3,  spaceBefore=6),
    'career_h3': _s('ch3', fontName='Helvetica-Bold',
        fontSize=12, textColor=C_PURPLE,       leading=16,  spaceAfter=6,  spaceBefore=2),
    'body': _s('body', fontName='Helvetica',
        fontSize=10, textColor=C_BODY,         leading=15,  spaceAfter=5),
    'body_muted': _s('bm', fontName='Helvetica',
        fontSize=9,  textColor=C_MUTED,        leading=13,  spaceAfter=4),
    'bold': _s('bold', fontName='Helvetica-Bold',
        fontSize=10, textColor=C_PURPLE_TEXT,  leading=15,  spaceAfter=2),
    'small_muted': _s('sm', fontName='Helvetica',
        fontSize=8,  textColor=C_MUTED,        leading=11),
    'urgency': _s('urg', fontName='Helvetica-Bold',
        fontSize=9,  textColor=C_URGENCY_TEXT, leading=13),
    'role_title': _s('rt', fontName='Helvetica-Bold',
        fontSize=10, textColor=C_PURPLE_TEXT,  leading=14,  spaceAfter=1),
    'role_desc': _s('rd', fontName='Helvetica',
        fontSize=9,  textColor=C_MUTED,        leading=13,  spaceAfter=8),
    'ug_title': _s('ut', fontName='Helvetica-Bold',
        fontSize=9.5, textColor=C_PURPLE_TEXT, leading=13,  spaceAfter=1),
    'ug_note': _s('un', fontName='Helvetica',
        fontSize=8.5, textColor=C_MUTED,       leading=12,  spaceAfter=6),
    'cover_logo':    _s('clo', fontName='Helvetica-Bold',
        fontSize=15, textColor=C_WHITE,        leading=20,  spaceAfter=3),
    'cover_tagline': _s('cta', fontName='Helvetica',
        fontSize=9,  textColor=HexColor('#A89FF5'), leading=13),
    'cover_name':    _s('cn',  fontName='Helvetica-Bold',
        fontSize=27, textColor=C_WHITE,        leading=33,  spaceAfter=6),
    'cover_grade':   _s('cg',  fontName='Helvetica',
        fontSize=13, textColor=HexColor('#C7C4F0'), leading=18),
    'cover_label':   _s('cl',  fontName='Helvetica-Bold',
        fontSize=8,  textColor=HexColor('#A89FF5'), leading=12,
        spaceAfter=2, spaceBefore=14),
    'cover_val':     _s('cv',  fontName='Helvetica',
        fontSize=11, textColor=C_WHITE,        leading=15),
}


# ── Custom flowables ──────────────────────────────────────────────────────────────
class DemandBar(Flowable):
    def __init__(self, pct, width=FULL_W):
        super().__init__()
        self.pct, self.bar_w = pct, width

    def wrap(self, aw, ah): return self.bar_w, 10

    def draw(self):
        c = self.canv
        c.setFillColor(HexColor('#F3F4F6'))
        c.roundRect(0, 2, self.bar_w, 6, 3, fill=1, stroke=0)
        c.setFillColor(C_PURPLE)
        c.roundRect(0, 2, self.bar_w * self.pct / 100, 6, 3, fill=1, stroke=0)


class CounsellorNudge(Flowable):
    def __init__(self, width=FULL_W):
        super().__init__()
        self.nudge_w = width

    def wrap(self, aw, ah): return self.nudge_w, 22

    def draw(self):
        c = self.canv
        c.setStrokeColor(C_RULE); c.setLineWidth(0.5)
        c.line(0, 20, self.nudge_w, 20)
        c.setFillColor(C_GREEN); c.circle(6, 9, 3.5, fill=1, stroke=0)
        c.setFont('Helvetica', 8.5); c.setFillColor(C_MUTED)
        c.drawString(16, 6, 'Have questions about this career section?')
        c.setFillColor(C_GREEN)
        lx = self.nudge_w - 62
        c.drawString(lx, 6, 'WhatsApp us')
        c.setStrokeColor(C_GREEN); c.setLineWidth(0.5)
        tw = c.stringWidth('WhatsApp us', 'Helvetica', 8.5)
        c.line(lx, 4.5, lx + tw, 4.5)


# ── Page templates ────────────────────────────────────────────────────────────────
def _make_first_page(headline, stage_note):
    def first_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_PURPLE)
        canvas.rect(0, 0, W_PAGE, H_PAGE, fill=1, stroke=0)
        canvas.setFillColor(HexColor('#4A44A0'))
        canvas.circle(W_PAGE - 28*mm, H_PAGE - 38*mm, 58*mm, fill=1, stroke=0)
        canvas.setFillColor(HexColor('#5550B0'))
        canvas.circle(W_PAGE - 8*mm, H_PAGE - 78*mm, 28*mm, fill=1, stroke=0)
        canvas.setFillColor(HexColor('#302A80'))
        canvas.circle(30*mm, 30*mm, 42*mm, fill=1, stroke=0)
        if stage_note:
            canvas.setFillColor(HexColor('#8B1A1A'))
            canvas.rect(0, 12*mm, W_PAGE, 8*mm, fill=1, stroke=0)
            canvas.setFont('Helvetica-Bold', 8.5)
            canvas.setFillColor(HexColor('#FFCCCC'))
            canvas.drawCentredString(W_PAGE / 2, 14.8*mm,
                f'DECISION WINDOW  —  {stage_note}')
        canvas.restoreState()
    return first_page


def _make_later_pages(headline):
    def later_pages(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_PURPLE)
        canvas.rect(0, H_PAGE - 10*mm, W_PAGE, 10*mm, fill=1, stroke=0)
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(HexColor('#C7C4F0'))
        canvas.drawString(20*mm, H_PAGE - 6.5*mm, 'CareerShifu')
        canvas.setFont('Helvetica', 8)
        canvas.drawRightString(W_PAGE - 20*mm, H_PAGE - 6.5*mm, headline)
        canvas.setFillColor(HexColor('#F3F4F6'))
        canvas.rect(0, 0, W_PAGE, 8*mm, fill=1, stroke=0)
        canvas.setFont('Helvetica', 7.5); canvas.setFillColor(C_MUTED)
        canvas.drawCentredString(W_PAGE / 2, 3*mm,
            f'Page {doc.page}  ·  Confidential — for student use only  ·  CareerShifu 2025')
        canvas.restoreState()
    return later_pages


# ── Helper primitives ─────────────────────────────────────────────────────────────
def sp(pts=6):
    return Spacer(1, pts)


def section_divider(items, label):
    items.append(sp(4))
    items.append(HRFlowable(width='100%', thickness=0.5, color=C_RULE, spaceAfter=5))
    items.append(Paragraph(label.upper(), S['section_label']))


def career_header(label):
    """Thin purple rule above a sub-section label."""
    return [
        sp(12),
        HRFlowable(width='100%', thickness=0.5, color=C_PURPLE_BORDER, spaceAfter=6),
        Paragraph(label, S['career_h3']),
    ]


def callout_box(story, title, body,
                bg=C_GREEN_BG, border=C_GREEN_BORDER, text_color=C_GREEN_TEXT):
    ts = ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=10,
        textColor=text_color, leading=14, spaceAfter=3)
    bs = ParagraphStyle('cb', fontName='Helvetica', fontSize=9,
        textColor=text_color, leading=13)
    t = Table([[Paragraph(title, ts)], [Paragraph(body, bs)]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), bg),
        ('BOX',           (0, 0), (-1, -1), 0.8, border),
        ('TOPPADDING',    (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ]))
    story.append(t)
    story.append(sp(8))


def urgency_box(story, text):
    t = Table([[Paragraph(text, S['urgency'])]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_URGENCY_BG),
        ('BOX',           (0, 0), (-1, -1), 0.8, C_URGENCY_BORDER),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
    ]))
    story.append(t)
    story.append(sp(8))


def amber_note(items, text):
    ds = ParagraphStyle('da', fontName='Helvetica', fontSize=8,
        textColor=C_AMBER_TEXT, leading=11)
    t = Table([[Paragraph(text, ds)]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_AMBER_BG),
        ('BOX',           (0, 0), (-1, -1), 0.5, HexColor('#E8C97A')),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
    ]))
    items.append(t)
    items.append(sp(6))


def _demand_pct(demand_text: str) -> int:
    t = demand_text.lower()
    if 'very high' in t: return 90
    if 'high' in t:      return 78
    if 'growing' in t:   return 65
    if 'moderate' in t:  return 55
    return 50


# ── Career block builders ─────────────────────────────────────────────────────────
# Rule: KeepTogether only on the salary table block and the 30-day box + counsellor nudge.
# All text sections (paths, stream guidance, degrees, internships) flow freely.

def _block_fit(domain, career_data, section_label):
    items = []
    section_divider(items, section_label)
    items.append(Paragraph(domain['name'], S['h1']))
    items.append(sp(6))
    items.append(Paragraph('Why this fits you', S['h3']))
    fit = career_data.get('fit_rationale', '')
    if fit:
        items.append(Paragraph(fit, S['body']))
    return items


def _block_paths(career_data):
    paths = career_data.get('paths', [])
    if not paths:
        return []
    items = career_header('Paths within this domain')
    _demand_colors = {'Strong': '#1D9E75', 'Moderate': '#C97A00', 'Niche': '#888888'}
    for p in paths[:6]:
        demand = p.get('demand', '')
        color = _demand_colors.get(demand, '')
        demand_tag = f' <font color="{color}" size="8">({demand})</font>' if demand and color else ''
        items.append(Paragraph(f'&#8250;  {p["name"]}{demand_tag}', S['role_title']))
        items.append(Paragraph(p.get('description', ''), S['role_desc']))
    return items


def _block_stream(career_data):
    sg = career_data.get('stream_guidance') or ''
    if not sg:
        return []
    items = career_header('Stream and subject guidance')
    items.append(Paragraph(sg, S['body']))
    return items


def _block_degrees(career_data, is_undergrad):
    key = 'postgrad_degrees' if is_undergrad else 'ug_degrees'
    degrees = career_data.get(key, [])
    if not degrees:
        return []
    label = 'Postgraduate degrees to consider' if is_undergrad else 'Undergraduate degrees to consider'
    items = career_header(label)
    for d in degrees[:6]:
        items.append(Paragraph(f'&#8250;  {d["name"]}', S['ug_title']))
        note = d.get('note', '')
        if note:
            items.append(Paragraph(note, S['ug_note']))
    amber_note(items,
        'Guidance reflects general pathways across boards. '
        'Your counsellor will personalise this for your specific board, '
        'location and current subjects on the call.')
    return items


def _block_market(market):
    header = career_header('Market demand and salary')

    hs    = ParagraphStyle('dh', fontName='Helvetica-Bold', fontSize=8, textColor=C_MUTED, leading=11)
    dl_s  = ParagraphStyle('dl', fontName='Helvetica',      fontSize=8, textColor=C_MUTED, leading=11)
    sal_s = ParagraphStyle('ss', fontName='Helvetica-Bold', fontSize=8, textColor=C_MUTED, leading=11)
    sal_v = ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=12, textColor=C_PURPLE_TEXT, leading=15)

    visual = [
        Paragraph('DEMAND', hs),
        sp(3),
        DemandBar(_demand_pct(market.get('demand', '')), width=FULL_W),
        sp(4),
        Paragraph(market.get('demand', ''), dl_s),
        sp(10),
    ]

    sal_data = [
        [Paragraph('ENTRY',       sal_s),
         Paragraph('MID-CAREER',  sal_s),
         Paragraph('TOP EARNERS', sal_s)],
        [Paragraph(market.get('entry_salary', ''),      sal_v),
         Paragraph(market.get('mid_career_salary', ''), sal_v),
         Paragraph(market.get('top_salary', ''),        sal_v)],
    ]
    st = Table(sal_data, colWidths=[56*mm, 60*mm, 54*mm])
    st.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), HexColor('#F9F8FF')),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('LINEAFTER',     (0, 0), (1, -1),  0.5, C_RULE),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))
    visual.append(st)
    visual.append(sp(4))
    visual.append(Paragraph(SALARY_DISCLAIMER, S['small_muted']))
    visual.append(sp(6))

    return header + [KeepTogether(visual)]


def _block_internships(internships):
    if not internships:
        return []
    items = career_header('Internships to target in the next 12 months')
    rs = ParagraphStyle('ir', fontName='Helvetica-Bold', fontSize=9,
        textColor=C_PURPLE_TEXT, leading=13)
    ws = ParagraphStyle('iw', fontName='Helvetica', fontSize=9,
        textColor=C_MUTED, leading=13)
    rows = [
        [Paragraph(e.get('name', ''), rs), Paragraph(e.get('how', ''), ws)]
        for e in internships[:4]
    ]
    intern_t = Table(rows, colWidths=[62*mm, 108*mm])
    intern_t.setStyle(TableStyle([
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [HexColor('#F9FAFB'), C_WHITE]),
        ('TOPPADDING',     (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING',  (0, 0), (-1, -1), 7),
        ('LEFTPADDING',    (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',   (0, 0), (-1, -1), 8),
        ('LINEBELOW',      (0, 0), (-1, -2), 0.5, C_RULE),
        ('VALIGN',         (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    items.append(intern_t)
    items.append(sp(4))
    items.append(Paragraph(
        'Find these on Internshala, LinkedIn and Unstop. '
        'For research and project roles, a direct email works better than a portal application.',
        S['small_muted']))
    items.append(sp(8))
    return items


def _block_thirty_day(next_30):
    if not next_30:
        return []
    header = career_header('Your next 30 days')
    et = Table([[Paragraph(next_30, S['body_muted'])]], colWidths=[FULL_W])
    et.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_PURPLE_LIGHT),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
        ('TOPPADDING',    (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINEAFTER',     (0, 0), (0, -1),  3, C_PURPLE),
    ]))
    return [KeepTogether(header + [et, sp(10), CounsellorNudge(width=FULL_W)])]


def _career_block(story, domain, career_data, internships, next_30,
                  section_label, is_undergrad):
    story.extend(_block_fit(domain, career_data, section_label))
    story.extend(_block_paths(career_data))
    story.extend(_block_stream(career_data))
    story.extend(_block_degrees(career_data, is_undergrad))
    story.extend(_block_internships(internships))
    story.extend(_block_thirty_day(next_30))
    story.append(PageBreak())


# ── Page sections ──────────────────────────────────────────────────────────────────

def _build_cover(ctx):
    grade    = ctx.get('grade', '')
    headline = ctx.get('headline', '')
    bucket   = ctx.get('bucket', '')
    domains  = ctx.get('domains', [])
    domain_names = '\n'.join(d['name'] for d in domains[:3])

    story = [sp(38 * mm)]
    story.append(Paragraph('CareerShifu', S['cover_logo']))
    story.append(Paragraph('Your personalised career report', S['cover_tagline']))
    story.append(sp(18 * mm))
    story.append(Paragraph(headline, S['cover_name']))
    story.append(sp(3))
    story.append(Paragraph(f'{grade}  ·  {bucket}', S['cover_grade']))
    story.append(sp(8 * mm))
    story.append(HRFlowable(width='100%', thickness=0.5,
        color=HexColor('#6060A0'), spaceAfter=8))

    col_data = [
        [Paragraph('PROFILE TYPE', S['cover_label']),
         Paragraph('TOP DOMAINS',  S['cover_label']),
         Paragraph('GRADE STAGE',  S['cover_label'])],
        [Paragraph(bucket,         S['cover_val']),
         Paragraph(domain_names,   S['cover_val']),
         Paragraph(grade,          S['cover_val'])],
    ]
    t = Table(col_data, colWidths=[52*mm, 65*mm, 43*mm])
    t.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
    ]))
    story.append(t)
    story.append(sp(22 * mm))
    story.append(Paragraph('3 careers  ·  Personalised  ·  2025', S['cover_tagline']))
    story.append(PageBreak())
    return story


def _build_about(ctx):
    from prompts import DECISION_WINDOW_GRADES
    is_dw = ctx.get('grade', '') in DECISION_WINDOW_GRADES

    story = []
    header = []
    section_divider(header, 'About this report')
    header.append(Paragraph('What is inside', S['h1']))
    story.append(KeepTogether(header))

    if is_dw:
        urgency_box(story,
            'You are in Class 11 or 12. Stream choices, subject selections and your first '
            'internship all happen in the next 12 to 18 months. This report is designed to '
            'help you make those choices deliberately, not by default.')

    callout_box(story, 'Guided session available',
        'Want help making sense of this report? Message us on WhatsApp at [WhatsApp Number] '
        'to schedule a session. It is not a sales call.')

    items_list = [
        ('Your thinking style',
         'How you process information and where you do your best work'),
        ('Your strengths and blind spots',
         'Drawn directly from your answers, not a generic template'),
        ('Three career deep-dives',
         'Each career covered fully: fit, paths, stream guidance, degrees, '
         'internships and your first 30 days'),
        ('Parent summary',
         'So they understand your direction without you having to explain everything'),
    ]
    for pri, sec in items_list:
        ps = ParagraphStyle('bp', fontName='Helvetica-Bold', fontSize=10,
            textColor=C_PURPLE_TEXT, leading=15, spaceAfter=1)
        ss = ParagraphStyle('bs', fontName='Helvetica', fontSize=9,
            textColor=C_MUTED, leading=13, spaceAfter=6)
        story.append(Paragraph(f'&#8227;  {pri}', ps))
        story.append(Paragraph(f'    {sec}', ss))

    story.append(PageBreak())
    return story


def _build_thinking(data):
    ts          = data.get('thinking_style', {})
    strengths   = data.get('strengths', [])
    blind_spots = data.get('blind_spots', [])

    story = []

    # Section 1 — thinking style
    s1_header = []
    section_divider(s1_header, 'Section 1 — Your thinking style')
    s1_header.append(Paragraph('How You Think', S['h1']))
    story.append(KeepTogether(s1_header))
    story.append(sp(4))
    for key in ('para1', 'para2'):
        text = ts.get(key, '')
        if text:
            story.append(Paragraph(text, S['body']))
            story.append(sp(6))

    story.append(PageBreak())

    # Section 2 — strengths and blind spots
    s2_header = []
    section_divider(s2_header, 'Section 2 — Strengths and blind spots')
    s2_header.append(Paragraph('What your answers showed', S['h1']))
    s2_header.append(Paragraph('Your strengths', S['h2']))
    story.append(KeepTogether(s2_header))

    for s in strengths:
        if ' — ' in s:
            title, desc = s.split(' — ', 1)
        else:
            title, desc = s, ''
        story.append(KeepTogether([
            Paragraph(f'<b>&#8227;  {title}</b>', S['bold']),
            Paragraph(f'    {desc}', S['body_muted']),
            sp(4),
        ]))

    story.append(sp(6))
    story.append(Paragraph('Areas to watch', S['h2']))
    for b in blind_spots:
        if ' — ' in b:
            title, desc = b.split(' — ', 1)
        else:
            title, desc = b, ''
        story.append(KeepTogether([
            Paragraph(f'<b>&#8227;  {title}</b>', S['bold']),
            Paragraph(f'    {desc}', S['body_muted']),
            sp(4),
        ]))

    story.append(PageBreak())
    return story


def _build_parent(data, ctx):
    story = []
    ps_header = []
    section_divider(ps_header, 'Parent summary')
    ps_header.append(Paragraph('For parents to read', S['h1']))
    story.append(KeepTogether(ps_header))

    callout_box(story, 'This page is written for you.',
        'The rest of the report is written for your child. This page is for you.',
        bg=C_PURPLE_LIGHT, border=C_PURPLE_BORDER, text_color=C_PURPLE_TEXT)

    for key in ('para1', 'para2', 'para3'):
        text = data.get(key, '')
        if text:
            story.append(Paragraph(text, S['body']))
            story.append(sp(6))

    story.append(sp(8))
    callout_box(story, 'Want a guided session?', COUNSELLOR_CALLOUT)
    return story


def _build_what_next():
    story = [PageBreak()]
    whn_header = []
    section_divider(whn_header, 'What happens next')
    whn_header.append(Paragraph('Three things to do now', S['h1']))
    story.append(KeepTogether(whn_header))
    story.append(sp(8))

    steps = [
        ('Read the career that pulled you most',
         'Not the most impressive one. The one where you felt something while reading it. '
         'Go back to that chapter and read the 30-day step at the end.'),
        ('Do the 30-day step for that career',
         'It is one specific action. It takes less than an hour to start. '
         'Do not wait until you feel ready.'),
        ('Reach out if you want guidance',
         'Message us on WhatsApp at [WhatsApp Number] to schedule a session. '
         'Bring one question about this report and your next steps.'),
    ]
    for num, (title, body) in enumerate(steps, 1):
        ns = ParagraphStyle('sn', fontName='Helvetica-Bold',
            fontSize=18, textColor=C_PURPLE, leading=22)
        dt = Table(
            [[Paragraph(str(num), ns),
              [Paragraph(title, S['h3']), Paragraph(body, S['body'])]]],
            colWidths=[16*mm, 154*mm],
        )
        dt.setStyle(TableStyle([
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING',    (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ]))
        story.append(dt)
        story.append(sp(8))

    story.append(sp(12))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_RULE, spaceAfter=8))
    story.append(Paragraph(
        'CareerShifu 2025  ·  Confidential, for the student named on the cover only.  '
        'Guidance reflects general pathways across boards. '
        'Specific college options, entrance exams and cutoffs can be explored '
        'in a guided session — message us on WhatsApp to schedule.',
        S['small_muted']))
    return story


# ── Entry point ───────────────────────────────────────────────────────────────────

def build_pdf(ctx: dict, content: dict) -> bytes:
    """Render the full PDF and return as bytes."""
    from prompts import DECISION_WINDOW_GRADES, UNDERGRAD_GRADES

    grade        = ctx.get('grade', '')
    headline     = ctx.get('headline', '')
    is_dw        = grade in DECISION_WINDOW_GRADES
    is_undergrad = grade in UNDERGRAD_GRADES
    domains      = ctx.get('domains', [])

    stage_note = (
        '12 to 18 months to make subject and application choices that matter'
        if is_dw else ''
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=16 * mm,
        bottomMargin=14 * mm,
        title=f'CareerShifu — {headline}',
        author='CareerShifu',
    )

    story = []
    story.extend(_build_cover(ctx))
    story.extend(_build_about(ctx))
    story.extend(_build_thinking(content.get('thinking_and_strengths', {})))

    internships_all = content.get('internships', {})
    next_30_all     = content.get('next_30_days', {})

    for i, domain in enumerate(domains[:3]):
        key          = f'domain_{i + 1}'
        career_data  = content.get(f'career_{i + 1}', {})
        internships  = internships_all.get(key, [])
        next_30      = next_30_all.get(key, '')
        section_label = f'Career {i + 1} of {min(len(domains), 3)} — {domain["name"]}'

        _career_block(story, domain, career_data, internships, next_30,
                      section_label, is_undergrad)

    story.extend(_build_parent(content.get('parent_summary', {}), ctx))
    story.extend(_build_what_next())

    doc.build(
        story,
        onFirstPage=_make_first_page(headline, stage_note),
        onLaterPages=_make_later_pages(headline),
    )
    return buf.getvalue()
