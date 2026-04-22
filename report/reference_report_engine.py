from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus.flowables import Flowable
import os

# ── Colours ────────────────────────────────────────────────────────────────────
C_PURPLE        = colors.HexColor("#3C3489")
C_PURPLE_LIGHT  = colors.HexColor("#EEEDFE")
C_PURPLE_TEXT   = colors.HexColor("#26215C")
C_PURPLE_BORDER = colors.HexColor("#7F77DD")
C_GREEN         = colors.HexColor("#1D9E75")
C_GREEN_BG      = colors.HexColor("#E1F5EE")
C_GREEN_BORDER  = colors.HexColor("#9FE1CB")
C_GREEN_TEXT    = colors.HexColor("#085041")
C_AMBER_BG      = colors.HexColor("#FAEEDA")
C_AMBER_TEXT    = colors.HexColor("#633806")
C_MUTED         = colors.HexColor("#6B7280")
C_BODY          = colors.HexColor("#1F1F2E")
C_RULE          = colors.HexColor("#E5E7EB")
C_WHITE         = colors.white
C_URGENCY_BG    = colors.HexColor("#FFF4F4")
C_URGENCY_BORDER= colors.HexColor("#F9BCBC")
C_URGENCY_TEXT  = colors.HexColor("#8B1A1A")

W, H   = A4
FULL_W = 170*mm

# ── Styles ─────────────────────────────────────────────────────────────────────
def make_styles():
    return {
        "section_label": ParagraphStyle("sl", fontName="Helvetica-Bold",
            fontSize=8, textColor=C_PURPLE, leading=10, spaceAfter=5, letterSpacing=0.8),
        "h1":  ParagraphStyle("h1", fontName="Helvetica-Bold",
            fontSize=19, textColor=C_PURPLE_TEXT, leading=24, spaceAfter=4),
        "h2":  ParagraphStyle("h2", fontName="Helvetica-Bold",
            fontSize=13, textColor=C_PURPLE_TEXT, leading=17, spaceAfter=3, spaceBefore=8),
        "h3":  ParagraphStyle("h3", fontName="Helvetica-Bold",
            fontSize=10, textColor=C_PURPLE_TEXT, leading=14, spaceAfter=3, spaceBefore=6),
        "career_h3": ParagraphStyle("ch3", fontName="Helvetica-Bold",
            fontSize=12, textColor=C_PURPLE, leading=16, spaceAfter=6, spaceBefore=2),
        "body": ParagraphStyle("body", fontName="Helvetica",
            fontSize=10, textColor=C_BODY, leading=15, spaceAfter=5),
        "body_muted": ParagraphStyle("bm", fontName="Helvetica",
            fontSize=9, textColor=C_MUTED, leading=13, spaceAfter=4),
        "bold": ParagraphStyle("bold", fontName="Helvetica-Bold",
            fontSize=10, textColor=C_PURPLE_TEXT, leading=15, spaceAfter=2),
        "small_muted": ParagraphStyle("sm", fontName="Helvetica",
            fontSize=8, textColor=C_MUTED, leading=11),
        "urgency": ParagraphStyle("urg", fontName="Helvetica-Bold",
            fontSize=9, textColor=C_URGENCY_TEXT, leading=13),
        "role_title": ParagraphStyle("rt", fontName="Helvetica-Bold",
            fontSize=10, textColor=C_PURPLE_TEXT, leading=14, spaceAfter=1),
        "role_desc": ParagraphStyle("rd", fontName="Helvetica",
            fontSize=9, textColor=C_MUTED, leading=13, spaceAfter=8),
        "ug_title": ParagraphStyle("ut", fontName="Helvetica-Bold",
            fontSize=9.5, textColor=C_PURPLE_TEXT, leading=13, spaceAfter=1),
        "ug_note": ParagraphStyle("un", fontName="Helvetica",
            fontSize=8.5, textColor=C_MUTED, leading=12, spaceAfter=6),
        "cover_logo":    ParagraphStyle("clo", fontName="Helvetica-Bold",
            fontSize=15, textColor=C_WHITE, leading=20, spaceAfter=3),
        "cover_tagline": ParagraphStyle("cta", fontName="Helvetica",
            fontSize=9, textColor=colors.HexColor("#A89FF5"), leading=13),
        "cover_name":    ParagraphStyle("cn", fontName="Helvetica-Bold",
            fontSize=27, textColor=C_WHITE, leading=33, spaceAfter=6),
        "cover_grade":   ParagraphStyle("cg", fontName="Helvetica",
            fontSize=13, textColor=colors.HexColor("#C7C4F0"), leading=18),
        "cover_label":   ParagraphStyle("cl", fontName="Helvetica-Bold",
            fontSize=8, textColor=colors.HexColor("#A89FF5"), leading=12,
            spaceAfter=2, spaceBefore=14),
        "cover_val":     ParagraphStyle("cv", fontName="Helvetica",
            fontSize=11, textColor=C_WHITE, leading=15),
    }

