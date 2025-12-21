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

# =============================================================================
# PROMPT TEMPLATES
# =============================================================================

BASE_PERSONA = """You are writing LinkedIn posts for Clifford (Darko) Opoku-Sarkodie, a Creative Technologist, Web Developer, and CS Student.

ABOUT THE VOICE:
- Young, energetic developer passionate about web development and creativity
- Balances technical skills with design thinking and UI/UX expertise
- CS student on a learning journey - shares real discoveries and "aha moments"
- Enthusiastic about building beautiful, functional web experiences
- Community-focused and open to collaboration
- Growing professional navigating the tech industry"""

TEMPLATES = {
    "standard": """
OBJECTIVE: Write a standard update about recent coding activity.

STRUCTURE:
1. Hook (1-2 sentences): Relatable question, observation, or story. NEVER start with "As a..."
2. Body (3-5 sentences): Develop the idea with a specific example or experience
3. Insight (1-2 sentences): What you learned and why it matters
4. Call to Action (1 sentence): Engage your network
5. Hashtags: 8-12 relevant hashtags (new line)

TONE: Genuine, relatable, enthusiastic but professional.
""",

    "build_in_public": """
OBJECTIVE: Write a "Build in Public" post sharing progress, struggles, and wins.

STRUCTURE:
1. Hook: "I just built X" or "Here's what I'm working on..."
2. Context: What problem does it solve? Why build it?
3. Technical Detail: Mention the stack (Next.js, Python, Tailwind, etc.) but keep it accessible.
4. The Struggle/Win: Mention one challenge overcome or one cool feature.
5. Next Steps: What's coming next?
6. Call to Action: "Check out the repo" or "What do you think about [feature]?"
7. Hashtags: #buildinpublic #sideproject #coding #webdev ...

TONE: Transparent, vulnerable, excited, "maker" energy.
""",

    "thought_leadership": """
OBJECTIVE: Write a thought leadership post sharing an opinion or insight about tech/dev.

STRUCTURE:
1. Hook: A bold statement, contrarian view, or strong observation about the industry.
2. The Argument: Why do you think this? Back it up with recent experience.
3. The Nuance: Acknowledge counterpoints or limitations.
4. The Takeaway: A solid piece of advice for other devs.
5. Call to Action: "Do you agree?" or "How do you handle X?"
6. Hashtags: #techtalk #developer #careeradvice #techtrends ...

TONE: Confident, insightful, professional, discussion-starter.
""",

    "job_search": """
OBJECTIVE: Write a post showcasing skills to potential employers/clients (subtly).

STRUCTURE:
1. Hook: "One thing I love about [specific tech] is..."
2. Demonstration: Describe a recent project using this tech.
3. The Value: Explain how this solved a real user problem or improved performance.
4. Soft Skill: Mention collaboration, learning, or problem-solving.
5. Call to Action: "I'm open to roles involving [tech]. Let's connect!"
6. Hashtags: #opentowork #fullstack #react #python #hiring ...

TONE: Professional, capable, results-oriented, eager to contribute.
"""
}

def get_prompt_for_style(style="standard"):
    """Get the full system prompt for a specific style."""
    template = TEMPLATES.get(style, TEMPLATES["standard"])
    
    return f"""{BASE_PERSONA}

{template}

WORD COUNT & FORMAT:
- Target: 200-300 words (1,300-1,600 characters) - LinkedIn's optimal length
- Multiple short paragraphs for readability
- Conversational, authentic, like talking to peers
- Include 3-4 emojis naturally (🎨 🚀 💡 ✨ 🔥 💻 🎯 📱 ⚡ 🧠)
- NO markdown formatting, NO code blocks, NO bullet points
- Keep it punchy and engaging

MANDATORY:
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


def generate_post_with_ai(context_data, groq_api_key: str = None, style: str = "standard"):
    """Use Groq/Gemini-style model to draft a LinkedIn post based on context.
    
    Args:
        context_data: Dictionary with activity context
        groq_api_key: Optional per-user Groq API key. Falls back to env var if not provided.
        style: Post style template ('standard', 'build_in_public', 'thought_leadership', 'job_search')
    """
    print(f"🧠 AI service: generating {style} post...")
    
    # Determine which API key to use
    api_key = groq_api_key or GROQ_API_KEY
    if not api_key:
        print("⚠️  No Groq API key provided (neither user key nor GROQ_API_KEY env var)")
        return None
    
    # Create client with the appropriate key
    try:
        active_client = Groq(api_key=api_key)
    except Exception as e:
        print(f"⚠️  Failed to initialize Groq client: {e}")
        return None
    
    # Select prompt based on style
    system_prompt = get_prompt_for_style(style)
    
    # Format the prompt based on context type
    user_content = ""
    
    if context_data.get('type') == 'push':
        commits = context_data.get('commits', 0)
        repo = context_data.get('repo', 'unknown-repo')
        description = context_data.get('description', '')
        
        user_content = f"""
        Write a LinkedIn post about my recent coding session.
        Activity: I pushed {commits} commits to the repository '{repo}'.
        Context: The project involves: {description}
        My Role: I'm actively building and improving this project.
        Key Takeaway: Consistent progress matters, even small commits add up.
        """
        
    elif context_data.get('type') == 'pull_request':
        title = context_data.get('title', 'Unknown PR')
        repo = context_data.get('repo', 'unknown-repo')
        body = context_data.get('body', '')
        merged = context_data.get('merged', False)
        
        state_str = "merged" if merged else "opened"
        
        user_content = f"""
        Write a LinkedIn post about a Pull Request I just {state_str}.
        Repository: {repo}
        PR Title: {title}
        PR Description: {body}
        Significance: This represents a distinct feature or fix I contributed.
        Focus: Collaboration, code quality, and shipping features.
        """
        
    elif context_data.get('type') == 'new_repo':
        repo = context_data.get('repo', 'New Project')
        description = context_data.get('description', '')
        language = context_data.get('language', 'Code')
        
        user_content = f"""
        Write a LinkedIn post about a new project I just started.
        Project Name: {repo}
        Description: {description}
        Main Language/Tech: {language}
        Goal: I'm starting this from scratch to solve a problem/learn something new.
        Excitement: High - the beginning of a new journey.
        """
        
    else:
        # Generic or manual context
        topic = context_data.get('topic', 'Coding & Development')
        details = context_data.get('details', 'Just sharing some thoughts on my developer journey.')
        
        user_content = f"""
        Write a LinkedIn post about: {topic}
        Details: {details}
        Context: I want to share this update with my professional network.
        """

    try:
        chat_completion = active_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_content,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=600,
        )
        
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        print(f"❌ Error generating post with Groq: {e}")
        return None
