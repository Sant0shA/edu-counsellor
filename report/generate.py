"""
CareerShifu PDF report generator.

Usage:
    python3 report/generate.py --queue-id <integer>

Reads all data from the DB via queue_id. Outputs nothing to stdout on success.
Errors are written to stderr and the report_queue row is updated to 'failed'.
"""

import argparse
import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv

# Load .env from project root (one level up from report/)
load_dotenv(Path(__file__).parent.parent / '.env')

# Add report/ dir to path so sibling imports work when called from project root
sys.path.insert(0, str(Path(__file__).parent))

from pdf_engine import build_pdf
from prompts import (
    GRADE_BUCKET_MAP,
    build_system_prompt,
    prompt_thinking_and_strengths,
    prompt_career,
    prompt_parent_summary,
    prompt_30_days,
    prompt_internships,
)

OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
SONNET = 'anthropic/claude-sonnet-4-5'
HAIKU  = 'anthropic/claude-haiku-4-5'

EM_DASH_CHARS   = '—–'
SUPERLATIVES    = ['exceptional', 'remarkable', 'unique', 'outstanding', 'extraordinary']
PERCENT_PATTERN = re.compile(r'\d+\s*%\s*(match|fit|aligned)', re.IGNORECASE)


# ── Content validation ─────────────────────────────────────────────────────────

def _check_str(val: str):
    for ch in EM_DASH_CHARS:
        if ch in val:
            raise ValueError(f'Response contains em-dash or en-dash')
    for word in SUPERLATIVES:
        if word in val.lower():
            raise ValueError(f'Response contains superlative: {word}')
    if PERCENT_PATTERN.search(val):
        raise ValueError('Response contains percentage match score')


def validate(data):
    """Recursively validate all string values in parsed JSON."""
    if isinstance(data, str):
        _check_str(data)
    elif isinstance(data, dict):
        for v in data.values():
            validate(v)
    elif isinstance(data, list):
        for v in data:
            validate(v)


# ── API call with retry ────────────────────────────────────────────────────────

def call_api(or_key: str, system_prompt: str, user_msg: str,
             model: str, max_tokens: int) -> dict:
    """Call OpenRouter, parse JSON, validate content. Retries once on validation/parse failure."""
    raw = ''
    for attempt in range(2):
        try:
            resp = requests.post(
                OPENROUTER_URL,
                headers={
                    'Authorization': f'Bearer {or_key}',
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://edu.atrios.in',
                    'X-Title': 'CareerShifu',
                },
                json={
                    'model': model,
                    'max_tokens': max_tokens,
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user',   'content': user_msg},
                    ],
                },
                timeout=120,
            )
            resp.raise_for_status()
            raw = resp.json()['choices'][0]['message']['content'].strip()

            # Strip markdown code fences if present
            if raw.startswith('```'):
                raw = re.sub(r'^```[a-z]*\n?', '', raw)
                raw = re.sub(r'\n?```$', '', raw)

            data = json.loads(raw)
            validate(data)
            return data

        except ValueError as e:
            print(f'[generate] Validation failed (attempt {attempt + 1}): {e}', file=sys.stderr)
            if attempt == 0:
                time.sleep(2)
                continue
            print('[generate] Proceeding with unvalidated content after 2 attempts', file=sys.stderr)
            try:
                return json.loads(raw)
            except Exception:
                return {}

        except json.JSONDecodeError as e:
            print(f'[generate] JSON parse error (attempt {attempt + 1}): {e}', file=sys.stderr)
            if attempt == 0:
                time.sleep(2)
                continue
            return {}

        except Exception as e:
            print(f'[generate] API error (attempt {attempt + 1}): {e}', file=sys.stderr)
            if attempt == 0:
                time.sleep(10)
                continue
            raise

    return {}


# ── DB helpers ─────────────────────────────────────────────────────────────────

def db_connect():
    url = os.environ.get('DATABASE_URL')
    if not url:
        raise RuntimeError('DATABASE_URL not set')
    return psycopg2.connect(url, sslmode='require')


def db_update_status(conn, queue_id: int, status: str, error: str = None):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE report_queue SET status = %s, error = %s, updated_at = now() WHERE id = %s",
            (status, error, queue_id),
        )
    conn.commit()


def load_queue_row(conn, queue_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            'SELECT session_id, user_id, email FROM report_queue WHERE id = %s',
            (queue_id,),
        )
        row = cur.fetchone()
    if not row:
        raise RuntimeError(f'No report_queue row for id={queue_id}')
    return {'session_id': row[0], 'user_id': row[1], 'email': row[2]}


