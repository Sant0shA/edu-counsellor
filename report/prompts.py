"""Prompt builders for the 7 CareerShifu report API calls (5 Sonnet + 2 Haiku)."""

GRADE_BUCKET_MAP = {
    'Class 8 or below': 'Early Explorer',
    'Class 9': 'Early Explorer',
    'Class 10': 'Early Explorer',
    'Class 11': 'Decision Window',
    'Class 12': 'Decision Window',
    'In college / Undergraduate': 'Transition Point',
    'Graduate / Working': 'Transition Point',
}

DECISION_WINDOW_GRADES = {'Class 11', 'Class 12'}
UNDERGRAD_GRADES = {'In college / Undergraduate', 'Graduate / Working'}

PERSONAL_LABELS = [
    'Subject interests',
    'Academic aptitude signal',
    'Free time activities',
    'Career shadow choice',
    'Inspiring quality in role models',
    'What they most want to work on',
    'Last time they lost track of time',
]


def build_system_prompt(ctx: dict) -> str:
    """Build the cached system prompt embedding the full student profile."""
    grade = ctx['grade']
    bucket = GRADE_BUCKET_MAP.get(grade, 'Explorer')
    headline = ctx['headline']
    observation = ctx['observation']
    domains = ctx['domains']
    psychometric = ctx.get('psychometric', [])
    cognitive = ctx.get('cognitive', [])
    personal = ctx.get('personal', [])
    motivations = ctx.get('motivations', [])
    cog_score = ctx.get('cog_score', 0)

    psycho_lines = '\n'.join(f'  Q{i+1}: {a}' for i, a in enumerate(psychometric))
    cog_lines = '\n'.join(f'  Q{i+1}: {a}' for i, a in enumerate(cognitive))

    personal_lines = '\n'.join(
        f'  {PERSONAL_LABELS[i] if i < len(PERSONAL_LABELS) else f"Q{i+1}"}: {a}'
        for i, a in enumerate(personal)
    )

    motivation_lines = '\n'.join(f'  - {m}' for m in motivations)

    domain_lines = '\n'.join(
        f'  Domain {i+1}: {d["name"]} — {d.get("connection", "")}'
        for i, d in enumerate(domains)
    )

    return f"""You are a CareerShifu report writer. You write sections of a personalised career guidance report for an Indian student.

STUDENT PROFILE:
Grade: {grade} (Stage: {bucket})
Assessment Headline: {headline}
Assessment Observation: {observation}

Psychometric signals (Big Five situational responses):
{psycho_lines}

Cognitive reasoning results ({cog_score}/4 correct):
{cog_lines}

Personal signals:
{personal_lines}

Top motivations:
{motivation_lines}

Career domains identified by the Virtual Edu Guide:
{domain_lines}

WRITING RULES:
- Tone: warm, direct, clear; never clinical, never prescriptive
- Address the student directly (second person: "you", "your")
- Never use: should, must, best fit, recommended, suited for, perfect for, exceptional, remarkable, unique, outstanding, extraordinary
- Always use: might, could, worth exploring, some students find, one direction to consider
- No em-dashes (—) or en-dashes (–); use commas or semicolons instead
- Do not name specific colleges, universities, or entrance exams
- Do not use percentage match scores or domain rankings
- Use the student's own words from their signal responses where possible
- Never mention cognitive question scores, correct/incorrect answers, or any reference to how the student performed on reasoning questions. Do not say they scored low, scored high, or anything about their cognitive performance. Use the cognitive data only to inform the thinking style description without referencing the questions.
- Do not mention any animal (real or metaphorical) in any section. Do not use complex vocabulary; this report may be read by a 15-year-old. Write as you would speak to a bright teenager: plain words, short sentences, no jargon.
- For internship discovery, only name these platforms in the "how" field: Internshala, LinkedIn, Unstop, AngelList India, Devfolio. Do not name specific media outlets, NGOs, companies, or organisations — they change and may be defunct. Describe the type of organisation instead.
- Return only valid JSON as specified in each request; no markdown, no extra text"""


def prompt_thinking_and_strengths() -> str:
    return """Generate the "Thinking Style" and "Strengths and Blind Spots" sections of the report.

Return exactly this JSON:
{
  "thinking_style": {
    "para1": "50-60 words. How this student processes information and makes decisions. Draw directly from their psychometric and cognitive patterns.",
    "para2": "50-60 words. How this thinking style shows up in real situations and what it allows them to do well — and where it can sometimes work against them."
  },
  "strengths": [
    "One strength — 1-2 sentences. What the strength is and how it shows up in their signals.",
    "One strength — same format",
    "One strength — same format",
    "One strength — same format",
    "One strength — same format"
  ],
  "blind_spots": [
    "One area to watch — 1-2 sentences. Framed as something worth being aware of, not a flaw.",
    "One area to watch — same format",
    "One area to watch — same format"
  ]
}"""


