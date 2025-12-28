"""
Persona Analyzer - Learn Writing Style from Post History

This module analyzes a user's published posts to extract:
1. Average post length
2. Common phrases and vocabulary
3. Emoji usage patterns
4. Hashtag style
5. Sentence structure patterns

These learned patterns are stored in user's persona.learned_patterns
and injected into AI prompts for more authentic post generation.
"""

import re
import logging
from typing import Optional
from collections import Counter
from services.db import get_database
from services.post_history import get_user_posts

logger = logging.getLogger(__name__)


async def analyze_writing_style(user_id: str, min_posts: int = 3) -> dict:
    """
    Analyze user's published posts to extract writing patterns.
    
    Args:
        user_id: Clerk user ID
        min_posts: Minimum posts required for meaningful analysis
        
    Returns:
        Dict with learned patterns, or empty dict if insufficient data
    """
    try:
        # Get user's published posts
        posts = await get_user_posts(user_id, limit=20, status='published')
        
        if not posts or len(posts) < min_posts:
            logger.info(f"Insufficient posts for analysis ({len(posts) if posts else 0}/{min_posts})")
            return {}
        
        # Extract text content from posts
        contents = [p.get('post_content', '') for p in posts if p.get('post_content')]
        
        if not contents:
            return {}
        
        patterns = {}
        
        # 1. Average post length (words)
        word_counts = [len(content.split()) for content in contents]
        patterns['avg_length'] = round(sum(word_counts) / len(word_counts))
        
        # 2. Emoji usage frequency
        emoji_counts = [count_emojis(content) for content in contents]
        avg_emojis = sum(emoji_counts) / len(emoji_counts)
        if avg_emojis < 1:
            patterns['emoji_style'] = 'minimal'
        elif avg_emojis < 3:
            patterns['emoji_style'] = 'moderate'
        else:
            patterns['emoji_style'] = 'heavy'
        
        # 3. Common phrases (2-4 word ngrams that appear multiple times)
        patterns['common_phrases'] = extract_common_phrases(contents)
        
        # 4. Hashtag patterns
        hashtag_counts = [count_hashtags(content) for content in contents]
        avg_hashtags = sum(hashtag_counts) / len(hashtag_counts)
        if avg_hashtags < 3:
            patterns['hashtag_style'] = 'minimal (1-3)'
        elif avg_hashtags < 6:
            patterns['hashtag_style'] = '3-5 at end'
        else:
            patterns['hashtag_style'] = 'abundant (6+)'
        
        # 5. Sentence structure - starts with questions often?
        question_ratio = sum(1 for c in contents if '?' in c[:200]) / len(contents)
        if question_ratio > 0.3:
            patterns['hook_style'] = 'Often starts with questions'
        
        # 6. Line breaks / paragraph style
        avg_paragraphs = sum(content.count('\n\n') + 1 for content in contents) / len(contents)
        if avg_paragraphs > 3:
            patterns['structure'] = 'Multiple short paragraphs'
        else:
            patterns['structure'] = 'Longer dense paragraphs'
        
        logger.info(f"Analyzed {len(contents)} posts for user {user_id[:8]}...")
        return patterns
        
    except Exception as e:
        logger.error(f"Error analyzing writing style: {e}")
        return {}


def count_emojis(text: str) -> int:
    """Count emojis in text."""
    # Simple emoji pattern - catches most common emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # Emoticons
        "\U0001F300-\U0001F5FF"  # Symbols & pictographs
        "\U0001F680-\U0001F6FF"  # Transport & map
        "\U0001F1E0-\U0001F1FF"  # Flags
        "\U00002702-\U000027B0"  # Dingbats
        "\U0001F900-\U0001F9FF"  # Supplemental symbols
        "]+", 
        flags=re.UNICODE
    )
    return len(emoji_pattern.findall(text))


def count_hashtags(text: str) -> int:
    """Count hashtags in text."""
    return len(re.findall(r'#\w+', text))


def extract_common_phrases(contents: list, min_occurrences: int = 2) -> list:
    """
    Extract 2-3 word phrases that appear in multiple posts.
    
    Returns list of up to 5 common phrases.
    """
    phrase_counter = Counter()
    
    for content in contents:
        # Clean content (remove hashtags, emojis, special chars)
        clean = re.sub(r'#\w+', '', content)
        clean = re.sub(r'[^\w\s]', '', clean)
        words = clean.lower().split()
        
        # Extract 2-word and 3-word phrases
        for i in range(len(words) - 1):
            # 2-word phrases
            phrase = ' '.join(words[i:i+2])
            if len(phrase) > 5:  # Skip very short phrases
                phrase_counter[phrase] += 1
            
            # 3-word phrases
            if i < len(words) - 2:
                phrase = ' '.join(words[i:i+3])
                if len(phrase) > 8:
                    phrase_counter[phrase] += 1
    
    # Filter to phrases appearing multiple times
    common = [
        phrase for phrase, count in phrase_counter.most_common(10)
        if count >= min_occurrences
    ]
    
    # Return top 5
    return common[:5]


async def update_learned_patterns(user_id: str) -> dict:
    """
    Analyze posts and update user's persona with learned patterns.
    
    This is called periodically or when user requests a style refresh.
    
    Returns:
        The updated learned_patterns dict
    """
    from services.persona_service import get_user_persona, save_user_persona
    
    patterns = await analyze_writing_style(user_id)
    
    if patterns:
        # Get current persona and update learned_patterns
        current_persona = await get_user_persona(user_id)
        current_persona['learned_patterns'] = patterns
        await save_user_persona(user_id, current_persona)
        logger.info(f"Updated learned patterns for user {user_id[:8]}...")
    
    return patterns


def build_style_context(learned_patterns: dict) -> str:
    """
    Build prompt context from learned patterns.
    
    Args:
        learned_patterns: Dict from analyze_writing_style
        
    Returns:
        String to inject into AI prompt
    """
    if not learned_patterns:
        return ""
    
    parts = ["\n=== LEARNED FROM YOUR POSTS ==="]
    
    if learned_patterns.get('avg_length'):
        parts.append(f"Typical post length: ~{learned_patterns['avg_length']} words")
    
    if learned_patterns.get('emoji_style'):
        parts.append(f"Emoji usage: {learned_patterns['emoji_style']}")
    
    if learned_patterns.get('common_phrases'):
        phrases = ', '.join(f'"{p}"' for p in learned_patterns['common_phrases'][:3])
        parts.append(f"Phrases you often use: {phrases}")
    
    if learned_patterns.get('hashtag_style'):
        parts.append(f"Hashtag style: {learned_patterns['hashtag_style']}")
    
    if learned_patterns.get('hook_style'):
        parts.append(f"Hook preference: {learned_patterns['hook_style']}")
    
    if learned_patterns.get('structure'):
        parts.append(f"Post structure: {learned_patterns['structure']}")
    
    parts.append("=== END LEARNED PATTERNS ===")
    
    return '\n'.join(parts)
