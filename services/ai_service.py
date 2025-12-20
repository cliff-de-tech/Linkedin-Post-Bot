import os
import datetime
from dateutil import parser
from groq import Groq

# Load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, will use system environment variables

# Load config
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GITHUB_USERNAME = os.getenv('GITHUB_USERNAME', 'cliff-de-tech')

# Persona moved from main bot
LINKEDIN_PERSONA = """You are writing LinkedIn posts for Clifford (Darko) Opoku-Sarkodie, a Creative Technologist, Web Developer, and CS Student.

ABOUT THE VOICE:
- Young, energetic developer passionate about web development and creativity
- Balances technical skills with design thinking and UI/UX expertise
- CS student on a learning journey - shares real discoveries and "aha moments"
- Enthusiastic about building beautiful, functional web experiences
- Community-focused and open to collaboration
- Growing professional navigating the tech industry

LINKEDIN POST STRUCTURE:
1. Hook (1-2 sentences): Relatable question, observation, or story
   - CRITICAL: NEVER start with "As I", "As a", or any repetitive phrases from previous posts
   - Be creative and unpredictable - every post opening must be completely different
   - Vary your sentence structure, tone, and approach each time
2. Body (3-5 sentences): Develop the idea with a specific example or experience
3. Insight (1-2 sentences): What you learned and why it matters
4. Call to Action (1 sentence): Engage your network
5. Hashtags: 8-12 relevant hashtags (new line)

WORD COUNT & FORMAT:
- Target: 200-300 words (1,300-1,600 characters) - LinkedIn's optimal length
- Multiple short paragraphs for readability
- Conversational, authentic, like talking to peers
- Include 3-4 emojis naturally (🎨 🚀 💡 ✨ 🔥 💻 🎯 📱 ⚡ 🧠)
- NO markdown formatting, NO code blocks, NO bullet points
- Keep it punchy and engaging

TONE:
- Genuine and relatable
- Enthusiastic but not forced
- Supportive and helpful
- Growth-minded learner
- Creative problem-solver

TOPICS:
- Web development wins and lessons
- Design-code collaboration
- Learning moments as a student
- UI/UX insights
- Building beautiful interfaces
- Tech career navigation
- Overcoming development challenges
- Growing as a dev-designer hybrid

MANDATORY:
- Include 8-12 hashtags on a new line
- Posts must feel COMPLETE - no cutting off mid-sentence
- Balance technical insight with accessibility
- Share learning, not just achievements"""


# Initialize Groq client (guarded)
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception:
        client = None