def prompt_career(domain: dict, grade: str) -> str:
    """User message for career deep-dive (calls 2, 3, 4)."""
    is_decision_window = grade in DECISION_WINDOW_GRADES
    is_undergrad = grade in UNDERGRAD_GRADES

    if is_decision_window:
        stream_field = (
            '  "stream_guidance": "50-70 words on which stream and subjects align with this domain. '
            'Be specific about subject choices: Science, Commerce, or Humanities; Maths or Applied Maths; '
            'which electives help. Note: Maths board requirements and course prerequisites vary; '
            'always verify with your specific school and board.",'
        )
    else:
        stream_field = '  "stream_guidance": null,'

    if is_undergrad:
        degree_label = 'postgrad_degrees'
        degree_instruction = (
            '"Postgraduate degree or specialisation 1 — what it opens up in one sentence"'
        )
        degree_count_note = '5-6 postgraduate degree options relevant to this domain'
    else:
        degree_label = 'ug_degrees'
        degree_instruction = (
            '"UG degree 1 — what it opens up in one sentence"'
        )
        degree_count_note = '5-6 undergraduate degree options relevant to this domain'

    return f"""Generate the deep-dive section for: {domain['name']}

Connection already identified: {domain.get('connection', '')}

Return exactly this JSON:
{{
  "fit_rationale": "60-80 words. Why this domain is worth exploring for this student. Connect their specific signals and responses to this domain directly.",
  "paths": [
    {{"name": "Role or path title", "description": "One sentence, present tense: what someone in this role actually does day-to-day."}},
    {{"name": "...", "description": "..."}},
    {{"name": "...", "description": "..."}},
    {{"name": "...", "description": "..."}},
    {{"name": "...", "description": "..."}}
  ],
{stream_field}
  "{degree_label}": [
    {{"name": {degree_instruction}}},
    {{"name": "Degree 2", "note": "..."}},
    {{"name": "Degree 3", "note": "..."}},
    {{"name": "Degree 4", "note": "..."}},
    {{"name": "Degree 5", "note": "..."}}
  ]
}}

Rules: 5 paths required. Each path name is a distinct role title. Each description is one sentence in present tense describing the actual work."""


def prompt_parent_summary() -> str:
    return """Generate the parent summary section.

This is written for the student's parent or guardian. They have not taken the assessment; they need to understand what it means for their child. Tone: warm, direct, clear of jargon. Respect their role without being patronising.

Return exactly this JSON:
{
  "para1": "40-50 words. What this student is genuinely good at and how they think. Honest, not flattering.",
  "para2": "40-50 words. What the assessment identified as domains worth exploring and why; connect to signals the parent likely already recognises in their child.",
  "para3": "40-50 words. What this means for near-term decisions (stream, subjects, college direction) and what conversations are worth having together."
}"""


def prompt_30_days(domains: list) -> str:
    d1 = domains[0]['name']
    d2 = domains[1]['name']
    d3 = domains[2]['name']

    return f"""Generate "Your next 30 days" action plans for each domain.

Domains: {d1}, {d2}, {d3}

Each plan: 3-4 sentences, maximum 60 words. Concrete, specific actions to do, watch, read, or try. Realistic for an Indian student. No vague suggestions.

Return exactly this JSON:
{{
  "domain_1": "3-4 sentences of specific actions for {d1}",
  "domain_2": "3-4 sentences of specific actions for {d2}",
  "domain_3": "3-4 sentences of specific actions for {d3}"
}}"""


def prompt_internships(domains: list) -> str:
    d1 = domains[0]['name']
    d2 = domains[1]['name']
    d3 = domains[2]['name']

    return f"""Generate internship and exploration target lists for each domain.

Domains: {d1}, {d2}, {d3}

For each domain: 4 types of organisations, roles, or opportunities to target. Focus on where and how to find these in India.

Return exactly this JSON:
{{
  "domain_1": [
    {{"name": "Organisation type or opportunity", "type": "Internship / Volunteer / Project / Club", "how": "One sentence on where to find or apply for this in India."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}}
  ],
  "domain_2": [
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}}
  ],
  "domain_3": [
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}},
    {{"name": "...", "type": "...", "how": "..."}}
  ]
}}"""