S = make_styles()

# ── Student data ───────────────────────────────────────────────────────────────
STUDENT = {
    "headline":    "Story-driven explorer of human nature",
    "grade":       "Class 11 or 12",
    "stage":       "Decision Window",
    "stage_note":  "12 to 18 months to make subject and application choices that matter",
    "traits": [
        ("Analytical reasoning", 84),
        ("Curiosity and depth",  80),
        ("Empathy",              74),
        ("Resilience",           70),
        ("Social energy",        55),
    ],
    "thinking_style": (
        "You are drawn to understanding why people think and behave the way they do, "
        "and you want real skill at something specific — not a vague sense of direction. "
        "You go deep on topics that matter to you rather than spreading thin across many things. "
        "When you worked through the reasoning questions, you traced the argument step by step "
        "rather than going with instinct. That combination of curiosity, structure and empathy "
        "is exactly what research, journalism and systems-level work rewards."
    ),
    "strengths": [
        ("Goes deep on what interests you",
         "You follow a topic for hours without noticing time passing. "
         "That focus is rare and it is the starting point for doing anything well."),
        ("Strong logical reasoning",
         "You worked through the reasoning questions carefully and got them right. "
         "You think in structured steps, which shows up whenever you need to make a case or solve a problem."),
        ("Stays the course through difficulty",
         "You admire people who handle failure and keep going, and you do the same. "
         "You feel it, then figure out what to do differently. That is how good work gets built."),
        ("Listens before speaking",
         "You hear all sides before you say anything. "
         "In careers that depend on understanding people, that is a genuine professional skill."),
        ("Honest about what you want",
         "Freedom and real skill both matter to you. "
         "You are not performing idealism. That honesty will help you make better decisions."),
    ],
    "blindspots": [
        ("Waiting until it feels right",
         "You let things sit before you start. That instinct can serve you in slow, careful work — "
         "but in fast-moving fields like journalism or startups, it will cost you opportunities."),
        ("Narrow social investment",
         "You go deep with one or two people rather than wide. "
         "In research and media, the person you know loosely is often the one who opens the door."),
        ("Distraction under pressure",
         "When you feel pressure, you get distracted and try to refocus rather than push through. "
         "Understanding what specifically breaks your concentration will help you manage it."),
    ],
}

