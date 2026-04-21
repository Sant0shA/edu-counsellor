# CareerMap PDF Report — Prompt Specification for Claude Code

**Version:** 1.0  
**Last updated:** April 2025  
**Purpose:** Complete specification for generating personalised CareerMap PDF reports at scale.  
**Implementation target:** Claude Code  

---

## Overview

The CareerMap report is a personalised career guidance PDF generated after a student completes a psychometric assessment. It is produced using Python and ReportLab. The report is the primary deliverable of the product — the thing the student pays for.

Two models are used in sequence:

- **Claude Sonnet** — generates all narrative sections (thinking style, fit rationale, role descriptions, strengths and blind spots, parent summary). These sections require tone judgment, plain language discipline and avoidance of generic filler.
- **Claude Haiku** — populates structured data sections (30-day step per career, internship list selection). These are templated tasks where format does the work.

The PDF engine is built. This document specifies what content Sonnet and Haiku need to generate, the exact constraints that apply, and how student data maps to each section.

---

## Student Data Schema

The following fields arrive as JSON after assessment completion. Every field is used somewhere in the report.

```json
{
  "grade": "Class 11 or 12",
  "personal": [
    "subject interests (array)",
    "language preference",
    "how they spend time (array)",
    "who they admire (array)",
    "self-described metaphor",
    "what they admire in others",
    "core question they care about"
  ],
  "motivations": ["motivation 1", "motivation 2"],
  "psychometric": [
    "how they handle curiosity",
    "how they socialise",
    "how they handle deadlines",
    "how they respond to others in need",
    "how they handle failure",
    "how they feel without direction",
    "how they handle disagreement",
    "how they handle their own mistakes"
  ],
  "cognitive": ["answer 1", "answer 2", "answer 3", "answer 4", "answer 5"],
  "cognitiveQuestions": [array of question objects with correct answers],
  "board": "CBSE"
}
```

The assessment result JSON also includes pre-computed fields from the assessment engine:

```json
{
  "headline": "Story-driven explorer of human nature",
  "observation": "First-person observation about this student",
  "domains": [
    {
      "name": "Domain name",
      "paths": ["path 1", "path 2", "path 3", "path 4", "path 5"],
      "explore": "One suggested exploration action",
      "connection": "Why this domain fits this student"
    }
  ],
  "traits": {
    "curiosity": 82,
    "empathy": 76,
    "focus": 68,
    "calmness": 58,
    "socialEnergy": 52
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "parentNote": "Pre-written parent note from assessment engine"
}
```

---

## Grade Buckets

Grade determines framing, tone and which sections appear. Map incoming grade string to bucket before generating any content.

| Grade input | Bucket label | Framing tone |
|---|---|---|
| Class 8 and below | Early Explorer | Exploratory, no pressure, long horizon |
| Class 9 to 10 | Early Explorer | Exploration framing, stream decision ahead |
| Class 11 or 12 | Decision Window | Urgency, 12 to 18 month window, portfolio building |
| Just finished school or gap year | Transition Point | Action framing, internships now, UG application decisions |
| Undergraduate | Transition Point | Bridge framing, industry entry, skill building |
| Graduate | Transition Point | Direct action, postgrad vs direct entry |

The Decision Window bucket requires an urgency note on the cover and about page. The Transition Point bucket removes stream guidance and replaces it with immediate action framing.

---

## Report Structure

The report contains the following sections in this order. Sections marked [SONNET] require Sonnet generation. Sections marked [HAIKU] use Haiku. Sections marked [STATIC] are templated and require no generation.

1. Cover page [STATIC]
2. About this report [STATIC]
3. Section 1 — Thinking style [SONNET]
4. Section 2 — Strengths and blind spots [SONNET]
5. Career 1 deep-dive [SONNET + HAIKU]
6. Career 2 deep-dive [SONNET + HAIKU]
7. Career 3 deep-dive [SONNET + HAIKU]
8. Parent summary [SONNET]
9. What happens next [STATIC]

Each career deep-dive contains these sub-sections in this order:

- Why this fits you [SONNET]
- Paths within this domain [SONNET]
- Stream and subject guidance [SONNET] — Decision Window only; skip for Transition Point
- Undergraduate degrees to consider [SONNET]
- Market demand and salary [STATIC — from education context document]
- Internships to target in the next 12 months [HAIKU]
- Your next 30 days [HAIKU]

---

## Sonnet System Prompt

Use this system prompt for all Sonnet calls. Replace tokens in [BRACKETS] with live data.

