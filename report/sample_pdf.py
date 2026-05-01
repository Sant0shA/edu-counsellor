"""Generate a sample PDF with realistic dummy data for review."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pdf_engine import build_pdf

CTX = {
    'email':    'arjun@example.com',
    'grade':    'Class 11',
    'bucket':   'Decision Window',
    'headline': 'The Connector and Builder',
    'observation': (
        'Something stood out — you said you lose track of time when you are building things '
        'and figuring out how they work together. That combination of making and understanding '
        'shows up consistently across your answers. You are drawn to problems that involve '
        'real people, not just abstract puzzles.'
    ),
    'question': 'When you imagine yourself ten years from now, are you in a room with people, '
                'or alone with a problem — and which one feels more like home?',
    'domains': [
        {
            'name': 'Building products people use every day',
            'connection': 'You mentioned losing track of time when building apps and tools. '
                          'Product work sits exactly at that intersection of making and understanding people.',
            'paths': ['Product manager', 'UX designer', 'Growth analyst',
                      'Product marketer', 'Startup founder'],
            'explore': 'Download a free app you use daily and write down three things you would change about it.',
        },
        {
            'name': 'Understanding how the mind shapes decisions',
            'connection': 'Your answers about what you find fascinating — especially how people '
                          'react under pressure — point strongly toward behavioural and cognitive work.',
            'paths': ['Research psychologist', 'Behavioural consultant', 'UX researcher',
                      'Clinical counsellor', 'Policy analyst'],
            'explore': 'Watch a TED talk by Daniel Kahneman on thinking fast and slow.',
        },
        {
            'name': 'Writing stories that change how people think',
            'connection': 'You listed storytelling as something you do in your free time, '
                          'and you admire people who can explain complex ideas simply. '
                          'That is the core skill in journalism, documentary and content strategy.',
            'paths': ['Journalist', 'Documentary filmmaker', 'Content strategist',
                      'Scriptwriter', 'Brand narrator'],
            'explore': 'Read one long-form article on The Ken or Scroll and notice what '
                       'makes the writing hold your attention.',
        },
    ],
    'psychometric': [
        'I would try to mediate and find a compromise',
        'I tend to plan everything out before starting',
        'I prefer working in a group where everyone contributes',
        'I would speak up — I think honesty matters more than comfort',
        'I set myself a deadline and break it into smaller tasks',
    ],
    'cognitive': [
        'Option B',
        'Option A',
        'Option C',
        'Option B',
    ],
    'personal': [
        'Computer science, psychology, economics',
        'Maths and writing — both come easily even when I do not enjoy them',
        'Building side projects, reading about startups, watching documentaries',
        'I would shadow a product manager at a tech startup',
        'Curiosity — people who never stop asking why',
        'I want to work on problems that affect millions of people',
        'Last Tuesday — building a small tool to help my mum track her expenses',
    ],
    'motivations': [
        'Making something that lasts',
        'Understanding how people think and why they do what they do',
    ],
    'cog_score': 3,
    'market_data': [
        {
            'demand': 'Very high across India. Product roles at startups and mid-size tech firms '
                      'have grown 40% in three years. Strong in Bangalore, Mumbai, Delhi.',
            'entry_salary': '₹6–10 LPA',
            'mid_career_salary': '₹18–35 LPA',
            'top_salary': '₹60 LPA+',
        },
        {
            'demand': 'Growing steadily. Research and consulting roles are expanding with '
                      'increasing demand from FMCG, health-tech and policy sectors.',
            'entry_salary': '₹4–7 LPA',
            'mid_career_salary': '₹12–22 LPA',
            'top_salary': '₹40 LPA+',
        },
        {
            'demand': 'Moderate but evolving. Digital-first media, OTT platforms and brand '
                      'content have opened new paths that did not exist five years ago.',
            'entry_salary': '₹3–6 LPA',
            'mid_career_salary': '₹10–18 LPA',
            'top_salary': '₹35 LPA+',
        },
    ],
}

CONTENT = {
    'thinking_and_strengths': {
        'thinking_style': {
            'para1': (
                'You process information by looking for patterns across different areas at once. '
                'You tend to hold multiple ideas in tension before committing — which means you '
                'rarely jump to the first answer, but you also sometimes take longer to start '
                'than others around you.'
            ),
            'para2': (
                'In practice, this shows up as someone who is great at synthesising — '
                'you can connect a psychology reading to a product decision in a way that '
                'most people miss. The flip side is that when there is no clear pattern yet, '
                'you can feel stuck. Starting with a small, concrete action usually breaks that.'
            ),
        },
        'strengths': [
            'Connecting unlike ideas — You draw threads between subjects that most people keep '
            'separate. This is exactly what product and strategy roles reward.',
            'Staying with hard problems — Your answers show a consistent pattern of not giving '
            'up when something is unclear. You described sitting with a broken project for three '
            'hours before it clicked.',
            'Reading people accurately — Across three separate answers, you described noticing '
            'what others are feeling before they say it. This is a rare and practical skill.',
            'Explaining things clearly — You naturally reach for examples when you explain '
            'something. That instinct is what separates good analysts and writers from great ones.',
            'Working across ambiguity — You listed economics, computer science and psychology as '
            'interests. Rather than a lack of focus, that range is a genuine strength in '
            'roles that sit between disciplines.',
        ],
        'blind_spots': [
            'Starting before the plan is complete — You described planning everything before '
            'starting. Worth noticing when a plan becomes a way of delaying the harder step of '
            'actually beginning.',
            'Overcomplicating simple decisions — The same pattern-seeking that helps you '
            'synthesise can sometimes make a straightforward choice feel more complicated than '
            'it needs to be.',
            'Saying yes to too many things — Your motivations include both making lasting things '
            'and understanding people. Both are real. But trying to pursue both at once, especially '
            'in Class 11 and 12, can spread attention thin.',
        ],
    },
    'career_1': {
        'fit_rationale': (
            'You said you lose track of time when building tools, and you listed making things '
            'that last as your strongest motivation. Product work is essentially the discipline '
            'of turning that instinct into a repeatable process — figuring out what people need, '
            'building something that addresses it, and refining it based on how they actually use it. '
            'Your interest in psychology gives you an edge here that most technical people do not have.'
        ),
        'paths': [
            {'name': 'Product manager',
             'description': 'Works with engineers and designers to decide what gets built next and why, '
                            'balancing user needs with business constraints.'},
            {'name': 'UX designer',
             'description': 'Designs how people interact with digital products, from the layout of a '
                            'screen to the logic of a user flow.'},
            {'name': 'Growth analyst',
             'description': 'Studies user behaviour data to identify what drives adoption, retention '
                            'and revenue, then runs experiments to improve those numbers.'},
            {'name': 'Product marketer',
             'description': 'Translates what a product does into language and positioning that makes '
                            'the right people want to try it.'},
            {'name': 'Startup founder',
             'description': 'Builds a business from scratch, which in the early stage means doing '
                            'product, sales, hiring and strategy simultaneously.'},
        ],
        'stream_guidance': (
            'Science with Maths is the most direct path — it keeps every technology and engineering '
            'degree open. Commerce with Maths is also a strong route if you lean toward the business '
            'and strategy side of product. Either way, Maths is important. If your school offers '
            'Applied Maths, confirm with your board whether it satisfies the same prerequisites as '
            'standard Maths before choosing it.'
        ),
        'ug_degrees': [
            {'name': 'Computer Science (B.Tech or B.Sc)',
             'note': 'Gives you the technical foundation to work alongside engineers and build things yourself.'},
            {'name': 'Economics',
             'note': 'Builds the analytical and market-thinking skills that underpin most product and strategy decisions.'},
            {'name': 'Design (B.Des)',
             'note': 'A direct entry into UX and product design, especially at firms where design drives the product.'},
            {'name': 'Business Administration (BBA)',
             'note': 'A broad base for the commercial side of product, particularly useful in early-stage startups.'},
            {'name': 'Psychology (B.A. or B.Sc)',
             'note': 'Increasingly valued in UX research and behavioural product roles.'},
        ],
    },
    'career_2': {
        'fit_rationale': (
            'You listed curiosity as the quality you most admire in role models, and you said '
            'you want to understand how people think and why they do what they do. That is not '
            'a casual interest — it came up in three separate parts of your assessment. '
            'Psychology and behavioural work gives you a structured way to pursue that, and the '
            'range of applications is wider than most people expect.'
        ),
        'paths': [
            {'name': 'Research psychologist',
             'description': 'Designs and runs studies to understand how people think, feel and behave, '
                            'publishing findings or applying them in applied settings.'},
            {'name': 'Behavioural consultant',
             'description': 'Helps organisations change how their customers or employees make decisions '
                            'by applying principles from psychology and economics.'},
            {'name': 'UX researcher',
             'description': 'Talks to users, runs usability tests and synthesises insights to help '
                            'product teams build things people actually want.'},
            {'name': 'Clinical counsellor',
             'description': 'Works one-on-one with individuals to help them understand and manage '
                            'mental health challenges, building a sustained relationship over time.'},
            {'name': 'Policy analyst',
             'description': 'Studies how people respond to rules and incentives, advising governments '
                            'or organisations on how to design better policies.'},
        ],
        'stream_guidance': (
            'Humanities with Psychology as an elective is the most direct path, though it is '
            'not the only one. Science students can still pursue a Psychology degree at most '
            'universities. If your school offers Psychology as a subject, taking it now gives '
            'you a head start. Economics alongside Psychology is a strong combination for '
            'behavioural work specifically.'
        ),
        'ug_degrees': [
            {'name': 'Psychology (B.A. or B.Sc)',
             'note': 'The core degree for most clinical, research and academic routes in this field.'},
            {'name': 'Economics (with behavioural focus)',
             'note': 'Opens the consulting and policy track, especially at institutions with a strong social science faculty.'},
            {'name': 'Cognitive Science',
             'note': 'Combines psychology, linguistics and computer science — a strong fit if you are interested in AI and human-computer interaction.'},
            {'name': 'Sociology',
             'note': 'Broader social science foundation, useful for policy, research and consulting work.'},
            {'name': 'Liberal Arts (Psychology major)',
             'note': 'Flexible degree that allows you to combine psychology with economics, philosophy or design.'},
        ],
    },
    'career_3': {
        'fit_rationale': (
            'You listed storytelling as something you do in your free time, and the quality you '
            'most admire is the ability to explain complex ideas simply. Those two things together '
            'describe exactly what journalism, documentary work and content strategy require. '
            'This is the domain that might surprise you — because it does not feel like a career '
            'path the way engineering or medicine does. But the demand for people who can '
            'make complicated things clear is genuine and growing.'
        ),
        'paths': [
            {'name': 'Journalist',
             'description': 'Reports and writes stories for newspapers, magazines, digital platforms '
                            'or broadcast, often specialising in a beat like technology, business or politics.'},
            {'name': 'Documentary filmmaker',
             'description': 'Researches, scripts and produces long-form films that explore real events, '
                            'people or ideas in depth.'},
            {'name': 'Content strategist',
             'description': 'Plans what content a brand or publication should create, for whom, '
                            'and how it should be structured to achieve a specific goal.'},
            {'name': 'Scriptwriter',
             'description': 'Writes scripts for films, web series, podcasts or corporate videos, '
                            'shaping how stories are told in audio and visual formats.'},
            {'name': 'Brand narrator',
             'description': 'Develops the voice, tone and story of a company — covering everything '
                            'from taglines to long-form brand journalism.'},
        ],
        'stream_guidance': (
            'Humanities is the natural fit, but it is not required. Strong writers come from every '
            'stream. English as a subject matters much more than stream choice here. If your school '
            'offers Media Studies or Mass Communication as an elective, it is worth taking alongside '
            'whatever stream you choose. What you produce outside school — a blog, a newsletter, '
            'a short film — will matter more to admissions committees in this field than your board marks.'
        ),
        'ug_degrees': [
            {'name': 'Journalism and Mass Communication (B.A.)',
             'note': 'Direct entry into newsrooms, production houses and digital media companies.'},
            {'name': 'English Literature',
             'note': 'Builds the reading and analytical depth that separates good writers from precise ones.'},
            {'name': 'Liberal Arts (Communication major)',
             'note': 'Combines storytelling with social science, useful for policy communication and long-form journalism.'},
            {'name': 'Film and Television Production',
             'note': 'Practical degree for documentary, web series and short-form content paths.'},
            {'name': 'Economics or Political Science',
             'note': 'Counterintuitive but strong — specialist journalists with subject expertise are in high demand.'},
        ],
    },
    'parent_summary': {
        'para1': (
            'Your child thinks by connecting ideas across different areas — psychology, technology, '
            'economics — rather than going deep into one subject early. That is not a lack of '
            'direction. It is a thinking style that tends to show up well in roles that sit between '
            'disciplines, which is where a lot of the most interesting work happens.'
        ),
        'para2': (
            'The assessment identified three domains worth exploring: building digital products, '
            'understanding how people make decisions, and communicating complex ideas as stories. '
            'These are not random — they connect directly to what your child described losing '
            'track of time doing, and to the qualities they most admire in people.'
        ),
        'para3': (
            'For stream choice, Science with Maths keeps the widest range of options open, '
            'including product, tech and psychology. The most useful conversation to have together '
            'is not "what career do you want?" but "which of these three directions feels closest '
            'to what you already do for fun?" That answer is usually more reliable.'
        ),
    },
    'next_30_days': {
        'domain_1': (
            'Download an app you use every day and spend 20 minutes writing down three things '
            'that frustrate you about it and one thing you would change. Post a short write-up '
            'on your notes app or a blog. Then read "Inspired" by Marty Cagan — the first '
            'three chapters are available free online and describe what product managers actually do.'
        ),
        'domain_2': (
            'Watch the first episode of "The Mind, Explained" on Netflix and write down two '
            'questions it raises for you. Then look up the syllabus for Psychology at one '
            'university you are curious about — see what they study in Year 1. If your school '
            'offers Psychology as a subject next year, find out whether you can add it.'
        ),
        'domain_3': (
            'Read one long article on The Ken (one free article per month, no paywall) and '
            'notice specifically how the writer opens and closes the piece. Then write 300 words '
            'about something you find genuinely interesting — not for anyone to read, just to '
            'see what you reach for when you have no brief. Save it. Read it in a week.'
        ),
    },
    'internships': {
        'domain_1': [
            {
                'name': 'Early-stage startup (product or operations intern)',
                'type': 'Internship',
                'how': 'Search Internshala and AngelList India for product intern roles. '
                       'Filter for startups under 50 people — you will get more real work '
                       'and direct access to founders.',
            },
            {
                'name': 'Design or product agency',
                'type': 'Internship',
                'how': 'Agencies like Obvious, Uncommon and Elephant Design occasionally '
                       'take interns. Email directly with a short portfolio of any projects '
                       'you have built, even personal ones.',
            },
            {
                'name': 'Product teardown club',
                'type': 'Project',
                'how': 'Start or join a group that reviews and critiques apps weekly. '
                       'Post the teardowns publicly on LinkedIn or a blog — this builds '
                       'a visible track record.',
            },
            {
                'name': 'Hackathon participant',
                'type': 'Project',
                'how': 'Devfolio and Unstop list student hackathons across India. '
                       'A winning or placed entry at a hackathon carries real weight '
                       'with product teams at tech companies.',
            },
        ],
        'domain_2': [
            {
                'name': 'Psychology department research assistant',
                'type': 'Volunteer',
                'how': 'Email professors at local colleges or IITs directly, offering to '
                       'assist with data collection or literature review. Most are open to '
                       'motivated high school students.',
            },
            {
                'name': 'NGO with a mental health or counselling focus',
                'type': 'Volunteer',
                'how': 'iCall, Vandrevala Foundation and Snehi all have volunteer programmes. '
                       'Check their websites for application details.',
            },
            {
                'name': 'Behavioural research project',
                'type': 'Project',
                'how': 'Design a small experiment — a survey, an observation study — on a '
                       'question you find interesting. Submit it to school science fairs or '
                       'post it on Medium.',
            },
            {
                'name': 'Counsellor shadow',
                'type': 'Internship',
                'how': 'Ask your school counsellor if you can observe a few sessions (with '
                       'consent). If not, ask to interview them about their work — most are '
                       'glad to talk.',
            },
        ],
        'domain_3': [
            {
                'name': 'School or college newspaper',
                'type': 'Club',
                'how': 'Start writing for your school publication now, or launch one if it '
                       'does not exist. Published work, even at school level, is what '
                       'journalism programmes look for.',
            },
            {
                'name': 'Digital news outlet (student contributor)',
                'type': 'Internship',
                'how': 'Youth Ki Awaaz, The Quint and The News Minute accept pitches from '
                       'student writers. Send a pitch with a story idea, not a general application.',
            },
            {
                'name': 'Short documentary project',
                'type': 'Project',
                'how': 'Shoot and edit a 3–5 minute documentary about something in your '
                       'neighbourhood using a phone. Submit to student film festivals — '
                       'MIFF and Kashish list student categories.',
            },
            {
                'name': 'Content writing internship',
                'type': 'Internship',
                'how': 'Internshala has hundreds of content and copywriting internships. '
                       'Choose companies whose products you find interesting — it makes '
                       'the writing better and the reference stronger.',
            },
        ],
    },
}

if __name__ == '__main__':
    out_path = Path(__file__).parent.parent / 'sample_report.pdf'
    pdf_bytes = build_pdf(CTX, CONTENT)
    out_path.write_bytes(pdf_bytes)
    print(f'PDF written to {out_path} ({len(pdf_bytes):,} bytes)')