CAREERS = [
    {
        "title":   "Human-centered Research and Storytelling",
        "section": "Career 1 of 3",
        "fit": (
            "Your curiosity about why people behave the way they do, combined with how you read "
            "and create across multiple forms, points clearly toward careers where you investigate "
            "human behaviour and then communicate what you found. "
            "You are already doing the foundational work — going deep on things that matter, "
            "listening carefully, noticing what others miss. "
            "The question is which format you want to do it in."
        ),
        "paths": [
            ("Journalist or reporter",
             "You pick a beat — politics, health, business, crime — and cover it every week. "
             "Most of the job is getting people to talk honestly. The writing is the last part."),
            ("Long-form or features writer",
             "You spend weeks on a single story, read everything written about the subject, "
             "talk to everyone involved, and write a piece that gives the full picture."),
            ("UX researcher",
             "You talk to real users of a product, find the problem the design team has not "
             "spotted yet, and make the case for fixing it clearly enough that they act on it."),
            ("Documentary filmmaker",
             "You spend months researching and building access before you turn on a camera. "
             "The footage is the last thing you gather, not the first."),
            ("Psychology researcher",
             "You spend months designing a study, run it with real people, "
             "and then work out what the results actually mean. One careful study can take two years."),
            ("Social anthropologist",
             "You spend enough time inside a community that people stop acting differently around you. "
             "That is when the real observations become possible."),
        ],
        "stream": (
            "A humanities stream is the most direct path — English, History, Political Science "
            "and Psychology are all relevant. A science stream does not close this off. "
            "Psychology and sociology programmes at many universities accept students from any stream. "
            "If you are still choosing subjects, keeping a language and a social science "
            "alongside your core subjects will help."
        ),
        "ug_degrees": [
            ("Bachelor of Arts in Journalism and Mass Communication",
             "The most direct route into print, digital and broadcast journalism. "
             "Covers reporting, editing, media law and production."),
            ("Bachelor of Mass Media (BMM)",
             "Broader than journalism — covers advertising, PR and digital media alongside reporting. "
             "Useful if you want flexibility across media roles."),
            ("Bachelor of Arts in English or Humanities",
             "Builds the reading, writing and critical thinking that underpin all storytelling work. "
             "Strong for long-form writing, content strategy and editorial careers."),
            ("Bachelor of Arts or Science in Psychology",
             "The entry point for research-based careers and UX research roles. "
             "Opens postgraduate paths in clinical, organisational and cognitive psychology."),
            ("Bachelor of Arts in Sociology",
             "Useful for documentary work, social journalism and policy research. "
             "Builds understanding of how communities and systems work."),
            ("Bachelor of Design in Communication Design",
             "For students who want to combine storytelling with visual work — "
             "editorial design, infographics, interactive media."),
        ],
        "demand_pct":   78,
        "demand_label": "High demand, growing consistently",
        "sal_entry":    "Rs. 5 to 10 lakh",
        "sal_mid":      "Rs. 12 to 22 lakh",
        "sal_senior":   "Rs. 25 to 50 lakh and above",
        "sal_roles":    ("Jr journalist, research associate",
                         "Senior writer, UX research lead",
                         "Editor, research director"),
        "internships": [
            ("Journalism intern",
             "Online publications, newsletters, local news platforms"),
            ("Research assistant",
             "University departments, think tanks, policy organisations"),
            ("Video research volunteer",
             "Independent filmmakers, YouTube journalists"),
            ("UX research volunteer",
             "Early-stage startups that need user feedback"),
        ],
        "thirty_day": (
            "Read one long-form journalism or research piece this week. "
            "Write 200 words on how the writer investigated their subject — "
            "not just what they found, but how they went about finding it. "
            "Then find one person working in this space and send them "
            "one specific question by email."
        ),
    },
    {
        "title":   "Building and Scaling Ideas from the Ground Up",
        "section": "Career 2 of 3",
        "fit": (
            "You value freedom and want to be genuinely skilled at something. "
            "You admire people who handle failure and keep going — and you do the same. "
            "That combination shows up in people who do well in early-stage startups and "
            "product roles, not because they never struggle, but because they stay committed "
            "to a problem through the difficult early stages when most people step back."
        ),
        "paths": [
            ("Startup founder",
             "You make ten decisions before lunch, most without enough information, "
             "and you live with what happens next. The work never looks the same two weeks in a row."),
            ("Product manager",
             "You sit between the engineers, the designers and the business side "
             "and decide what gets built first. Every decision involves trade-offs with no clean answer."),
            ("Business analyst",
             "Organisations bring you in when they do not know what is wrong. "
             "You figure it out and say it plainly, usually to people who did not want to hear it."),
            ("Growth strategist",
             "You find the one thing that will move the number that matters "
             "and focus on it harder than everyone else in the room."),
            ("Early-stage operator",
             "You handle everything the founder should not be spending time on "
             "so they can focus on what only they can do."),
            ("Innovation consultant",
             "You help large organisations move faster. "
             "Most of the job is working with the people inside who resist the change."),
        ],
        "stream": (
            "This path works with any stream at undergraduate level. "
            "Strong people in startups and product come from engineering, commerce, "
            "economics and humanities equally. "
            "What matters more than stream is whether you actively seek out "
            "real problems to solve during your undergraduate years. "
            "Commerce and economics give you a head start on business fundamentals "
            "but are not a requirement."
        ),
        "ug_degrees": [
            ("Bachelor of Business Administration (BBA)",
             "The most direct undergraduate route into business and startup roles. "
             "Covers management, finance, marketing and strategy."),
            ("Bachelor of Arts in Economics",
             "Strong analytical foundation. Useful for strategy, consulting and policy roles "
             "as well as startup and product paths."),
            ("Bachelor of Technology (any branch)",
             "Opens the widest range of startup and product roles. "
             "Engineering background is not required but gives you credibility in tech environments."),
            ("Bachelor of Science in Statistics or Data Science",
             "Increasingly useful for growth, product analytics and business analysis roles "
             "across any industry."),
            ("Integrated Programme in Management (IPM)",
             "A five-year BBA plus MBA offered at a small number of institutions. "
             "Strong preparation for consulting and general management careers."),
            ("Bachelor of Commerce (BCom)",
             "Solid foundation in accounting, finance and business. "
             "Often paired with CA or MBA preparation."),
        ],
        "demand_pct":   88,
        "demand_label": "Very high demand across sectors",
        "sal_entry":    "Rs. 8 to 14 lakh",
        "sal_mid":      "Rs. 18 to 35 lakh",
        "sal_senior":   "Rs. 40 lakh and above, with equity upside in startups",
        "sal_roles":    ("Startup associate, junior analyst",
                         "Product manager, strategy lead",
                         "Founder, VP Product, Director"),
        "internships": [
            ("Startup operations intern",
             "Early-stage startups — search Internshala and LinkedIn"),
            ("Founder's assistant",
             "Solo founders who need an extra pair of hands"),
            ("Growth or marketing intern",
             "Consumer brands, SaaS companies, mobile apps"),
            ("Business research intern",
             "Consulting firms, market research companies"),
        ],
        "thirty_day": (
            "Listen to one founder interview this week. "
            "Write down the specific failure they described and the one thing they changed because of it. "
            "Then find one early-stage startup and send a short email offering to help with "
            "anything they need. You do not need a resume to do this."
        ),
    },
    {
        "title":   "Data-driven Social Change and Policy",
        "section": "Career 3 of 3",
        "fit": (
            "You are good with logic and structured reasoning, you care about understanding "
            "human behaviour, and you want work that has a real effect on how systems work. "
            "This domain puts all three together. "
            "It is smaller than the other two paths but it is growing, "
            "and the combination of analytical thinking and genuine curiosity about people "
            "is exactly what this work needs."
        ),
        "paths": [
            ("Policy researcher or analyst",
             "You write recommendations knowing they could change how a programme runs "
             "for thousands of people, or be filed away and never read. Both outcomes are possible."),
            ("Data analyst for an NGO or think tank",
             "You take messy information gathered from the field "
             "and turn it into something a decision-maker can actually use."),
            ("Behavioural economist",
             "You test whether changing how a choice is shown to people changes what they decide, "
             "then use that finding to design better systems."),
            ("Civic technologist",
             "You build tools that help governments or communities do things "
             "they currently do slowly, badly or not at all."),
            ("Programme evaluator",
             "You go into a social programme after it has run and find out "
             "honestly whether it worked and why."),
            ("Research scientist in social science",
             "You spend years on a question that most people do not even know needs asking yet."),
        ],
        "stream": (
            "Economics and Political Science are the most useful subjects for this path. "
            "Sociology and Statistics are also directly relevant. "
            "If you are in a science stream, Mathematics and Statistics give you a strong "
            "base for the data and research side of this work. "
            "Most postgraduate programmes in public policy and economics expect either "
            "an Economics background or a strong quantitative one — so the subjects you "
            "choose now shape your options later."
        ),
        "ug_degrees": [
            ("Bachelor of Arts in Economics",
             "The most direct route into policy research and behavioural economics. "
             "Strong quantitative foundation and widely accepted for postgraduate programmes."),
            ("Bachelor of Arts in Political Science or Public Administration",
             "Useful for policy research, civic technology and government roles. "
             "Often combined with Economics or Sociology."),
            ("Bachelor of Arts in Sociology",
             "Strong foundation for programme evaluation, NGO research and social impact roles."),
            ("Bachelor of Science in Statistics or Data Science",
             "Opens the data analyst and quantitative research side of this domain. "
             "Increasingly sought by think tanks and policy organisations."),
            ("Bachelor of Arts in Psychology",
             "Entry point for behavioural economics and human-centred policy design. "
             "Useful alongside an economics or statistics minor."),
            ("Bachelor of Technology in Computer Science",
             "Opens civic technology and data-driven policy roles. "
             "Many civic tech organisations actively look for people with both technical "
             "and social science backgrounds."),
        ],
        "demand_pct":   55,
        "demand_label": "Moderate but growing, high meaning",
        "sal_entry":    "Rs. 5 to 9 lakh",
        "sal_mid":      "Rs. 12 to 20 lakh",
        "sal_senior":   "Rs. 22 to 40 lakh, higher at international organisations",
        "sal_roles":    ("Research assistant, data analyst",
                         "Policy analyst, programme officer",
                         "Research director, senior policy advisor"),
        "internships": [
            ("Research volunteer",
             "University research labs, public health organisations"),
            ("NGO data and content intern",
             "Social enterprises, impact organisations"),
            ("Policy research intern",
             "Think tanks, electoral trusts, civic organisations"),
            ("Data analysis intern",
             "Market research firms, analytics startups"),
        ],
        "thirty_day": (
            "Search for one example of how a researcher used a small change "
            "in how a choice was shown to people to get a better outcome. "
            "Try searching behavioural nudge in education or health. "
            "Read the full case. Write three questions it raises for you. "
            "Those questions are your starting point."
        ),
    },
]