```
You are generating sections of a personalised career report for an Indian student.
The report is a paid product. The student has answered a psychometric assessment.
Your job is to write specific, honest, plainly worded content based on their answers.

Student profile:
- Name: not available (address as "you" throughout)
- Grade: [GRADE]
- Grade stage: [BUCKET LABEL — Early Explorer / Decision Window / Transition Point]
- Assessment headline: [HEADLINE]
- Top 3 matched domains: [DOMAIN 1], [DOMAIN 2], [DOMAIN 3]
- Board: [BOARD — or omit if unknown]
- Trait scores: Curiosity [N]%, Empathy [N]%, Focus [N]%, Calmness [N]%, Social energy [N]%
- Motivations: [MOTIVATION 1] and [MOTIVATION 2]
- Psychometric responses: [FULL PSYCHOMETRIC ARRAY]
- Cognitive answers: [CORRECT/INCORRECT per question]
- Strengths from assessment engine: [STRENGTHS ARRAY]
- Assessment observation: [OBSERVATION]

WRITING RULES — apply to every word you write:

1. Plain language. Write for a 16-year-old reading this alone. If a word needs unpacking, replace it.
2. No em-dashes anywhere. Use a comma, a full stop, or rewrite the sentence.
3. No jargon. No terms that assume the student knows the field.
4. No invented category language. Do not coin phrases like "sprint career" or "depth role".
5. No animal metaphors or references, even if they appear in the student's assessment data.
6. Present tense for role descriptions. "You spend Monday doing X" not "You would spend".
7. One idea per sentence where possible.
8. Do not repeat structure across sections. If the thinking style paragraph starts with "You are drawn to", the fit rationale for Career 1 cannot also start with "You are drawn to".
9. Specific over general. "You traced the logic questions step by step" is better than "You think carefully".
10. Do not start any section by restating what section it is. Do not write "In this section, we will cover..."

TONE:
- Direct but warm. Not clinical, not cheerful.
- Honest about limitations. Blind spots are real, not softened to nothing.
- The student is reading this alone. Write for that moment.

WHAT NOT TO WRITE:
- No college names, entrance exam names, cutoff scores or fees. These are reserved for the counsellor call.
- No percentage match scores.
- No references to the assessment itself ("based on your answers" is fine once; do not repeat it).
- No superlatives. Do not call the student "exceptional" or "remarkable".
- No generic encouragement. "You can achieve anything" and similar phrases are forbidden.
```

---

## Section-by-Section Sonnet Instructions

### Section 1 — Thinking style

**Input:** headline, observation, trait scores, psychometric responses, cognitive results  
**Output:** 2 paragraphs, plain prose, no bullet points

**Paragraph 1:** Describe how this student processes the world — what they notice, how they approach problems, what drives them. Draw from psychometric responses and trait scores. Do not list traits. Synthesise them into a description.

**Paragraph 2:** Connect their thinking style to the kind of work environments where they will thrive and where they will struggle. Be specific about both. One sentence each.

**Constraints:**
- Maximum 120 words total across both paragraphs
- Do not use the word "unique"
- Do not start with "You are"

---

### Section 2 — Strengths and blind spots

**Input:** strengths array, psychometric responses, cognitive results  
**Output:** 5 strengths, 3 blind spots. Each has a primary line (bold, 6 words maximum) and a supporting sentence (plain, 20 words maximum).

**Strengths format:**
```
Primary line: [Concise label for the strength]
Supporting sentence: [One sentence drawing this strength from their specific answers, not generic]
```

**Blind spots format:**
```
Primary line: [Concise label for the limitation]
Supporting sentence: [One honest sentence about how this shows up and why it matters professionally]
```

**Constraints:**
- Blind spots must be honest, not softened. "You tend to wait until things feel right before starting" is correct. "Sometimes you prefer to take your time" is too soft.
- Every strength and blind spot must be traceable to something in the student's actual responses. Do not include generic strengths like "good communicator" unless there is specific evidence.
- Primary lines must be in title case, 6 words maximum.
- Supporting sentences maximum 20 words.

---

### Career section — Why this fits you

**Input:** domain connection text, student trait scores, student motivations, psychometric responses  
**Output:** 1 paragraph, 60 to 80 words

Write why this specific career domain fits this specific student. Do not describe the domain. Do not list what the domain involves. Connect their traits, motivations and psychometric answers to what the work actually rewards.

**Constraints:**
- Must reference at least one specific thing from the student's psychometric or trait data
- Must not start with "This domain" or "This career"
- Must not end with encouragement or a question

---

### Career section — Paths within this domain

**Input:** domain paths array (5 to 6 paths)  
**Output:** For each path: one role title and one plain description of 2 to 3 sentences

Each description must:
- Be written in present tense
- Describe what the work actually looks like day to day, not what the career is about in general
- Be distinct from every other role in the same section — no shared sentence structures
- Contain at least one concrete detail (a day, a task, a moment) that could not apply to any other role on the list

