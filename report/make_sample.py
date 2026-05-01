"""Generate a sample PDF using reference_report_engine.py data."""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent))

# reference_report_engine runs doc.build() at module level — mock it out
with patch('os.makedirs'), patch('reportlab.platypus.SimpleDocTemplate') as _mock_doc:
    _mock_doc.return_value = MagicMock()
    from reference_report_engine import STUDENT, CAREERS
from education_context import get_domain_context
from pdf_engine import build_pdf


def _career_content(career: dict, grade: str) -> dict:
    paths = [{'name': t, 'description': d} for t, d in career['paths']]
    degrees = [{'name': n, 'note': d} for n, d in career['ug_degrees']]
    return {
        'fit_rationale': career['fit'],
        'paths': paths,
        'stream_guidance': career.get('stream', ''),
        'ug_degrees': degrees,
    }


def build_sample():
    grade = 'Class 11'
    domains = [{'name': c['title'], 'connection': c['fit'][:80]} for c in CAREERS]

    ts = STUDENT['thinking_style']
    mid = len(ts) // 2
    # split at sentence boundary near the middle
    split = ts.find('. ', mid)
    para1 = ts[:split + 1].strip() if split != -1 else ts[:mid].strip()
    para2 = ts[split + 2:].strip() if split != -1 else ts[mid:].strip()

    ctx = {
        'email':       'sample@careermap.in',
        'grade':       grade,
        'bucket':      'Decision Window',
        'headline':    STUDENT['headline'],
        'observation': '',
        'question':    '',
        'domains':     domains,
        'psychometric': [],
        'cognitive':    [],
        'personal':     [],
        'motivations':  [],
        'cog_score':    3,
        'market_data':  [get_domain_context(c['title']) for c in CAREERS],
    }

    content = {
        'thinking_and_strengths': {
            'thinking_style': {'para1': para1, 'para2': para2},
            'strengths':   [f"{t} — {d}" for t, d in STUDENT['strengths']],
            'blind_spots': [f"{t} — {d}" for t, d in STUDENT['blindspots']],
        },
        'career_1': _career_content(CAREERS[0], grade),
        'career_2': _career_content(CAREERS[1], grade),
        'career_3': _career_content(CAREERS[2], grade),
        'parent_summary': {
            'para1': (
                'Your child has strong analytical reasoning and genuine curiosity about why people '
                'think and behave the way they do.'
            ),
            'para2': (
                'The three domains in this report — research and storytelling, building ideas, '
                'and data-driven policy — all have financially solid careers attached to them.'
            ),
            'para3': (
                'One internship before Class 12 exams changes their application story significantly. '
                'That is worth helping them create time for in the next few months.'
            ),
        },
        'next_30_days': {
            'domain_1': CAREERS[0]['thirty_day'],
            'domain_2': CAREERS[1]['thirty_day'],
            'domain_3': CAREERS[2]['thirty_day'],
        },
        'internships': {
            'domain_1': [
                {'name': n, 'type': 'Internship', 'how': w}
                for n, w in CAREERS[0]['internships']
            ],
            'domain_2': [
                {'name': n, 'type': 'Internship', 'how': w}
                for n, w in CAREERS[1]['internships']
            ],
            'domain_3': [
                {'name': n, 'type': 'Internship', 'how': w}
                for n, w in CAREERS[2]['internships']
            ],
        },
    }

    pdf_bytes = build_pdf(ctx, content)
    out = Path(__file__).parent / 'sample_report.pdf'
    out.write_bytes(pdf_bytes)
    print(f'Written: {out}  ({len(pdf_bytes):,} bytes)')


if __name__ == '__main__':
    build_sample()