# ── Flowables ──────────────────────────────────────────────────────────────────
class TraitBar(Flowable):
    def __init__(self, label, value, width=FULL_W):
        super().__init__()
        self.label, self.value, self.bar_w = label, value, width
    def wrap(self, aw, ah): return self.bar_w, 20
    def draw(self):
        c = self.canv
        c.setFont("Helvetica-Bold", 9); c.setFillColor(C_PURPLE_TEXT)
        c.drawString(0, 7, self.label)
        c.setFont("Helvetica", 9); c.setFillColor(C_MUTED)
        c.drawRightString(self.bar_w, 7, f"{self.value}%")
        tx, tw = 100, self.bar_w - 125
        c.setFillColor(C_PURPLE_LIGHT)
        c.roundRect(tx, 3, tw, 6, 3, fill=1, stroke=0)
        c.setFillColor(C_PURPLE)
        c.roundRect(tx, 3, tw * self.value / 100, 6, 3, fill=1, stroke=0)

class DemandBar(Flowable):
    def __init__(self, pct, width=FULL_W):
        super().__init__()
        self.pct, self.bar_w = pct, width
    def wrap(self, aw, ah): return self.bar_w, 10
    def draw(self):
        c = self.canv
        c.setFillColor(colors.HexColor("#F3F4F6"))
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
        c.setFont("Helvetica", 8.5); c.setFillColor(C_MUTED)
        c.drawString(16, 6, "Have questions about this career section?")
        c.setFillColor(C_GREEN)
        lx = self.nudge_w - 62
        c.drawString(lx, 6, "WhatsApp us")
        c.setStrokeColor(C_GREEN); c.setLineWidth(0.5)
        tw = c.stringWidth("WhatsApp us", "Helvetica", 8.5)
        c.line(lx, 4.5, lx + tw, 4.5)