def generate_post_with_ai(context_data):
    """Use Groq/Gemini-style model to draft a LinkedIn post based on context."""
    print("🧠 AI service: generating post...")
    try:
        if isinstance(context_data, dict) and context_data.get('type') == 'push':
            context_prompt = f"""
GitHub Activity: User just pushed {context_data['commits']} commit(s) to repo '{context_data['repo']}' {context_data['date']}.
Repo: https://github.com/{context_data['full_repo']}

WRITE A COMPLETE LINKEDIN POST - MUST INCLUDE EVERYTHING BELOW:

Structure (200-300 words total):
1. Hook (1-2 sentences) - relatable moment about coding/building
   - CRITICAL: Avoid ALL repetitive opening patterns - be completely unique each time
2. Story (3-4 sentences) - what this code work involved and what you learned  
3. Value (1-2 sentences) - why it matters or insight gained
4. Question (1 sentence) - ask your network something
5. HASHTAGS (8-12 hashtags on separate line, space-separated)

Requirements:
- Write the FULL post, do NOT cut off early
- ALWAYS end with hashtags
- Explicitly include this repo link once in the body: https://github.com/{context_data['full_repo']}
- Vary the hook/story wording each run; avoid repeating phrasing or metaphors from prior posts
- Include 3-4 emojis naturally: 🎨 🚀 💡 ✨
- Make it conversational and authentic
- FINISH THE ENTIRE POST before stopping

{LINKEDIN_PERSONA}
"""

        elif isinstance(context_data, dict) and context_data.get('type') == 'pull_request':
            context_prompt = f"""
GitHub Activity: User just {context_data['action'].upper()} a pull request on '{context_data['repo']}' {context_data['date']}.
Repo: https://github.com/{context_data['full_repo']}

WRITE A COMPLETE LINKEDIN POST - MUST INCLUDE EVERYTHING BELOW:

Structure (200-300 words total):
1. Hook (1-2 sentences) - relatable moment about collaboration or code review
2. Story (3-4 sentences) - what the PR involved and what surprised/excited you
3. Lesson (1-2 sentences) - what you learned about teamwork or design
4. Question (1 sentence) - engage your network
5. HASHTAGS (8-12 hashtags on separate line, space-separated)

Requirements:
- Write the FULL post, do NOT cut off early
- ALWAYS end with hashtags
- Explicitly include this repo link once in the body: https://github.com/{context_data['full_repo']}
- Vary the hook/story wording each run; avoid repeating phrasing or metaphors from prior posts
- Include 3-4 emojis naturally: 🎨 🚀 💡 ✨
- Make it conversational and authentic
- FINISH THE ENTIRE POST before stopping

{LINKEDIN_PERSONA}
"""

        elif isinstance(context_data, dict) and context_data.get('type') == 'new_repo':
            context_prompt = f"""
GitHub Activity: User just created a new repository called '{context_data['repo']}' {context_data['date']}.
Repo: https://github.com/{context_data['full_repo']}

WRITE A COMPLETE LINKEDIN POST - MUST INCLUDE EVERYTHING BELOW:

Structure (200-300 words total):
1. Hook (1-2 sentences) - why you created this project
2. Story (3-4 sentences) - the problem, inspiration, or challenge
3. Vision (1-2 sentences) - what's the potential or purpose
4. Invite (1 sentence) - call for collaboration or feedback
5. HASHTAGS (8-12 hashtags on separate line, space-separated)

Requirements:
- Write the FULL post, do NOT cut off early
- ALWAYS end with hashtags
- Explicitly include this repo link once in the body: https://github.com/{context_data['full_repo']}
- Vary the hook/story wording each run; avoid repeating phrasing or metaphors from prior posts
- Include 3-4 emojis naturally: 🎨 🚀 💡 ✨
- Make it conversational and authentic
- FINISH THE ENTIRE POST before stopping

{LINKEDIN_PERSONA}
"""

        elif isinstance(context_data, dict) and context_data.get('type') == 'milestone':
            stats = context_data
            context_prompt = f"""
GitHub Milestone: 
- {stats['public_repos']} public repositories
- {stats['followers']} followers
- Location: {stats.get('location', 'Unknown')}
GitHub profile: https://github.com/{GITHUB_USERNAME}

Write a COMPLETE LinkedIn post that MUST include ALL of these:
1. Reflection (1-2 sentences) - moment of pride/reflection
2. Journey (3-4 sentences) - key milestones, lessons, growth
3. Community (1-2 sentences) - thank people who helped
4. Future (1 sentence) - what's next
5. CRITICAL: End with EXACTLY 8-12 HASHTAGS on a new line, separated by spaces
6. Include 3-4 emojis (🎨 🚀 💡 ✨) naturally throughout

Make it 200-300 words. Do NOT cut off mid-sentence.

{LINKEDIN_PERSONA}
"""

        else:
            context_prompt = f"""Write a COMPLETE LINKEDIN POST - MUST INCLUDE EVERYTHING BELOW:

Structure (200-300 words total):
1. Hook (1-2 sentences) - relatable observation about web dev/tech
2. Insight (3-4 sentences) - share a lesson or perspective
3. Value (1-2 sentences) - why it matters to others
4. Question (1 sentence) - engage your network
5. HASHTAGS (8-12 hashtags on separate line, space-separated)

Requirements:
- Write the FULL post, do NOT cut off early
- ALWAYS end with hashtags
- Vary the hook/story wording each run; avoid repeating phrasing or metaphors from prior posts
- Include 3-4 emojis naturally: 🎨 🚀 💡 ✨
- Make it conversational and authentic
- FINISH THE ENTIRE POST before stopping

{LINKEDIN_PERSONA}
"""

        # Call Groq API
        if not client:
            print("⚠️  Groq client not initialized (GROQ_API_KEY missing)")
            return None

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": context_prompt}],
            temperature=0.7,
            max_tokens=3000,
        )

        post_content = response.choices[0].message.content.strip()
        return post_content

    except Exception as e:
        print(f"⚠️  Error generating post with Groq: {e}")
        return None
