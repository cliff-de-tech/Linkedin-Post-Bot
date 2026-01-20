"""
AI Service - Multi-Model Router

This service provides a unified interface for AI-powered LinkedIn post generation
with support for multiple providers:
- Groq (Free tier) - Default, uses Llama 3.3 70B
- OpenAI (Pro tier) - GPT-4o
- Anthropic (Pro tier) - Claude 3.5 Sonnet

TIER ENFORCEMENT:
- Free users are ALWAYS routed to Groq, even if they request premium models
- Pro users can choose any provider

The same system prompts and persona context are used across all providers
to ensure consistent output quality regardless of model.
"""
import os
import random
import uuid
from typing import Optional, Literal
from enum import Enum
from dataclasses import dataclass

import structlog

# Optional AI provider imports (installed via requirements.txt)
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None  # type: ignore
    GROQ_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OpenAI = None  # type: ignore
    OPENAI_AVAILABLE = False

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    Anthropic = None  # type: ignore
    ANTHROPIC_AVAILABLE = False

try:
    from mistralai import Mistral
    MISTRAL_AVAILABLE = True
except ImportError:
    Mistral = None  # type: ignore
    MISTRAL_AVAILABLE = False

logger = structlog.get_logger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# API Keys
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY', '')
GITHUB_USERNAME = os.getenv('GITHUB_USERNAME', 'cliff-de-tech')

# Model configurations
GROQ_MODEL = "llama-3.3-70b-versatile"
OPENAI_MODEL = "gpt-4o"
ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
MISTRAL_MODEL = "mistral-large-latest"


# =============================================================================
# TYPES & ENUMS
# =============================================================================

class ModelProvider(str, Enum):
    """Available AI model providers."""
    GROQ = "groq"
    MISTRAL = "mistral"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


class SubscriptionTier(str, Enum):
    """User subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Providers available to each tier
TIER_ALLOWED_PROVIDERS = {
    SubscriptionTier.FREE: [ModelProvider.GROQ, ModelProvider.MISTRAL],
    SubscriptionTier.PRO: [ModelProvider.GROQ, ModelProvider.MISTRAL, ModelProvider.OPENAI, ModelProvider.ANTHROPIC],
    SubscriptionTier.ENTERPRISE: [ModelProvider.GROQ, ModelProvider.MISTRAL, ModelProvider.OPENAI, ModelProvider.ANTHROPIC],
}


@dataclass
class GenerationResult:
    """Result of AI post generation."""
    content: str
    provider: ModelProvider
    model: str
    was_downgraded: bool = False  # True if user requested premium but got free


# =============================================================================
# PROMPT TEMPLATES (Shared across all providers)
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
1. Hook (1-2 sentences): CRITICAL - Use ONE of these hook styles (pick randomly):
   * Bold statement: "Most developers get this wrong..."
   * Confession: "I'll admit it\u2014"
   * Number-led: "After 100 commits...", "3 things I learned..."
   * Question: "Ever had that moment when...?"
   * Scene-setting: "It was 2am. My code wasn't working."
   * Contradiction: "Everyone says X. I disagree."
   NEVER start with: "As I", "As a", "I just", "Just", "Today I", "Recently", "So I"
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

TONE: Relaxed, friendly, conversational, like a chat over coffee.
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

# Activity-specific tone modifiers
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


# =============================================================================
# PROMPT BUILDING HELPERS
# =============================================================================

def get_prompt_for_style(style: str = "standard") -> str:
    """Get the full system prompt for a specific style."""
    template = TEMPLATES.get(style, TEMPLATES["standard"])
    
    return f"""{BASE_PERSONA}

{template}

WORD COUNT & FORMAT:
- Target: 200-300 words (1,300-1,600 characters) - LinkedIn's optimal length
- FORMATTING "BRO-ETRY" STYLE:
  - 1-2 sentence paragraphs MAX.
  - Double line break between every paragraph.
  - NO big blocks of text.