**Example of correct output:**
```
Journalist or reporter
You pick a beat — politics, health, business, crime — and cover it every week.
Most of the job is getting people to talk honestly. The writing is the last part.
```

**Example of incorrect output:**
```
Journalist or reporter
Journalists research and write stories about important topics for various publications.
They interview sources and communicate information to the public.
```

---

### Career section — Stream and subject guidance

**Decision Window students only. Skip entirely for Transition Point.**

**Input:** domain name, student's grade, board (if known)  
**Output:** 1 paragraph, 50 to 70 words

Tell the student which subjects support this career path and which stream is most useful. Frame advice around what is still possible from where they are now — not what they should have done. Do not name specific colleges. Do not name entrance exams.

**Maths guidance rule:** Do not tell students to drop Maths or keep Maths as a directive. If Maths is relevant, use this exact phrasing: "It may be beneficial to retain Maths to keep your options open, as some programmes consider it during admissions."

**Board rule:** Do not name specific boards (CBSE, ISC, state board) unless the student's board is known. Use "your board" generically. End the section with this sentence verbatim: "Your counsellor will confirm what applies for your specific board and location on the call."

---

### Career section — Undergraduate degrees to consider

**Input:** domain name, student's grade stage  
**Output:** 5 to 6 degree entries. Each has a degree name and one plain explanatory sentence.

**Format:**
```
[Degree name in full]
[One sentence: what it covers and what it opens, in plain language]
```

**Constraints:**
- Do not name specific colleges or institutions
- List degree types only (e.g. Bachelor of Arts in Psychology)
- Each explanatory sentence maximum 25 words
- For Transition Point students (gap year, UG): focus on UG degrees relevant to the current stage
- For Graduate students: replace this section with postgraduate and skill path options

**End the section** with this amber-coloured note verbatim:
> Guidance reflects general pathways across boards. Your counsellor will personalise this for your specific board, location and current subjects on the call.

---

### Parent summary

**Input:** parent note from assessment engine, student headline, grade stage, top domains, strengths  
**Output:** 3 paragraphs in plain prose

**Paragraph 1:** Describe the student as a person — what stands out about how they think and what they care about. Write for a parent who has not read the rest of the report.

**Paragraph 2:** Address the financial question directly. State that the three domains have viable career paths with real salary progression. Reference the salary section in the report.

**Paragraph 3:** Give parents one practical thing to watch for or do. Specific and actionable.

**Constraints:**
- Write for a parent, not for the student. Use "your child" not "you".
- Maximum 150 words total
- Do not repeat what the student already read in their sections
- Do not end with a platitude

**End with this callout verbatim (formatted as a green box in the PDF):**
> The counsellor call: A counsellor will contact your child within 48 hours of downloading this report. The call covers what is in this report and helps your child decide on next steps. You are welcome to join. College-specific guidance, entrance exam strategy and a detailed plan are available as a follow-on session.

---

## Haiku Instructions

### 30-day step per career

**Input:** domain name, domain explore text, student grade stage  
**Output:** 3 to 4 sentences. One specific action the student can take in the next 30 days to explore this career.

**Constraints:**
- Must be a real action, not a research prompt
- Must be completable by a student with no prior experience or contacts
- Must not require spending money
- Must not say "research" as the action — be specific about what to research and what to do with it
- Maximum 60 words

**Example of correct output:**
```
Read one long-form journalism or research piece this week.
Write 200 words on how the writer investigated their subject — not just what they found, but how they went about finding it.
Then find one person working in this space and send them one specific question by email.
```

**Example of incorrect output:**
```
Research journalism as a career and explore opportunities in this field.
Consider speaking to professionals and learning more about what the work involves.
```

---

### Internship list per career

**Input:** domain name, student grade, student location (if known)  
**Output:** 4 internship entries. Each has a role name and a where-to-find-it description.

**Format:**
```
[Role name]
[Where to find it — specific enough to search, not a vague category]
```

**Constraints:**
- Role names must be jobs a student can actually apply for, not descriptions of what they want to learn
- Where-to-find-it must name a real platform, organisation type or search approach
- No tags, no readiness flags, no "build X first" instructions
- For Decision Window students: roles should be achievable by a Class 11 or 12 student with no prior experience
- For Transition Point students: roles can assume one year of undergraduate study

---

## Education Context Document

The salary figures, demand percentages and demand labels in the Market demand and salary section are NOT generated by AI. They are pulled from an education context document maintained by the product team and updated each semester.

The context document contains:
- Demand growth percentages per career domain (source: NASSCOM, LinkedIn Talent Insights India)
- Salary ranges per career domain at entry, mid and senior levels (source: LinkedIn Salary Insights India, Glassdoor India, AmbitionBox)
- Indicative role titles at each level per domain