def load_latest_session_by_email(conn, email: str) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            '''SELECT s.grade, s.answers, s.result
               FROM sessions s
               JOIN users u ON u.id::TEXT = s.user_id
               WHERE LOWER(u.email) = LOWER(%s)
               ORDER BY s.created_at DESC LIMIT 1''',
            (email,)
        )
        row = cur.fetchone()
    if not row:
        raise RuntimeError(f'No session found for email={email}')
    grade   = row[0]
    answers = row[1] if isinstance(row[1], dict) else json.loads(row[1])
    result  = row[2] if isinstance(row[2], dict) else json.loads(row[2])
    return {'grade': grade, 'answers': answers, 'result': result}


def load_session(conn, session_id: str) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            'SELECT grade, answers, result FROM sessions WHERE id = %s',
            (session_id,),
        )
        row = cur.fetchone()
    if not row:
        raise RuntimeError(f'No session row for id={session_id}')
    grade   = row[0]
    answers = row[1] if isinstance(row[1], dict) else json.loads(row[1])
    result  = row[2] if isinstance(row[2], dict) else json.loads(row[2])
    return {'grade': grade, 'answers': answers, 'result': result}


# ── Student context builder ────────────────────────────────────────────────────

def build_student_context(grade: str, answers: dict, result: dict, email: str) -> dict:
    """Flatten DB rows into a single context dict used by prompts and pdf_engine."""
    domains = result.get('domains', [])

    # Cognitive score
    cog_answers   = answers.get('cognitive', [])
    cog_questions = answers.get('cognitiveQuestions', [])
    cog_score = sum(
        1 for i, a in enumerate(cog_answers)
        if i < len(cog_questions)
        and cog_questions[i].get('correct')
        and a == cog_questions[i]['correct']
    )

    # Psychometric / personal / motivations — flatten option arrays to strings
    def _flatten(arr):
        out = []
        for item in arr:
            if isinstance(item, list):
                out.append(', '.join(str(x) for x in item))
            else:
                out.append(str(item))
        return out

    return {
        'email':      email,
        'grade':      grade,
        'bucket':     GRADE_BUCKET_MAP.get(grade, 'Explorer'),
        'headline':   result.get('headline', ''),
        'observation':result.get('observation', ''),
        'question':   result.get('question', ''),
        'domains':    domains,
        'psychometric': _flatten(answers.get('psychometric', [])),
        'cognitive':    _flatten(cog_answers),
        'personal':     _flatten(answers.get('personal', [])),
        'motivations':  _flatten(answers.get('motivations', [])),
        'cog_score':    cog_score,
    }


# ── Email delivery via Resend ──────────────────────────────────────────────────

