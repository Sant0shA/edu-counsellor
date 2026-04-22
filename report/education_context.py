# Static market demand and salary data for Indian career domains.
# Figures are illustrative ranges sourced from NASSCOM, ASSOCHAM, and Glassdoor India (2023-24).

DOMAIN_MARKET_DATA = {
    'technology': {
        'keywords': ['technology', 'computing', 'software', 'engineering', 'data', 'ai', 'cyber',
                     'coding', 'programming', 'digital', 'tech', 'computer', 'machine learning'],
        'demand': 'High and growing',
        'entry_salary': '4–8 LPA',
        'mid_career_salary': '12–25 LPA',
        'top_salary': '40 LPA+',
        'note': 'Fastest-growing sector in India; remote-first roles widely available; strong startup ecosystem',
    },
    'healthcare': {
        'keywords': ['medicine', 'healthcare', 'health', 'medical', 'clinical', 'nursing',
                     'pharmacy', 'biotech', 'biology', 'biomedical', 'public health'],
        'demand': 'High',
        'entry_salary': '4–7 LPA',
        'mid_career_salary': '10–20 LPA',
        'top_salary': '30 LPA+',
        'note': 'Sector expanding post-2020; healthcare infrastructure investment growing across tier-2 cities',
    },
    'business': {
        'keywords': ['business', 'finance', 'commerce', 'management', 'consulting', 'marketing',
                     'banking', 'economics', 'entrepreneurship', 'startup', 'strategy', 'investment'],
        'demand': 'High',
        'entry_salary': '4–8 LPA',
        'mid_career_salary': '12–30 LPA',
        'top_salary': '50 LPA+',
        'note': 'Broad sector with high variance; consulting and investment banking at the top end',
    },
    'design': {
        'keywords': ['design', 'art', 'creative', 'ux', 'ui', 'graphic', 'fashion',
                     'product design', 'animation', 'film', 'photography', 'visual', 'aesthetics'],
        'demand': 'Growing',
        'entry_salary': '3–6 LPA',
        'mid_career_salary': '8–18 LPA',
        'top_salary': '25 LPA+',
        'note': 'Strong demand from tech companies for UX and product designers; creative fields have high ceiling for top talent',
    },
    'law': {
        'keywords': ['law', 'legal', 'policy', 'governance', 'advocacy', 'rights', 'justice',
                     'regulation', 'compliance', 'political', 'public policy'],
        'demand': 'Stable',
        'entry_salary': '3–6 LPA',
        'mid_career_salary': '8–20 LPA',
        'top_salary': '35 LPA+',
        'note': 'Corporate and tech law growing fastest; public interest law has moderate salaries but significant social impact',
    },
    'science': {
        'keywords': ['science', 'research', 'physics', 'chemistry', 'mathematics', 'statistics',
                     'environment', 'ecology', 'astronomy', 'geology', 'materials', 'analysis'],
        'demand': 'Growing',
        'entry_salary': '3–6 LPA',
        'mid_career_salary': '8–16 LPA',
        'top_salary': '25 LPA+',
        'note': 'Government research institutions stable; private sector R&D expanding in pharma, materials, and climate tech',
    },
    'education': {
        'keywords': ['education', 'teaching', 'academics', 'curriculum', 'learning', 'training',
                     'coaching', 'mentoring', 'edtech', 'pedagogy', 'instruction'],
        'demand': 'Stable',
        'entry_salary': '3–5 LPA',
        'mid_career_salary': '6–12 LPA',
        'top_salary': '18 LPA+',
        'note': 'EdTech sector offers significantly higher salaries; leadership roles in top institutions are well-compensated',
    },
    'communication': {
        'keywords': ['media', 'journalism', 'communication', 'writing', 'content', 'public relations',
                     'broadcasting', 'publishing', 'storytelling', 'documentary', 'digital media'],
        'demand': 'Stable',
        'entry_salary': '3–5 LPA',
        'mid_career_salary': '7–15 LPA',
        'top_salary': '25 LPA+',
        'note': 'Digital media and content creation growing; independent creators and newsletter writers building large audiences',
    },
    'social': {
        'keywords': ['social work', 'ngo', 'development', 'welfare', 'psychology', 'counseling',
                     'community', 'nonprofit', 'humanitarian', 'social impact', 'mental health'],
        'demand': 'Stable',
        'entry_salary': '2.5–5 LPA',
        'mid_career_salary': '6–12 LPA',
        'top_salary': '18 LPA+',
        'note': 'International NGOs and corporate CSR roles offer higher salaries; sector growth tied to ESG and mental health awareness',
    },
    'sports': {
        'keywords': ['sports', 'fitness', 'athletics', 'wellness', 'physiotherapy', 'performance',
                     'exercise science', 'nutrition', 'physical education', 'recreational'],
        'demand': 'Growing',
        'entry_salary': '3–5 LPA',
        'mid_career_salary': '6–15 LPA',
        'top_salary': '20 LPA+',
        'note': "Sports management, sports science, and performance coaching growing with India's expanding sports ecosystem",
    },
}

SALARY_DISCLAIMER = (
    "Salary ranges are illustrative and reflect broad market patterns for India as of 2023–24. "
    "Actual compensation varies significantly by employer, city, specialisation, and individual performance. "
    "Source: NASSCOM, Glassdoor India, ASSOCHAM industry reports."
)

UG_AMBER_NOTE = (
    "Degree options listed are indicative starting points for exploration, not an exhaustive list. "
    "Entry requirements, course structures, and career outcomes vary across institutions and boards. "
    "We recommend verifying current admission criteria and syllabi directly with institutions."
)

COUNSELLOR_CALLOUT = (
    "Want to talk through this report with someone? "
    "Message us on WhatsApp at [WhatsApp Number] to schedule a session. "
    "Bring your questions, your doubts, and anything that did not feel right."
)


def get_domain_context(domain_name: str) -> dict:
    """Returns market data for a domain by fuzzy keyword matching."""
    name_lower = domain_name.lower()

    best_key = 'business'
    best_score = 0

    for key, data in DOMAIN_MARKET_DATA.items():
        score = sum(1 for kw in data['keywords'] if kw in name_lower)
        if score > best_score:
            best_score = score
            best_key = key

    return DOMAIN_MARKET_DATA[best_key]