# ── Page templates ─────────────────────────────────────────────────────────────
def first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(C_PURPLE)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#4A44A0"))
    canvas.circle(W - 28*mm, H - 38*mm, 58*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#5550B0"))
    canvas.circle(W - 8*mm, H - 78*mm, 28*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#302A80"))
    canvas.circle(30*mm, 30*mm, 42*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#8B1A1A"))
    canvas.rect(0, 12*mm, W, 8*mm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(colors.HexColor("#FFCCCC"))
    canvas.drawCentredString(W / 2, 14.8*mm,
        f"DECISION WINDOW  —  {STUDENT['stage_note']}")
    canvas.restoreState()

def later_pages(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(C_PURPLE)
    canvas.rect(0, H - 10*mm, W, 10*mm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#C7C4F0"))
    canvas.drawString(20*mm, H - 6.5*mm, "CareerShifu")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(W - 20*mm, H - 6.5*mm, STUDENT["headline"])
    canvas.setFillColor(colors.HexColor("#F3F4F6"))
    canvas.rect(0, 0, W, 8*mm, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(C_MUTED)
    canvas.drawCentredString(W / 2, 3*mm,
        f"Page {doc.page}  ·  Confidential — for student use only  ·  CareerShifu 2025")
    canvas.restoreState()

# ── Helpers ────────────────────────────────────────────────────────────────────
def section_divider(items, label):
    items.append(Spacer(1, 4))
    items.append(HRFlowable(width="100%", thickness=0.5, color=C_RULE, spaceAfter=5))
    items.append(Paragraph(label.upper(), S["section_label"]))

def career_header(label):
    return [
        Spacer(1, 12),
        HRFlowable(width="100%", thickness=0.5, color=C_PURPLE_BORDER, spaceAfter=6),
        Paragraph(label, S["career_h3"]),
    ]

def callout_box(story, title, body,
                bg=C_GREEN_BG, border=C_GREEN_BORDER, text_color=C_GREEN_TEXT):
    ts = ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=10,
        textColor=text_color, leading=14, spaceAfter=3)
    bs = ParagraphStyle("cb", fontName="Helvetica", fontSize=9,
        textColor=text_color, leading=13)
    t = Table([[Paragraph(title, ts)], [Paragraph(body, bs)]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 0.8, border),
        ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ]))
    story.append(t); story.append(Spacer(1, 8))

def urgency_box(story, text):
    t = Table([[Paragraph(text, S["urgency"])]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_URGENCY_BG),
        ("BOX", (0,0), (-1,-1), 0.8, C_URGENCY_BORDER),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ]))
    story.append(t); story.append(Spacer(1, 8))

def amber_note(items, text):
    ds = ParagraphStyle("da", fontName="Helvetica", fontSize=8,
        textColor=C_AMBER_TEXT, leading=11)
    t = Table([[Paragraph(text, ds)]], colWidths=[FULL_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_AMBER_BG),
        ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#E8C97A")),
        ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ]))
    items.append(t); items.append(Spacer(1, 6))

# ── Career block functions ─────────────────────────────────────────────────────
# Rule: KeepTogether only on visual blocks (salary table, 30-day box + nudge).
# All text sections flow freely — no forced page compression.