- Conversational, authentic, like talking to peers
- Include 3-4 emojis naturally (🎨 🚀 💡 ✨ 🔥 💻 🎯 📱 ⚡ 🧠)
- NO markdown formatting (no **bold** or *italics*), NO code blocks, NO bullet points
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


def build_system_prompt(
    style: str = "standard",
    activity_type: str = "generic",
    persona_context: Optional[str] = None,
) -> str:
    """
    Build the complete system prompt for any provider.
    
    This ensures consistent prompting across Groq, OpenAI, and Anthropic.
    """
    # Base prompt for style
    system_prompt = get_prompt_for_style(style)
    
    # Generate uniqueness instructions
    unique_seed = str(uuid.uuid4())[:8]
    random_angle = random.choice([
        "focus on a surprising insight",
        "lead with a bold statement",
        "start with a question",
        "share a mini-story",
        "highlight a lesson learned",
        "express genuine excitement",
        "be reflective and thoughtful",
        "add some humor",
        "be motivational",
        "be conversational"
    ])
    
    uniqueness_prompt = f"""

=== CRITICAL: UNIQUENESS REQUIREMENT ===
Generation ID: {unique_seed}
Creative Angle: {random_angle}

YOU MUST GENERATE A COMPLETELY UNIQUE POST:
- NEVER repeat common LinkedIn phrases like "I'm excited to share" or "Here's what I learned"
- Use fresh metaphors and analogies
- Start with a hook that's different from typical posts
- Vary your sentence structure and length
- Be creative, unexpected, and authentic
- Each post should feel like a new creative work
=== END UNIQUENESS ===
"""
    
    system_prompt += uniqueness_prompt
    
    # Add persona context if provided
    if persona_context:
        system_prompt += "\n\n" + persona_context
    
    # Add activity tone modifier
    activity_tone = get_activity_tone_modifier(activity_type)
    system_prompt += activity_tone
    
    return system_prompt


