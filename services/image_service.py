import os
import random
from urllib.parse import quote
import requests
import logging

# Configure logging
logger = logging.getLogger(__name__)

# CREDENTIAL CLASSIFICATION: (A) App-level secret (fallback for CLI mode)
# In multi-tenant mode, user-provided keys are passed as parameters
UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY', '')


def get_relevant_image(post_content: str, unsplash_key: str = None):
    """
    Fetch a relevant image from Unsplash based on post content.
    
    Args:
        post_content: The post text to analyze for relevant image keywords
        unsplash_key: Optional per-user Unsplash access key. Falls back to env var.
        
    Returns:
        bytes: Image data if successful, None otherwise
        
    MULTI-TENANT: Accepts user-provided key for per-user isolation.
    """
    # Use user-provided key or fall back to app-level key
    key = unsplash_key or UNSPLASH_ACCESS_KEY
    
    if not key:
        logger.info("No Unsplash API key available, skipping image fetch")
        return None

    content_lower = post_content.lower()

    if any(word in content_lower for word in ['ui', 'ux', 'design', 'interface', 'beautiful', 'aesthetic']):
        search_term = random.choice([
            'software designer ui design computer screen',
            'web design code html css monitor',
            'digital design software laptop screen',
            'user interface design computer workspace'
        ])
    elif any(word in content_lower for word in ['react', 'javascript', 'frontend', 'web app', 'website']):
        search_term = random.choice([
            'javascript programming code laptop computer',
            'react software development monitor screen',
            'web developer coding computer workspace',
            'frontend programming code display'
        ])
    elif any(word in content_lower for word in ['github', 'commit', 'code', 'repository', 'project']):
        search_term = random.choice([
            'github software code computer screen',
            'programming code laptop workspace',
            'software developer computer code monitor',
            'coding computer project screen workspace'
        ])
    elif any(word in content_lower for word in ['learn', 'student', 'study', 'journey', 'grow']):
        search_term = random.choice([
            'student programming computer code screen',
            'learning software development laptop',
            'computer science student coding workspace',
            'programming education computer monitor'
        ])
    elif any(word in content_lower for word in ['team', 'collaborate', 'community', 'together']):
        search_term = random.choice([
            'software developers team computer screens',
            'programmers collaboration computer workspace',
            'team coding computers office',
            'developers working together computer monitors'
        ])
    elif any(word in content_lower for word in ['build', 'create', 'creative', 'innovation']):
        search_term = random.choice([
            'software developer building app computer',
            'programmer creating code laptop screen',
            'web development computer workspace',
            'software engineering computer coding'
        ])
    else:
        search_term = random.choice([
            'programming code laptop computer screen',
            'software development computer workspace',
            'coding computer monitor closeup',
            'software engineer laptop code display',
            'html css javascript computer screen',
            'python programming laptop workspace'
        ])

    logger.info(f"Searching for image: '{search_term}'...")

    try:
        url = f"https://api.unsplash.com/photos/random?query={quote(search_term)}&orientation=landscape&content_filter=high"
        headers = {'Authorization': f'Client-ID {key}'}
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            image_download_url = data['urls']['regular']
            image_description = data.get('alt_description', 'No description')
            print(f"✅ Found image: {image_description}")
            print(f"   Downloading...")
            img_response = requests.get(image_download_url, timeout=10)
            if img_response.status_code == 200:
                print(f"✅ Image downloaded successfully ({len(img_response.content)} bytes)")
                return img_response.content
            else:
                print(f"⚠️  Failed to download image: {img_response.status_code}")
                return None
        else:
            print(f"⚠️  Unsplash API error: {response.status_code}")
            return None
    except Exception as e:
        print(f"⚠️  Error fetching image: {e}")
        return None