def block_fit(career):
    items = []
    section_divider(items, f"{career['section']} — {career['title']}")
    items.append(Paragraph(career["title"], S["h1"]))
    items.append(Spacer(1, 6))
    items.append(Paragraph("Why this fits you", S["h3"]))
    items.append(Paragraph(career["fit"], S["body"]))
    return items


def block_paths(career):
    items = career_header("Paths within this domain")
    for role_title, role_desc in career["paths"]:
        items.append(Paragraph(f"&#8250;  {role_title}", S["role_title"]))
        items.append(Paragraph(role_desc, S["role_desc"]))
    return items


def block_stream(career):
    items = career_header("Stream and subject guidance")
    items.append(Paragraph(career["stream"], S["body"]))
    return items


def block_ug_degrees(career):
    items = career_header("Undergraduate degrees to consider")
    for degree, note in career["ug_degrees"]:
        items.append(Paragraph(f"&#8250;  {degree}", S["ug_title"]))
        items.append(Paragraph(note, S["ug_note"]))
    amber_note(items,
        "Guidance reflects general pathways across boards. "
        "Your counsellor will personalise this for your specific board, "
        "location and current subjects on the call.")
    return items


def block_market(career):
    header = career_header("Market demand and salary")
    hs   = ParagraphStyle("dh", fontName="Helvetica-Bold", fontSize=8,
        textColor=C_MUTED, leading=11)
    dl_s = ParagraphStyle("dl", fontName="Helvetica", fontSize=8,
        textColor=C_MUTED, leading=11)
    sal_s = ParagraphStyle("sl", fontName="Helvetica-Bold", fontSize=8,
        textColor=C_MUTED, leading=11)
    sal_v = ParagraphStyle("sv", fontName="Helvetica-Bold", fontSize=12,
        textColor=C_PURPLE_TEXT, leading=15)
    sal_c = ParagraphStyle("sc", fontName="Helvetica", fontSize=8,
        textColor=C_MUTED, leading=11)
    roles = career["sal_roles"]
    visual = [
        Paragraph("5-YEAR DEMAND GROWTH", hs),
        Spacer(1, 3),
        DemandBar(career["demand_pct"], width=FULL_W),
        Spacer(1, 4),
        Paragraph(career["demand_label"], dl_s),
        Spacer(1, 10),
    ]
    sal_data = [
        [Paragraph("ENTRY (0 TO 2 YEARS)", sal_s),
         Paragraph("MID (3 TO 6 YEARS)",   sal_s),
         Paragraph("SENIOR (7 YEARS PLUS)",sal_s)],
        [Paragraph(career["sal_entry"], sal_v),
         Paragraph(career["sal_mid"],   sal_v),
         Paragraph(career["sal_senior"],sal_v)],
        [Paragraph(roles[0], sal_c),
         Paragraph(roles[1], sal_c),
         Paragraph(roles[2], sal_c)],
    ]
    st = Table(sal_data, colWidths=[56*mm, 60*mm, 54*mm])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F9F8FF")),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("LINEAFTER", (0,0), (1,-1), 0.5, C_RULE),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    visual.append(st)
    visual.append(Spacer(1, 4))
    visual.append(Paragraph(
        "Source: LinkedIn Salary Insights India 2024, Glassdoor India, AmbitionBox. "
        "Ranges are indicative for Tier-1 cities. "
        "Actual figures vary by organisation, location and experience.",
        S["small_muted"]))
    visual.append(Spacer(1, 6))
    return header + [KeepTogether(visual)]


def block_internships(career):
    items = career_header("Internships to target in the next 12 months")
    rs = ParagraphStyle("ir", fontName="Helvetica-Bold", fontSize=9,
        textColor=C_PURPLE_TEXT, leading=13)
    ws = ParagraphStyle("iw", fontName="Helvetica", fontSize=9,
        textColor=C_MUTED, leading=13)
    rows = [[Paragraph(r[0], rs), Paragraph(r[1], ws)] for r in career["internships"]]
    intern_t = Table(rows, colWidths=[62*mm, 108*mm])
    intern_t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.HexColor("#F9FAFB"), C_WHITE]),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("LINEBELOW", (0,0), (-1,-2), 0.5, C_RULE),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    items.append(intern_t)
    items.append(Spacer(1, 4))
    items.append(Paragraph(
        "Find these on Internshala, LinkedIn and Unstop. "
        "For research and documentary roles, a direct email works better than a portal application.",
        S["small_muted"]))
    items.append(Spacer(1, 8))
    return items