def build_user_prompt(context_data: dict) -> str:
    """
    Build the user prompt from context data.
    
    This ensures consistent prompting across all providers.
    """
    activity_type = context_data.get('type', 'generic')
    
    # Random elements for variety
    push_vibes = [
        "momentum and flow", "grinding and growing", "small wins stacking up",
        "the builder mindset", "shipping mode activated", "code flowing like water",
        "progress over perfection", "another brick in the wall", "the compound effect"
    ]
    push_angles = [
        "talk about the journey, not just the destination",
        "reflect on what you learned today",
        "share a surprising discovery",
        "celebrate the small win",
        "be vulnerable about challenges faced",
        "inspire others to start building"
    ]
    
    pr_vibes = [
        "collaboration wins", "the power of feedback", "shipping with confidence",
        "code review magic", "team effort pays off", "open source spirit"
    ]
    pr_angles = [
        "share what you learned from the process",
        "thank your collaborators",
        "discuss the problem you solved",
        "reflect on the improvement",
        "share a tip from the experience"
    ]
    
    new_repo_vibes = [
        "new beginnings", "the spark of creation", "idea to reality",
        "version 0.0.1 energy", "building in public", "the first commit feeling"
    ]
    new_repo_angles = [
        "share why this project matters to you",
        "discuss the problem you're solving",
        "invite others to follow the journey",
        "be honest about your vision"
    ]
    
    generic_angles = [
        "share a personal insight", "be reflective", "inspire action",
        "tell a quick story", "ask a thought-provoking question"
    ]
    
    if activity_type == 'push':
        commits = context_data.get('commits', 0)
        repo = context_data.get('repo', 'unknown-repo')
        description = context_data.get('description', '')
        
        vibe = random.choice(push_vibes)
        angle = random.choice(push_angles)
        
        total_commits = context_data.get('total_commits')
        total_commits_instruction = ""
        if total_commits and total_commits != 'unknown':
            total_commits_instruction = f"""
IMPORTANT: This repo has {total_commits} total commits. 
You MUST weave this into the hook or body of the post naturally.
Example hooks:
- "After {total_commits} commits, I finally..."
- "{total_commits} commits later, here's what I learned..."
- "Commit #{total_commits} just hit the repo..."
"""
        
        return f"""
Create a LinkedIn post about coding progress.

FACTS TO USE:
- Just pushed {commits} commits to '{repo}'
- Repository has {total_commits or 'many'} total commits
- Project context: {description}
{total_commits_instruction}
YOUR CREATIVE DIRECTION: {angle}
ENERGY: {vibe}

BE UNIQUE. Don't use generic phrases. Make it authentically yours.
"""
        
    elif activity_type == 'pull_request':
        title = context_data.get('title', 'Unknown PR')
        repo = context_data.get('repo', 'unknown-repo')
        body = context_data.get('body', '')
        merged = context_data.get('merged', False)
        
        state_str = "merged" if merged else "opened"
        vibe = random.choice(pr_vibes)
        angle = random.choice(pr_angles)
        
        return f"""
Create a LinkedIn post about a pull request.

FACTS ONLY:
- PR was {state_str} in '{repo}'
- Title: {title}
- Description: {body}

YOUR CREATIVE DIRECTION: {angle}
ENERGY: {vibe}

BE UNIQUE. Avoid clichés. Write from the heart.
"""
        
    elif activity_type == 'new_repo':
        repo = context_data.get('repo', 'New Project')
        description = context_data.get('description', '')
        language = context_data.get('language', 'Code')
        
        vibe = random.choice(new_repo_vibes)
        angle = random.choice(new_repo_angles)
        
        return f"""
Create a LinkedIn post about launching a new project.

FACTS ONLY:
- New project: {repo}
- What it does: {description}
- Tech: {language}

YOUR CREATIVE DIRECTION: {angle}
ENERGY: {vibe}

BE UNIQUE. This is YOUR story. Tell it your way.
"""
        
    else:
        # Generic or manual context
        topic = context_data.get('topic', 'Coding & Development')
        details = context_data.get('details', 'Sharing thoughts on my developer journey.')
        
        return f"""
Create a LinkedIn post about: {topic}

Context: {details}

YOUR CREATIVE DIRECTION: {random.choice(generic_angles)}

BE UNIQUE. Make it memorable. Skip the corporate speak.
"""


# =============================================================================
# PROVIDER IMPLEMENTATIONS
# =============================================================================

def _generate_with_groq(
    system_prompt: str,
    user_prompt: str,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """
    Generate post using Groq (Llama 3.3 70B).
    
    This is the FREE tier provider - fast and high quality.
    """
    if not GROQ_AVAILABLE:
        logger.error("Groq package not installed")
        return None
    
    key = api_key or GROQ_API_KEY
    if not key:
        logger.warning("No Groq API key available")
        return None
    
    try:
        client = Groq(api_key=key)
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=GROQ_MODEL,
            temperature=0.95,
            max_tokens=600,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error("groq_generation_failed", error=str(e))
        return None


def _generate_with_openai(
    system_prompt: str,
    user_prompt: str,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """
    Generate post using OpenAI GPT-4o.
    
    This is a PRO tier provider - premium quality.
    """
    if not OPENAI_AVAILABLE:
        logger.error("OpenAI package not installed")
        return None
    
    key = api_key or OPENAI_API_KEY
    if not key:
        logger.warning("No OpenAI API key available")
        return None
    
    try:
        client = OpenAI(api_key=key)
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=OPENAI_MODEL,
            temperature=0.95,
            max_tokens=600,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error("openai_generation_failed", error=str(e))
        return None


def _generate_with_anthropic(
    system_prompt: str,
    user_prompt: str,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """
    Generate post using Anthropic Claude 3.5 Sonnet.
    
    This is a PRO tier provider - excellent for creative writing.
    """
    if not ANTHROPIC_AVAILABLE:
        logger.error("Anthropic package not installed")
        return None
    
    key = api_key or ANTHROPIC_API_KEY
    if not key:
        logger.warning("No Anthropic API key available")
        return None
    
    try:
        client = Anthropic(api_key=key)
        
        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=600,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt},
            ],
        )
        
        # Anthropic returns content as a list of blocks
        return response.content[0].text
        
    except Exception as e:
        logger.error("anthropic_generation_failed", error=str(e))
        return None


