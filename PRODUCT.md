# CareerMap — Product Note

## What it is

CareerMap is a career guidance tool for Indian students aged 14–20. It runs a
12-minute assessment rooted in Big Five personality theory, situational
reasoning, and interest mapping — then generates a personalised result through
an AI guide called the Virtual Edu Guide.

The result is not a list of careers. It is a set of 3 broad domains that match
how the student actually thinks, paired with a coaching question and one
concrete action to try this week. The intent is to start a conversation, not
close one.

---

## The problem it solves

Most Indian students make stream and career choices based on peer pressure,
parental expectation, or proximity (what they've seen, who they know). The
guidance infrastructure — counselors, psychometric tools, aptitude tests — is
expensive, school-dependent, or generic. A Class 9 student in a mid-size city
has almost no access to credible, personalised guidance.

CareerMap makes the first step accessible and free.

---

## Who it's for

**Primary user**: Student, 14–20, Indian secondary school or gap year.
Takes the assessment themselves. Shares the result with a parent.

**Primary buyer**: Parent. The PDF report and counseling sessions are designed
to be purchased by a parent who wants to go deeper after seeing the free result.

**Secondary buyer**: Older student (Class 11/12, gap year) who is self-directed
and willing to pay for a counseling session themselves.

---

## Free tier (current)

The full assessment is free. No login required.

- 8 situational Big Five vignettes (psychometric)
- 5 age-appropriate reasoning questions (cognitive, randomised per grade)
- 7 personal signal questions (interests, aptitude, EQ, flow state)
- 2 motivations
- 2 context signals (location, relocation openness)

**Output**:
- Headline (2–6 words describing how they think, not a job title)
- Observation (2–3 sentences using their own words)
- Coaching question (one open question about a value or contradiction)
- 3 domains — each with specific paths inside and one concrete explore action

The free result is valuable enough to complete and share. It is designed to
leave the student wanting depth — which is where Pro begins.

---

## Pro tier

### Individual features

| Feature | Price (INR) | Description |
|---|---|---|
| Detailed PDF report | ₹299 | Big Five profile bars, 3–5 key strengths, academic path notes, parent summary section |
| 1:1 Edu Counseling session | ₹999 | 45-min video call with a trained counselor, personalised to the student's results |
| Career Handholding (3 months) | ₹2,999 | Monthly 30-min check-ins, goal tracking, curated resource recommendations |
| Expert Session Invites | ₹499/month | Monthly live sessions with industry professionals — founders, doctors, designers, researchers |

### Pro Bundle (recommended)

**₹4,999/year**

Includes: PDF report + 2 counseling sessions + 3 months handholding + all
expert session invites for 12 months.

This is the parent-facing product. It frames career guidance as an ongoing
relationship, not a one-time test.

---

## Monetisation model

**Freemium → upgrade**.

The assessment and basic result are permanently free. The upgrade CTA appears
at the bottom of the results screen, after the student has already seen
something valuable and personal.

The copy is intentionally low-pressure: *"Early access is free. We'll reach
out when Pro launches."* This builds a waitlist before payment infrastructure
is in place, and lets us validate demand before building.

**Why parents buy**:
- The PDF is something they can read, share with family, and keep
- Counseling sessions have a trust signal — a real human who has seen the report
- The Pro Bundle frames it as an investment in the student's transition year

---

## Phased roadmap

### Phase 1 — Live now
- Full assessment flow (grade-gated, randomised cognitive questions)
- AI-generated personalised results (Virtual Edu Guide via Claude Haiku)
- Pro upgrade card with early access email capture

### Phase 2 — Next
- Detailed PDF report generation (parent-first tone, Big Five bars, strengths)
- Expanded AI response schema: `strengths[]`, `academicNote`, `parentSummary`
- Email capture → waitlist management (Mailchimp or Loops)

### Phase 3 — Growth
- Counseling session booking (Calendly integration, payment via Razorpay)
- Expert session scheduling and invite management
- User accounts (OTP auth, result history, PDF download)

### Phase 4 — Scale
- Career Handholding program (structured curriculum, counselor dashboard)
- School/institution partnerships (bulk assessments, teacher dashboard)
- Deeper assessment track for serious users (extended signal set, MBTI-mapped)

---

## Key design principles

1. **Not a game** — every question earns its place by adding signal the AI can use
2. **No verdicts** — results use "might", "could", "worth exploring" — never "best fit" or "suited for"
3. **Grade-aware** — a Class 8 student gets exploration framing; a Class 12 student gets actionable next steps
4. **Indian market-calibrated** — city tier and relocation signals keep suggestions realistic
5. **Parent-first monetisation** — the PDF and counseling are designed for a parent's trust threshold, not a teenager's impulse