def block_thirty_day(career):
    header = career_header("Your next 30 days")
    et = Table([[Paragraph(career["thirty_day"], S["body_muted"])]], colWidths=[FULL_W])
    et.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_PURPLE_LIGHT),
        ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LINEAFTER", (0,0), (0,-1), 3, C_PURPLE),
    ]))
    visual = [et, Spacer(1, 10), CounsellorNudge(width=FULL_W)]
    return header + [KeepTogether(visual)]


def career_block(story, career):
    story.extend(block_fit(career))
    story.extend(block_paths(career))
    story.extend(block_stream(career))
    story.extend(block_ug_degrees(career))
    story.extend(block_market(career))
    story.extend(block_internships(career))
    story.extend(block_thirty_day(career))
    story.append(PageBreak())

# ── Main story ─────────────────────────────────────────────────────────────────
def build_story():
    story = []

    # ── COVER ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 38*mm))
    story.append(Paragraph("CareerShifu", S["cover_logo"]))
    story.append(Paragraph("Your personalised career report", S["cover_tagline"]))
    story.append(Spacer(1, 18*mm))
    story.append(Paragraph(STUDENT["headline"], S["cover_name"]))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        f"{STUDENT['grade']}  ·  {STUDENT['stage']}", S["cover_grade"]))
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="100%", thickness=0.5,
        color=colors.HexColor("#6060A0"), spaceAfter=8))
    col_data = [
        [Paragraph("PROFILE TYPE",      S["cover_label"]),
         Paragraph("TOP DOMAINS",       S["cover_label"]),
         Paragraph("GRADE STAGE",       S["cover_label"])],
        [Paragraph("Decision Window",   S["cover_val"]),
         Paragraph("Research\nStartups\nPolicy", S["cover_val"]),
         Paragraph("18-month window",   S["cover_val"])],
    ]
    t = Table(col_data, colWidths=[52*mm, 65*mm, 43*mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(t)
    story.append(Spacer(1, 22*mm))
    story.append(Paragraph("3 careers  ·  Personalised  ·  2025", S["cover_tagline"]))
    story.append(PageBreak())

    # ── ABOUT ──────────────────────────────────────────────────────────────────
    about_items = []
    section_divider(about_items, "About this report")
    about_items.append(Paragraph("What is inside", S["h1"]))
    story.append(KeepTogether(about_items))

    urgency_box(story,
        "You are in Class 11 or 12. Stream choices, subject selections and your first "
        "internship all happen in the next 12 to 18 months. This report is designed to "
        "help you make those choices deliberately, not by default.")

    callout_box(story, "Free counsellor call included",
        "After you read this report a counsellor will call you within 48 hours. "
        "The call is to help you understand what is in here and decide on your next steps. "
        "It is not a sales call.")

    items_list = [
        ("Your thinking style",
         "How you process information and where you do your best work"),
        ("Your strengths and blind spots",
         "Drawn directly from your answers, not a generic template"),
        ("Three career deep-dives",
         "Each career covered fully: fit, paths, stream guidance, degrees, salary, internships and your first 30 days"),
        ("Parent summary",
         "So they understand your direction without you having to explain everything"),
    ]
    for pri, sec in items_list:
        ps = ParagraphStyle("bp", fontName="Helvetica-Bold", fontSize=10,
            textColor=C_PURPLE_TEXT, leading=15, spaceAfter=1)
        ss = ParagraphStyle("bs", fontName="Helvetica", fontSize=9,
            textColor=C_MUTED, leading=13, spaceAfter=6)
        story.append(Paragraph(f"&#8227;  {pri}", ps))
        story.append(Paragraph(f"    {sec}", ss))

    story.append(PageBreak())

    # ── SECTION 1 — THINKING STYLE ─────────────────────────────────────────────
    s1_header = []
    section_divider(s1_header, "Section 1 — Your thinking style")
    s1_header.append(Paragraph(STUDENT["headline"], S["h1"]))
    story.append(KeepTogether(s1_header))
    story.append(Spacer(1, 4))
    story.append(Paragraph(STUDENT["thinking_style"], S["body"]))
    story.append(Spacer(1, 10))

    trait_items = [Paragraph("Your trait profile", S["h3"])]
    for label, val in STUDENT["traits"]:
        trait_items.append(TraitBar(label, val, width=FULL_W))
        trait_items.append(Spacer(1, 6))
    story.append(KeepTogether(trait_items))
    story.append(PageBreak())

    # ── SECTION 2 — STRENGTHS AND BLIND SPOTS ─────────────────────────────────
    s2_header = []
    section_divider(s2_header, "Section 2 — Strengths and blind spots")
    s2_header.append(Paragraph("What your answers showed", S["h1"]))
    s2_header.append(Paragraph("Your strengths", S["h2"]))
    story.append(KeepTogether(s2_header))

    for pri, sec in STUDENT["strengths"]:
        story.append(KeepTogether([
            Paragraph(f"<b>&#8227;  {pri}</b>", S["bold"]),
            Paragraph(f"    {sec}", S["body_muted"]),
            Spacer(1, 4),
        ]))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Your blind spots", S["h2"]))
    for pri, sec in STUDENT["blindspots"]:
        story.append(KeepTogether([
            Paragraph(f"<b>&#8227;  {pri}</b>", S["bold"]),
            Paragraph(f"    {sec}", S["body_muted"]),
            Spacer(1, 4),
        ]))
    story.append(PageBreak())

    # ── CAREER DEEP-DIVES ──────────────────────────────────────────────────────
    for career in CAREERS:
        career_block(story, career)

    # ── PARENT SUMMARY ─────────────────────────────────────────────────────────
    ps_header = []
    section_divider(ps_header, "Parent summary")
    ps_header.append(Paragraph("For parents to read", S["h1"]))
    story.append(KeepTogether(ps_header))

    callout_box(story, "This page is written for you.",
        "The rest of the report is written for your child. This page is for you.",
        bg=C_PURPLE_LIGHT, border=C_PURPLE_BORDER, text_color=C_PURPLE_TEXT)

    story.append(Paragraph(
        "Your child has strong analytical reasoning and genuine curiosity about why people "
        "think and behave the way they do. What stands out is the combination: they think "
        "in structured steps and they care about people. "
        "That is useful across multiple serious career paths, not just one.",
        S["body"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "They are in Class 11 or 12, which means the next 12 to 18 months include some "
        "important choices — subjects, applications, and their first internship. "
        "One internship before their Class 12 exams changes their application story significantly. "
        "That is worth helping them create time for.",
        S["body"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "The three domains in this report all have financially viable careers attached to them. "
        "The salary section in each career chapter shows entry, mid and senior figures with sources. "
        "The senior figures are not exceptional outcomes. "
        "They are standard for people who build real skill and experience over seven to ten years.",
        S["body"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("What to watch for", S["h3"]))
    story.append(Paragraph(
        "Watch which topics or projects they come back to without being asked. "
        "That is where the real energy is, and it is more reliable than what they say "
        "they want when asked directly.",
        S["body"]))
    story.append(Spacer(1, 8))

    callout_box(story, "The counsellor call",
        "A counsellor will contact your child within 48 hours of downloading this report. "
        "The call covers what is in this report and helps your child decide on next steps. "
        "You are welcome to join. "
        "College-specific guidance, entrance exam strategy and a detailed plan "
        "are available as a follow-on session.")

    # ── WHAT HAPPENS NEXT ──────────────────────────────────────────────────────
    story.append(PageBreak())
    whn_header = []
    section_divider(whn_header, "What happens next")
    whn_header.append(Paragraph("Three things to do now", S["h1"]))
    story.append(KeepTogether(whn_header))
    story.append(Spacer(1, 8))

    steps = [
        ("Read the career that pulled you most",
         "Not the most impressive one. The one where you felt something while reading it. "
         "Go back to that chapter and read the 30-day step at the end."),
        ("Do the 30-day step for that career",
         "It is one specific action. It takes less than an hour to start. "
         "Do not wait until you feel ready."),
        ("Take the counsellor call",
         "A counsellor will contact you within 48 hours. "
         "The call is about this report and your next steps. Bring one question."),
    ]
    for num, (title, body) in enumerate(steps, 1):
        ns = ParagraphStyle("sn", fontName="Helvetica-Bold",
            fontSize=18, textColor=C_PURPLE, leading=22)
        dt = Table([[Paragraph(str(num), ns),
                     [Paragraph(title, S["h3"]), Paragraph(body, S["body"])]]],
                   colWidths=[16*mm, 154*mm])
        dt.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("TOPPADDING", (0,0), (-1,-1), 3), ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("LEFTPADDING", (0,0), (-1,-1), 0),
        ]))
        story.append(dt)
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_RULE, spaceAfter=8))
    story.append(Paragraph(
        "CareerShifu 2025  ·  Confidential, for the student named on the cover only.  "
        "Guidance reflects general pathways across boards. "
        "Specific college options, entrance exams and cutoffs will be covered "
        "on your counsellor call.",
        S["small_muted"]))

    return story

# ── Generate ───────────────────────────────────────────────────────────────────
OUT = "/mnt/user-data/outputs/CareerShifu_Class1112_Final.pdf"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=16*mm, bottomMargin=14*mm,
    title="CareerShifu — Story-driven explorer of human nature",
    author="CareerShifu",
)
doc.build(build_story(), onFirstPage=first_page, onLaterPages=later_pages)
print(f"Done: {OUT}")