def _generate_with_mistral(
    system_prompt: str,
    user_prompt: str,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """
    Generate post using Mistral AI.
    
    This is a FREE tier provider - good quality and free.
    """
    if not MISTRAL_AVAILABLE:
        logger.error("Mistral package not installed")
        return None
    
    key = api_key or MISTRAL_API_KEY
    if not key:
        logger.warning("No Mistral API key available")
        return None
    
    try:
        client = Mistral(api_key=key)
        
        response = client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.95,
            max_tokens=600,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error("mistral_generation_failed", error=str(e))
        return None


# =============================================================================
# TIER ENFORCEMENT & ROUTING
# =============================================================================

async def get_user_tier(user_id: Optional[str]) -> SubscriptionTier:
    """
    Get the user's subscription tier.
    
    Returns FREE if user_id is None or settings can't be retrieved.
    """
    if not user_id:
        return SubscriptionTier.FREE
    
    try:
        from services.user_settings import get_user_settings
        settings = await get_user_settings(user_id)
        
        if settings:
            tier_str = settings.get('subscription_tier', 'free')
            try:
                return SubscriptionTier(tier_str)
            except ValueError:
                return SubscriptionTier.FREE
        
        return SubscriptionTier.FREE
        
    except Exception as e:
        logger.warning("failed_to_get_user_tier", user_id=user_id, error=str(e))
        return SubscriptionTier.FREE


def enforce_tier_provider(
    requested_provider: ModelProvider,
    user_tier: SubscriptionTier,
) -> tuple[ModelProvider, bool]:
    """
    Enforce tier-based provider restrictions.
    
    Args:
        requested_provider: The provider the user requested
        user_tier: The user's subscription tier
        
    Returns:
        Tuple of (actual_provider, was_downgraded)
    """
    allowed = TIER_ALLOWED_PROVIDERS.get(user_tier, [ModelProvider.GROQ])
    
    if requested_provider in allowed:
        return requested_provider, False
    
    # Downgrade to Groq (always allowed)
    logger.info(
        "provider_downgraded",
        requested=requested_provider.value,
        actual=ModelProvider.GROQ.value,
        tier=user_tier.value,
    )
    return ModelProvider.GROQ, True


# =============================================================================
# MAIN GENERATION FUNCTION
# =============================================================================

async def generate_linkedin_post(
    context_data: dict,
    user_id: Optional[str] = None,
    model_provider: str = "groq",
    style: str = "standard",
    groq_api_key: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    anthropic_api_key: Optional[str] = None,
    mistral_api_key: Optional[str] = None,
    persona_context: Optional[str] = None,
) -> Optional[GenerationResult]:
    """
    Generate a LinkedIn post using the specified AI provider.
    
    TIER ENFORCEMENT:
    - Free tier users are ALWAYS routed to Groq, regardless of requested provider
    - Pro tier users can use any provider (groq, openai, anthropic)
    
    Args:
        context_data: Dictionary with activity context (type, repo, commits, etc.)
        user_id: Clerk user ID (used for tier lookup)
        model_provider: Requested provider ('groq', 'openai', 'anthropic')
        style: Post style template
        groq_api_key: Optional override for Groq API key
        openai_api_key: Optional override for OpenAI API key
        anthropic_api_key: Optional override for Anthropic API key
        persona_context: Optional persona prompt string
        
    Returns:
        GenerationResult with content, provider used, and downgrade status
    """
    log = logger.bind(
        user_id=user_id[:8] + "..." if user_id else None,
        requested_provider=model_provider,
        style=style,
    )
    log.info("generating_linkedin_post")
    
    # Parse requested provider
    try:
        requested = ModelProvider(model_provider.lower())
    except ValueError:
        requested = ModelProvider.GROQ
    
    # Get user tier and enforce restrictions
    user_tier = await get_user_tier(user_id)
    actual_provider, was_downgraded = enforce_tier_provider(requested, user_tier)
    
    log = log.bind(
        tier=user_tier.value,
        actual_provider=actual_provider.value,
        was_downgraded=was_downgraded,
    )
    
    if was_downgraded:
        log.info("user_downgraded_to_free_provider")
    
    # Build prompts (same for all providers)
    activity_type = context_data.get('type', 'generic')
    system_prompt = build_system_prompt(style, activity_type, persona_context)
    user_prompt = build_user_prompt(context_data)
    
    # Route to appropriate provider
    content = None
    model_used = ""
    
    if actual_provider == ModelProvider.GROQ:
        content = _generate_with_groq(system_prompt, user_prompt, groq_api_key)
        model_used = GROQ_MODEL
        
    elif actual_provider == ModelProvider.MISTRAL:
        content = _generate_with_mistral(system_prompt, user_prompt, mistral_api_key)
        model_used = MISTRAL_MODEL
        
    elif actual_provider == ModelProvider.OPENAI:
        content = _generate_with_openai(system_prompt, user_prompt, openai_api_key)
        model_used = OPENAI_MODEL
        
    elif actual_provider == ModelProvider.ANTHROPIC:
        content = _generate_with_anthropic(system_prompt, user_prompt, anthropic_api_key)
        model_used = ANTHROPIC_MODEL
    
    if not content:
        log.error("generation_failed")
        return None
    
    log.info("generation_complete", content_length=len(content))
    
    return GenerationResult(
        content=content,
        provider=actual_provider,
        model=model_used,
        was_downgraded=was_downgraded,
    )


# =============================================================================
# LEGACY COMPATIBILITY WRAPPER
# =============================================================================

def generate_post_with_ai(
    context_data: dict,
    groq_api_key: Optional[str] = None,
    style: str = "standard",
    persona_context: Optional[str] = None,
) -> Optional[str]:
    """
    Legacy synchronous wrapper for backward compatibility.
    
    This maintains the old API signature while using the new multi-model router.
    Always uses Groq (free tier behavior).
    """
    import asyncio
    
    logger.info(f"🧠 AI service: generating {style} post (legacy wrapper)...")
    
    async def _generate():
        result = await generate_linkedin_post(
            context_data=context_data,
            user_id=None,  # No user = free tier = Groq
            model_provider="groq",
            style=style,
            groq_api_key=groq_api_key,
            persona_context=persona_context,
        )
        return result.content if result else None
    
    # Run async function in sync context
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, create a new task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, _generate())
                return future.result()
        else:
            return loop.run_until_complete(_generate())
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(_generate())


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_available_providers() -> dict:
    """
    Get information about available providers and their status.
    
    Returns dict with provider availability based on configured API keys.
    """
    return {
        "groq": {
            "available": bool(GROQ_API_KEY),
            "model": GROQ_MODEL,
            "tier": "free",
        },
        "openai": {
            "available": bool(OPENAI_API_KEY),
            "model": OPENAI_MODEL,
            "tier": "pro",
        },
        "anthropic": {
            "available": bool(ANTHROPIC_API_KEY),
            "model": ANTHROPIC_MODEL,
            "tier": "pro",
        },
    }


def synthesize_hashtags(post_content: str, desired: int = 18) -> str:
    """
    Create a fallback set of hashtags based on keywords in the post.
    
    Args:
        post_content: The post text to analyze for relevant keywords
        desired: Number of hashtags to generate (default 18)
        
    Returns:
        String of space-separated hashtags
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