def send_report_email(email: str, pdf_bytes: bytes):
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print('[generate] RESEND_API_KEY not set — skipping email', file=sys.stderr)
        return

    pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

    resp = requests.post(
        'https://api.resend.com/emails',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'from': 'CareerShifu <contact@careershifu.com>',
            'to': email,
            'subject': 'Your CareerShifu Report is attached',
            'html': (
                '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1a1a1a">'

                '<p style="margin:0 0 16px;line-height:1.7;color:#333">Hi there,</p>'

                '<p style="margin:0 0 16px;line-height:1.7;color:#333">'
                'Your personalized CareerShifu Report is attached as a PDF.</p>'

                '<p style="margin:0 0 16px;line-height:1.7;color:#333">'
                'We suggest reading it through once without any pressure&#8202;&#8212;&#8202;simply note what resonates '
                'with you and what doesn&#8217;t. Since we haven&#8217;t collected your name or phone number to ensure '
                'your privacy and a spam-free experience, we want you to feel completely in control of your results.</p>'

                '<p style="margin:0 0 6px;font-weight:600;color:#1a1a1a">Take the next step: Guided Journey Mapping</p>'
                '<p style="margin:0 0 16px;line-height:1.7;color:#333">'
                'A report is a great start, but the real magic happens when you turn data into a plan. '
                'If you&#8217;re looking for deeper clarity, our professionals offer a Guided Journey Mapping session. '
                'This is a personalized conversation designed to help you navigate your unique path and ensure your '
                'career journey is a success.</p>'

                '<p style="margin:0 0 6px;line-height:1.7;color:#333">'
                'If you&#8217;d like to explore this guided solution, simply reach out to us:</p>'
                '<p style="margin:0 0 20px;line-height:1.7;color:#333">'
                '&#128172; Message us on WhatsApp at <strong><a href="https://wa.me/919004493138">+91 90044 93138</a></strong></p>'

                '<hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0">'

                '<p style="margin:0 0 6px;font-weight:600;color:#1a1a1a">Know someone figuring out their path?</p>'
                '<p style="margin:0 0 16px;line-height:1.7;color:#333">'
                'Most people who find this useful know at least one other person &#8212; a sibling, a cousin, '
                'a friend &#8212; who\'s in the same spot. Someone who\'d benefit from seeing their own thinking '
                'mapped out, not just a list of popular careers.</p>'
                '<p style="margin:0 0 16px;line-height:1.7;color:#333">'
                'Share <a href="https://careershifu.com" style="color:#a53600">careershifu.com</a> with them '
                'and ask them to use code <strong style="color:#a53600;font-size:15px">GOAL26</strong> at '
                'checkout &#8212; &#8377;100 off their report.</p>'
                '<p style="margin:0 0 24px;line-height:1.7;color:#333">'
                'Tell them it\'s worth the 5 minutes.</p>'

                '<p style="margin:0;line-height:1.7;color:#333">Best regards,<br>'
                '<strong>The CareerShifu Team</strong></p>'
                '</div>'
            ),
            'attachments': [
                {
                    'filename': 'CareerShifu-Report.pdf',
                    'content': pdf_b64,
                }
            ],
        },
        timeout=30,
    )

    if not resp.ok:
        raise RuntimeError(f'Resend API error {resp.status_code}: {resp.text}')


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--queue-id', type=int, required=True)
    args = parser.parse_args()
    queue_id = args.queue_id

    conn = db_connect()

    try:
        # Mark as generating
        db_update_status(conn, queue_id, 'generating')

        # Load data
        queue_row   = load_queue_row(conn, queue_id)
        if queue_row['session_id'] is not None:
            session_row = load_session(conn, queue_row['session_id'])
        else:
            session_row = load_latest_session_by_email(conn, queue_row['email'])

        ctx = build_student_context(
            grade   = session_row['grade'],
            answers = session_row['answers'],
            result  = session_row['result'],
            email   = queue_row['email'],
        )

        or_key = os.environ.get('OPENROUTER_KEY')
        if not or_key:
            raise RuntimeError('OPENROUTER_KEY not set')

        system_prompt = build_system_prompt(ctx)
        domains = ctx['domains']
        grade   = ctx['grade']

        print(f'[generate] Starting 7 API calls for queue_id={queue_id}', file=sys.stderr)

        # Call 1: thinking style + strengths
        thinking_and_strengths = call_api(
            or_key, system_prompt, prompt_thinking_and_strengths(),
            model=SONNET, max_tokens=1200,
        )
        print('[generate] Call 1 done (thinking + strengths)', file=sys.stderr)

        # Calls 2–4: one per domain
        career_results = []
        for i, domain in enumerate(domains[:3]):
            data = call_api(
                or_key, system_prompt, prompt_career(domain, grade),
                model=SONNET, max_tokens=1400,
            )
            career_results.append(data)
            print(f'[generate] Call {i + 2} done (career: {domain["name"]})', file=sys.stderr)

        # Call 5: parent summary
        parent_summary = call_api(
            or_key, system_prompt, prompt_parent_summary(),
            model=SONNET, max_tokens=600,
        )
        print('[generate] Call 5 done (parent summary)', file=sys.stderr)

        # Call 6: 30-day action plans (Haiku)
        next_30_raw = call_api(
            or_key, system_prompt, prompt_30_days(domains[:3]),
            model=HAIKU, max_tokens=600,
        )
        print('[generate] Call 6 done (30-day plans)', file=sys.stderr)

        # Call 7: internships (Haiku)
        internships_raw = call_api(
            or_key, system_prompt, prompt_internships(domains[:3]),
            model=HAIKU, max_tokens=800,
        )
        print('[generate] Call 7 done (internships)', file=sys.stderr)

        # Assemble content dict for pdf_engine
        content = {
            'thinking_and_strengths': thinking_and_strengths,
            'career_1':  career_results[0] if len(career_results) > 0 else {},
            'career_2':  career_results[1] if len(career_results) > 1 else {},
            'career_3':  career_results[2] if len(career_results) > 2 else {},
            'parent_summary': parent_summary,
            'next_30_days': next_30_raw,
            'internships':  internships_raw,
        }

        # Build PDF
        print('[generate] Building PDF...', file=sys.stderr)
        pdf_bytes = build_pdf(ctx, content)
        print(f'[generate] PDF built ({len(pdf_bytes)} bytes)', file=sys.stderr)

        # Email
        print(f'[generate] Sending to {queue_row["email"]}...', file=sys.stderr)
        send_report_email(queue_row['email'], pdf_bytes)
        print('[generate] Email sent', file=sys.stderr)

        db_update_status(conn, queue_id, 'done')
        print(f'[generate] Done. queue_id={queue_id}', file=sys.stderr)

    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f'[generate] FAILED: {e}', file=sys.stderr)
        print(error_msg, file=sys.stderr)
        try:
            db_update_status(conn, queue_id, 'failed', str(e)[:500])
        except Exception:
            pass
        sys.exit(1)

    finally:
        conn.close()


if __name__ == '__main__':
    main()
