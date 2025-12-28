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
# CREDENTIAL CLASSIFICATION:
# - GROQ_API_KEY: (A) App-level secret OR (C) User-provided - can be overridden per-user via groq_api_key param
# - GITHUB_USERNAME: (C) User-provided identifier - default for CLI, overridden per-user in web
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GITHUB_USERNAME = os.getenv('GITHUB_USERNAME', 'cliff-de-tech')  # Fallback for CLI mode only

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
""",

    # New tones for variety in Bot Mode
    "excited": """
OBJECTIVE: Write a HIGH ENERGY post celebrating coding momentum!

STRUCTURE:
1. Hook: Start with excitement - "Just shipped!", "Finally got it working!", "BIG win today!"
2. The Win: What did you accomplish? Make it sound exciting!
3. The Feeling: How does it feel? Share the dopamine rush!
4. Quick Insight: One lesson or realization
5. Call to Action: "What are you building?" "Celebrate with me!"
6. Hashtags: energetic and upbeat

TONE: Enthusiastic, celebratory, infectious energy, capital letters okay, lots of emojis! 🎉🚀
""",

    "thoughtful": """
OBJECTIVE: Write a REFLECTIVE post sharing deeper insights from coding.

STRUCTURE:
1. Hook: A thoughtful observation or question about the dev experience
2. Context: What prompted this reflection?
3. The Insight: What did you realize? Go deeper than surface level.
4. Application: How does this change your approach?
5. Call to Action: "What's your experience with this?"
6. Hashtags: reflective and professional

TONE: Contemplative, wise, introspective, like a mentor sharing wisdom.
""",

    "educational": """
OBJECTIVE: Write a TEACHING post that provides value to readers.

STRUCTURE:
1. Hook: "TIL..." or "Quick tip:" or "Here's something many devs miss..."
2. The Lesson: What did you learn? Explain it simply.
3. Why It Matters: How does this help other developers?
4. Example: Brief practical example or use case
5. Call to Action: "Try this in your next project!"
6. Hashtags: educational and helpful

TONE: Teacher mode, clear, helpful, generous with knowledge.
""",

    "casual": """
OBJECTIVE: Write a RELAXED, conversational post like talking to a friend.

STRUCTURE:
1. Hook: Start casual - "So I was coding today and..." or "Random thought..."
2. The Story: Share what happened naturally
3. The Punchline: What's the takeaway or funny moment?
4. Closing: Something relatable
5. Hashtags: casual and friendly

TONE: Relaxed, friendly, conversational, like a chat over coffee. Use "haha" or "lol" if natural.
""",

    "motivational": """
OBJECTIVE: Write an INSPIRING post that motivates other developers.

STRUCTURE:
1. Hook: An inspiring statement or personal challenge overcome
2. The Struggle: What was hard? Be real about obstacles.
3. The Breakthrough: What kept you going? What worked?
4. The Message: Encourage others facing similar challenges
5. Call to Action: "Keep pushing!" or "You've got this!"
6. Hashtags: motivational and encouraging

TONE: Uplifting, encouraging, supportive, you-can-do-it energy. 💪
""",

    "storytelling": """
OBJECTIVE: Write a NARRATIVE post that tells a mini-story.

STRUCTURE:
1. Hook: Set the scene - "It was 2am and my code wasn't working..."
2. Rising Action: Build tension - what was the challenge?
3. The Climax: The breakthrough moment
4. Resolution: How it ended
5. The Moral: What's the lesson?
6. Hashtags: storytelling and relatable

TONE: Narrative, engaging, like a short story. Draw readers in.
""",

    "technical": """
OBJECTIVE: Write a TECHNICAL post sharing specific dev knowledge.

STRUCTURE:
1. Hook: A specific technical problem or discovery
2. Context: What were you building?
3. The Details: Technical specifics (but accessible)
4. The Solution: What worked and why
5. Call to Action: "Have you tried this approach?"
6. Hashtags: technical and specific