**The salary source disclaimer appears verbatim in every report:**
> Source: LinkedIn Salary Insights India 2024, Glassdoor India, AmbitionBox. Ranges are indicative for Tier-1 cities. Actual figures vary by organisation, location and experience.

Pass the education context document as a system-level context block in the Sonnet prompt. Sonnet must not generate salary figures from training knowledge.

---

## Sections That Must Not Be AI-Generated

The following content must never be produced by any model. It is reserved for the counsellor call:

- Specific college names and recommendations
- Entrance exam names, dates or cutoff scores
- Course fees
- Seat availability or reservation details
- Personalised application strategy

If a student asks Claude to generate any of the above during a report session, do not produce it. Respond with: "Your counsellor will cover this on the call, personalised to your board, location and profile."

---

## Quality Checklist

Before finalising any generated section, check against this list. A section fails if any of the following are true:

**Language failures:**
- [ ] Contains an em-dash
- [ ] Contains jargon a 16-year-old would not understand without looking it up
- [ ] Contains a coined category term not in common use
- [ ] Contains an animal metaphor or reference
- [ ] Contains a superlative applied to the student (exceptional, remarkable, unique)
- [ ] Contains generic encouragement ("you can do anything", "the sky is the limit")
- [ ] Contains a college name, entrance exam name or cutoff score
- [ ] Contains a percentage match score

**Structure failures:**
- [ ] Two sections in the same career block start with the same phrase
- [ ] A role description could apply to a different role without changing the facts
- [ ] A strength or blind spot is not traceable to the student's actual responses
- [ ] The parent summary repeats content the student already read
- [ ] A 30-day step says "research" as the primary action without specifics

**Tone failures:**
- [ ] A blind spot has been softened to meaninglessness
- [ ] A strength is generic (good communicator, hard worker) without specific evidence
- [ ] The thinking style section lists traits instead of synthesising them

---

## API Call Architecture

```
POST /v1/messages
Model: claude-sonnet-4-5 (narrative sections)
Model: claude-haiku-4-5 (structured data sections)

Call sequence:
1. Sonnet call — generate thinking style + strengths and blind spots
2. Sonnet call — generate Career 1 fit rationale + paths + stream guidance + UG degrees
3. Sonnet call — generate Career 2 fit rationale + paths + stream guidance + UG degrees
4. Sonnet call — generate Career 3 fit rationale + paths + stream guidance + UG degrees
5. Sonnet call — generate parent summary
6. Haiku call — generate 30-day steps for all three careers
7. Haiku call — generate internship lists for all three careers
8. PDF engine — compile all generated content with static sections and education context data

Total: 5 Sonnet calls + 2 Haiku calls per report
```

Each call is independent. Pass the full student profile JSON in the system prompt for every call. Do not rely on conversation history between calls.

---

## Known Edge Cases

**Student has no board specified:**
Use "your board" throughout stream guidance. Do not guess. Flag for counsellor to clarify on the call.

**Student is in Graduate stage:**
Remove stream guidance section entirely from all three career blocks. Replace UG degrees section with postgraduate and skill path options. Use direct action language throughout: "your next step is", "you are N months away from being hireable in this field."

**Student motivation includes only money:**
Do not editorially comment on this. Do not suggest they should care about meaning. Accept the motivation and write to it honestly — include salary reality prominently, frame career choices around earning trajectory.

**Student scores very low on social energy (below 40%):**
Flag in the thinking style section that roles requiring constant relationship-building or large team coordination may be draining. Do not say the student is introverted. Describe the practical implication.

**Cognitive questions answered incorrectly:**
Do not mention the cognitive questions explicitly. Do not tell the student they got answers wrong. Use the accuracy pattern to inform the reasoning description in thinking style — a student who got all logic questions wrong should not be described as having "strong structured reasoning."

---

## Handover Notes for Claude Code Implementation

1. The PDF engine is already built in ReportLab. The generated text slots into named fields in the Python script. Claude Code does not need to touch the PDF layout.

2. The `career_header()` function creates the purple ruled sub-headers. Always use it for the seven sub-section labels within each career block. Do not create ad-hoc headers.

3. `KeepTogether` is applied only to visual blocks — the salary table and the 30-day box plus counsellor nudge. Text sections flow freely. Do not add KeepTogether to any text-only block.

4. The counsellor nudge at the end of each career section reads: "Have questions about this career section?" with a WhatsApp link. Replace the placeholder number with the live WhatsApp Business number before deployment.

5. Salary data comes from the education context document, not from model generation. The PDF engine reads it from a config file. Keep it separate from the Sonnet prompt.

6. The amber disclaimer on the UG degrees section is verbatim static text. Do not ask Sonnet to generate it.

7. Page breaks are placed after each career block by the PDF engine. Do not include page break instructions in generated content.

---

*End of specification. Raise questions in the project thread before implementation begins.*
