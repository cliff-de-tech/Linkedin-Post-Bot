"""
Persona Service - AI Writing Style Personalization

This module provides functions to:
1. Manage user personas (save, get, update)
2. Build persona context for AI prompts
3. Analyze past posts to learn writing style (Phase 2)

PERSONA SCHEMA:
{
    "tone": "professional" | "casual" | "witty" | "inspirational",
    "topics": ["AI", "frontend", "career"],
    "signature_style": "I end posts with questions",
    "emoji_usage": "none" | "minimal" | "moderate" | "heavy",
    "bio": "Frontend dev building React apps",
    "learned_patterns": {
        "avg_length": 150,
        "common_phrases": ["Here's what I learned", "The key insight"],
        "hashtag_style": "3-5 at end"
    }
}
"""

import json
import logging
from typing import Optional
from services.db import get_database
from services.user_settings import get_user_settings, save_user_settings

logger = logging.getLogger(__name__)

# Default persona for new users
DEFAULT_PERSONA = {
    "tone": "professional",
    "topics": [],
    "signature_style": "",
    "emoji_usage": "moderate",
    "bio": "",
    "learned_patterns": {}
}


async def get_user_persona(user_id: str) -> dict:
    """
    Get user's persona settings.
    
    Returns default persona if not set.
    """
    settings = await get_user_settings(user_id)
    if not settings or not settings.get('persona'):
        return DEFAULT_PERSONA.copy()
    
    # Merge with defaults to ensure all keys exist
    persona = {**DEFAULT_PERSONA, **settings.get('persona', {})}
    return persona


async def save_user_persona(user_id: str, persona: dict) -> None:
    """
    Save user's persona settings.
    
    Args:
        user_id: Clerk user ID
        persona: Persona dict (will be merged with existing)
    """
    await save_user_settings(user_id, {'persona': persona})
    logger.info(f"Saved persona for user {user_id[:8]}...")


def build_persona_prompt(persona: dict) -> str:
    """
    Build a prompt section describing the user's persona for AI.
    
    This is injected into the system prompt for post generation.
    
    Args:
        persona: User's persona dict
        
    Returns:
        String to append to AI system prompt
    """
    if not persona:
        return ""
    
    # Check if persona has any custom content
    has_custom_content = (
        persona.get('bio') or 
        persona.get('topics') or 
        persona.get('signature_style') or
        persona.get('tone') != 'professional'
    )
    
    if not has_custom_content:
        return ""
    
    parts = ["\n\n=== USER PERSONA ==="]
    parts.append("Write as this specific person, matching their voice and style:")
    
    if persona.get('bio'):
        parts.append(f"\nWHO THEY ARE: {persona['bio']}")
    
    if persona.get('tone'):
        tone_descriptions = {
            "professional": "Professional, polished, uses industry terminology appropriately",
            "casual": "Friendly, conversational, approachable like talking to a colleague",
            "witty": "Clever, uses humor and wordplay, doesn't take themselves too seriously",
            "inspirational": "Motivational, uplifting, focuses on growth and possibility"
        }
        tone_desc = tone_descriptions.get(persona['tone'], persona['tone'])
        parts.append(f"\nTONE: {tone_desc}")
    
    if persona.get('topics') and len(persona['topics']) > 0:
        topics = ', '.join(persona['topics'])
        parts.append(f"\nCORE TOPICS: {topics}")
    
    if persona.get('signature_style'):
        parts.append(f"\nSIGNATURE STYLE: {persona['signature_style']}")
    
    if persona.get('emoji_usage'):
        emoji_map = {
            "none": "Never use emojis",
            "minimal": "Rarely use emojis (1-2 max if any)",
            "moderate": "Use emojis thoughtfully to enhance key points",
            "heavy": "Use emojis liberally throughout the post"
        }
        parts.append(f"\nEMOJI USAGE: {emoji_map.get(persona['emoji_usage'], 'moderate')}")
    
    # Phase 2: Learned patterns from post history
    if persona.get('learned_patterns'):
        patterns = persona['learned_patterns']
        if patterns.get('avg_length'):
            parts.append(f"\nTYPICAL POST LENGTH: Around {patterns['avg_length']} words")
        if patterns.get('common_phrases'):
            phrases = ', '.join(patterns['common_phrases'][:3])
            parts.append(f"\nCOMMON PHRASES: {phrases}")
    
    parts.append("\n=== END PERSONA ===")
    
    logger.info(f"Built persona prompt with {len(parts)} parts")
    
    return '\n'.join(parts)


async def build_full_persona_context(user_id: str, include_learned: bool = True) -> str:
    """
    Get complete persona context for AI prompt injection.
    
    Combines:
    1. User-defined persona settings
    2. Learned patterns from post history (if available)
    
    Args:
        user_id: Clerk user ID
        include_learned: Whether to include learned patterns (default True)
        
    Returns:
        Formatted string for AI system prompt
    """
    persona = await get_user_persona(user_id)
    
    # Build base persona context
    context = build_persona_prompt(persona)
    
    # Add learned patterns context if available
    if include_learned and persona.get('learned_patterns'):
        try:
            from services.persona_analyzer import build_style_context
            learned_context = build_style_context(persona['learned_patterns'])
            if learned_context:
                context = context + "\n" + learned_context
        except ImportError:
            pass  # persona_analyzer not available
    
    return context


async def refresh_learned_patterns(user_id: str) -> dict:
    """
    Re-analyze user's posts and update learned patterns.
    
    Call this when user clicks "Refresh" in PersonaSettings,
    or periodically after new posts are published.
    
    Returns:
        Updated learned_patterns dict
    """
    try:
        from services.persona_analyzer import update_learned_patterns
        return await update_learned_patterns(user_id)
    except ImportError:
        logger.warning("persona_analyzer not available")
        return {}