TONE: Technical but accessible, sharing expertise, helpful to fellow devs.
""",

    "celebratory": """
OBJECTIVE: Write a CELEBRATION post about an achievement!

STRUCTURE:
1. Hook: "WE DID IT!" or "Milestone unlocked!" 
2. The Achievement: What did you accomplish?
3. The Journey: Brief mention of what it took
4. Gratitude: Thank anyone who helped
5. What's Next: Tease future plans
6. Hashtags: celebratory and grateful

TONE: Celebrating, grateful, proud but humble. 🎊
""",

    "curious": """
OBJECTIVE: Write a QUESTION-DRIVEN post to spark discussion.

STRUCTURE:
1. Hook: Start with a genuine question you're pondering
2. Context: Why are you thinking about this?
3. Your Thoughts: Share your current perspective
4. Invite Input: "But I'm curious what you think..."
5. Call to Action: Direct question to the audience
6. Hashtags: discussion and community

TONE: Curious, humble, genuinely seeking input, community-focused.
"""
}

# =============================================================================
# ACTIVITY-SPECIFIC TONE MODIFIERS
# Each activity type gets a unique voice and focus
# =============================================================================
ACTIVITY_TONES = {
    "push": {
        "tone": "Energetic and progress-focused",
        "mood": "Excited about momentum and consistency",
        "focus": "Celebrate the grind, small wins add up, building in public",
        "emoji_set": "🚀 ⚡ 💪 🔥 📈",
        "cta_style": "What's keeping you busy this week?"
    },
    "commits": {
        "tone": "Technical and detail-oriented",
        "mood": "Thoughtful, reflective on code quality",
        "focus": "Specific technical improvements, code craftsmanship, lessons learned",
        "emoji_set": "📝 ⚙️ 🔧 💻 🧠",
        "cta_style": "How do you approach [specific technique]?"
    },
    "pull_request": {
        "tone": "Collaborative and achievement-oriented",
        "mood": "Proud of contribution, grateful for collaboration",
        "focus": "Teamwork, code review, shipping features, problem-solving",
        "emoji_set": "🔀 🤝 ✅ 🎯 🎉",
        "cta_style": "What's your code review process like?"
    },
    "new_repo": {
        "tone": "Visionary and launching",
        "mood": "Excited about new beginnings, ambitious",
        "focus": "Why this project exists, the problem it solves, future vision",
        "emoji_set": "✨ 🌟 🏗️ 💡 🚀",
        "cta_style": "What problem would you love to solve with code?"
    },
    "release": {
        "tone": "Celebratory and milestone-focused",
        "mood": "Proud accomplishment, grateful for journey",
        "focus": "What's new, key features, user impact, thank the community",
        "emoji_set": "🎉 📦 🚀 🙌 ⭐",
        "cta_style": "Check it out and let me know what you think!"
    },
    "generic": {
        "tone": "Authentic and conversational",
        "mood": "Genuine sharing, relatable",
        "focus": "Personal insights, developer journey, learning moments",
        "emoji_set": "💭 📣 🎨 💼 🌱",
        "cta_style": "What's on your mind lately?"
    }
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


def get_activity_tone_modifier(activity_type: str) -> str:
    """Get tone modifier text for a specific activity type."""
    tone_info = ACTIVITY_TONES.get(activity_type, ACTIVITY_TONES["generic"])
    
    return f"""\n\nACTIVITY-SPECIFIC TONE:
- Voice: {tone_info['tone']}
- Mood: {tone_info['mood']}
- Focus Areas: {tone_info['focus']}
- Preferred Emojis: {tone_info['emoji_set']}
- Suggested CTA: "{tone_info['cta_style']}"

IMPORTANT: Match the emotional energy and focus to this specific activity type. Make it feel natural and authentic."""


# Initialize Groq client (guarded)
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        logger.debug(f"Failed to initialize Groq client: {e}")
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
    activity_type = context_data.get('type', 'generic')
    user_content = ""
    
    # Add activity-specific tone modifier to the system prompt
    activity_tone = get_activity_tone_modifier(activity_type)
    system_prompt = system_prompt + activity_tone
    
    if context_data.get('type') == 'push':
        commits = context_data.get('commits', 0)
        repo = context_data.get('repo', 'unknown-repo')
        description = context_data.get('description', '')
        
        user_content = f"""
        Write an ENERGETIC LinkedIn post about my coding momentum!
        Activity: I pushed {commits} commits to '{repo}'.
        Context: The project involves: {description}
        Vibe: I'm in the zone, making progress, shipping code.
        Key Message: Consistency beats perfection. Every commit counts.
        """
        
    elif context_data.get('type') == 'pull_request':
        title = context_data.get('title', 'Unknown PR')
        repo = context_data.get('repo', 'unknown-repo')
        body = context_data.get('body', '')
        merged = context_data.get('merged', False)
        
        state_str = "merged" if merged else "opened"
        achievement = "This is a WIN!" if merged else "Putting my work out there for review."
        
        user_content = f"""
        Write a PROUD LinkedIn post about a Pull Request I just {state_str}.
        Repository: {repo}
        PR Title: {title}
        PR Description: {body}
        Achievement: {achievement}
        Vibe: Collaborative, shipping features, making impact.
        Key Message: Good things happen when you collaborate and put your code out there.
        """
        
    elif context_data.get('type') == 'new_repo':
        repo = context_data.get('repo', 'New Project')
        description = context_data.get('description', '')
        language = context_data.get('language', 'Code')
        
        user_content = f"""
        Write an EXCITED LinkedIn post about a brand new project I'm launching!
        Project Name: {repo}
        Description: {description}
        Main Tech Stack: {language}
        Vibe: New beginnings, I'm building something from scratch!
        Key Message: Every great project starts with a single commit. This is day one.
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


def synthesize_hashtags(post_content: str, desired: int = 18) -> str:
    """
    Create a fallback set of hashtags based on keywords in the post.
    
    Args:
        post_content: The post text to analyze for relevant keywords
        desired: Number of hashtags to generate (default 18)
        
    Returns:
        String of space-separated hashtags
        
    Used as fallback when AI doesn't generate proper hashtags.
    """
    keywords_map = {
        'design': '#Design', 'ui': '#UI', 'ux': '#UX', 'frontend': '#Frontend',
        'react': '#React', 'javascript': '#JavaScript', 'python': '#Python', 'node': '#NodeJS',
        'automation': '#Automation', 'bot': '#Bot', 'ai': '#AI', 'ml': '#MachineLearning',
        'open source': '#OpenSource', 'opensource': '#OpenSource', 'web': '#WebDevelopment',
        'learning': '#Learning', 'student': '#Student', 'career': '#Career', 'product': '#Product',
        'backend': '#Backend', 'api': '#API', 'database': '#Database', 'cloud': '#Cloud',
        'github': '#GitHub', 'code': '#Code', 'coding': '#Coding', 'css': '#CSS', 'html': '#HTML'
    }
    
    text = post_content.lower()
    selected = []
    
    # Match keywords in content
    for k, tag in keywords_map.items():
        if k in text and tag not in selected:
            selected.append(tag)
    
    # Comprehensive defaults pool
    defaults = [
        '#WebDev', '#100DaysOfCode', '#Coding', '#Developer', '#Tech', '#Programming', 
        '#Growth', '#Creativity', '#DevCommunity', '#TechCareer', '#Innovation',
        '#BuildInPublic', '#LearnInPublic', '#SoftwareEngineering', '#CodeNewbie',
        '#TechTwitter', '#DeveloperLife', '#OpenSource', '#CodingLife', '#WebDesign'
    ]
    
    # Fill with defaults
    for d in defaults:
        if len(selected) >= desired:
            break
        if d not in selected:
            selected.append(d)
    
    # Ensure exactly `desired` hashtags
    if len(selected) > desired:
        selected = selected[:desired]
    
    return ' '.join(selected)

