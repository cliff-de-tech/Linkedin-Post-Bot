import requests
import json
import random
import datetime
import os
import time
from dateutil import parser
from groq import Groq
from urllib.parse import quote

# Load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, will use system environment variables

# --- CONFIGURATION (Load from environment variables for security) ---
# For local testing: create a .env file or set these manually
# For GitHub Actions: secrets are automatically injected
LINKEDIN_ACCESS_TOKEN = os.getenv('LINKEDIN_ACCESS_TOKEN', '')
LINKEDIN_USER_URN = os.getenv('LINKEDIN_USER_URN', '')
GITHUB_USERNAME = os.getenv('MY_GITHUB_USERNAME') or os.getenv('GITHUB_USERNAME') or 'cliff-de-tech'
GITHUB_TOKEN = os.getenv('MY_GITHUB_TOKEN') or os.getenv('GITHUB_TOKEN') or None
MAX_POSTS = int(os.getenv('MAX_POSTS', '999'))  # Process ALL activities found (no limit)
POST_DELAY_SECONDS = int(os.getenv('POST_DELAY_SECONDS', '3600'))  # 1 hour delay between posts
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY', '')  # Optional: for fetching images

# Validate credentials are set
if not LINKEDIN_ACCESS_TOKEN or not LINKEDIN_USER_URN or not GROQ_API_KEY:
    print("⚠️  WARNING: Missing credentials!")
    print("   Set environment variables: LINKEDIN_ACCESS_TOKEN, LINKEDIN_USER_URN, GROQ_API_KEY")
    print("   Or create a .env file in the project directory")

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

# --- LINKEDIN PERSONA (AI Personality) ---
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

# --- SENSOR 2: GITHUB STATS CHECKER ---
def get_github_stats():
    """Fetch GitHub user stats for inspirational posts"""
    print(f"📈 Fetching GitHub stats for {GITHUB_USERNAME}...")
    try:
        url = f"https://api.github.com/users/{GITHUB_USERNAME}"
        headers = {}
        if GITHUB_TOKEN:
            headers['Authorization'] = f'token {GITHUB_TOKEN}'
        response = requests.get(url, headers=headers, timeout=10)
        print(f"🔎 GitHub API: GET {url} -> {response.status_code}")
        if response.status_code == 401 and headers.get('Authorization'):
            print("⚠️  GitHub token unauthorized — retrying without token (will use public API)")
            response = requests.get(url, timeout=10)
            print(f"🔎 GitHub API (no auth): GET {url} -> {response.status_code}")

        if response.status_code != 200:
            print("⚠️  Could not fetch GitHub user info.")
            return None

        data = response.json()
        return {
            'public_repos': data.get('public_repos', 0),
            'followers': data.get('followers', 0),
            'location': data.get('location'),
            'html_url': data.get('html_url'),
            'login': data.get('login')
        }
    except Exception as e:
        print(f"⚠️  Error fetching GitHub stats: {e}")
        return None


def get_latest_github_activity(max_items: int = None):
    """Fetch recent GitHub user events (last 24h) and return a list of structured activities.

    Returns a list (possibly empty). Each item is a dict with keys: type, repo, full_repo, date, and optional commits/action.
    """
    if max_items is None:
        max_items = MAX_POSTS

    print(f"🕵️ Checking GitHub activity for {GITHUB_USERNAME} (up to {max_items})...")
    activities = []
    try:
        url = f"https://api.github.com/users/{GITHUB_USERNAME}/events"
        headers = {}
        if GITHUB_TOKEN:
            headers['Authorization'] = f'token {GITHUB_TOKEN}'
        response = requests.get(url, headers=headers, timeout=10)
        print(f"🔎 GitHub API: GET {url} -> {response.status_code}")
        if response.status_code == 401 and headers.get('Authorization'):
            print("⚠️  GitHub token unauthorized — retrying without token (will use public API)")
            response = requests.get(url, timeout=10)
            print(f"🔎 GitHub API (no auth): GET {url} -> {response.status_code}")

        if response.status_code != 200:
            print("No GitHub activity found or API error.")
            return activities

        events = response.json()
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        cutoff = now_utc - datetime.timedelta(hours=24)

        def humanize_delta(ts: datetime.datetime) -> str:
            delta = now_utc - ts
            hours = int(delta.total_seconds() // 3600)
            if hours < 1:
                minutes = max(1, int(delta.total_seconds() // 60))
                return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
            return f"{hours} hour{'s' if hours != 1 else ''} ago"

        for event in events:
            if len(activities) >= max_items:
                break
            try:
                event_time = parser.isoparse(event.get('created_at'))
            except Exception:
                continue
            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=datetime.timezone.utc)
            if event_time < cutoff:
                continue
            when_text = humanize_delta(event_time)

            etype = event.get('type')
            repo_name = event.get('repo', {}).get('name', '')
            clean_repo_name = repo_name.split('/')[-1] if repo_name else ''

            if etype == 'PushEvent':
                commit_count = len(event.get('payload', {}).get('commits', []))
                activities.append({
                    'type': 'push',
                    'repo': clean_repo_name,
                    'full_repo': repo_name,
                    'commits': commit_count,
                    'date': when_text
                })

            elif etype == 'PullRequestEvent':
                action = event.get('payload', {}).get('action', 'updated')
                activities.append({
                    'type': 'pull_request',
                    'action': action,
                    'repo': clean_repo_name,
                    'full_repo': repo_name,
                    'date': when_text
                })

            elif etype == 'CreateEvent':
                ref_type = event.get('payload', {}).get('ref_type', 'repo')
                if ref_type == 'repository':
                    activities.append({
                        'type': 'new_repo',
                        'repo': clean_repo_name,
                        'full_repo': repo_name,
                        'date': when_text
                    })

        if not activities:
            print("No GitHub activity found in the last 24 hours.")
        else:
            print(f"Found {len(activities)} recent event(s)")
        return activities
    except Exception as e:
        print(f"⚠️  Error checking GitHub activity: {e}")
        return []


def get_recent_repo_updates():
    """Scan user's repositories and return a recent update (pushed_at) within 24h."""
    print(f"🔎 Scanning repos for recent pushes for {GITHUB_USERNAME}...")
    try:
        url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page=100&type=owner"
        headers = {}
        if GITHUB_TOKEN:
            headers['Authorization'] = f'token {GITHUB_TOKEN}'
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"🔎 GitHub API: GET {url} -> {resp.status_code}")
        if resp.status_code != 200:
            return None

        repos = resp.json()
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        cutoff = now_utc - datetime.timedelta(hours=24)

        recent = []
        for r in repos:
            pushed = r.get('pushed_at')
            if not pushed:
                continue
            pushed_dt = parser.isoparse(pushed)
            if pushed_dt.tzinfo is None:
                pushed_dt = pushed_dt.replace(tzinfo=datetime.timezone.utc)
            if pushed_dt >= cutoff:
                repo_name = r.get('name')
                full_repo = r.get('full_name')
                commit_url = f"https://api.github.com/repos/{full_repo}/commits?per_page=1"
                c_resp = requests.get(commit_url, headers=headers, timeout=10)
                if c_resp.status_code == 200:
                    commits = c_resp.json()
                    if commits:
                        commit = commits[0]
                        commit_time = commit.get('commit', {}).get('author', {}).get('date')
                        commit_dt = parser.isoparse(commit_time)
                        if commit_dt.tzinfo is None:
                            commit_dt = commit_dt.replace(tzinfo=datetime.timezone.utc)
                        delta = now_utc - commit_dt
                        hours = int(delta.total_seconds() // 3600)
                        when_text = f"{hours} hour{'s' if hours != 1 else ''} ago" if hours >= 1 else f"{max(1,int(delta.total_seconds()//60))} minutes ago"
                        recent.append({
                            'type': 'push',
                            'repo': repo_name,
                            'full_repo': full_repo,
                            'commits': 1,
                            'date': when_text
                        })
                else:
                    delta = now_utc - pushed_dt
                    hours = int(delta.total_seconds() // 3600)
                    when_text = f"{hours} hour{'s' if hours != 1 else ''} ago" if hours >= 1 else f"{max(1,int(delta.total_seconds()//60))} minutes ago"
                    recent.append({
                        'type': 'push',
                        'repo': repo_name,
                        'full_repo': full_repo,
                        'commits': 1,
                        'date': when_text
                    })

        # Sort by pushed_at descending and return all
        recent_sorted = sorted(recent, key=lambda x: x.get('date'), reverse=False)
        return recent  # Return all activities found
    except Exception as e:
        print(f"⚠️  Error scanning repos: {e}")
        return None

# --- AI BRAIN: GENERATE DYNAMIC CONTENT WITH GROQ ---
def generate_post_with_ai(context_data):
    """Use Google Groq to draft a LinkedIn post based on context"""
    print("🧠 Groq AI is thinking and drafting your post...")
    
    try:
        # Build context prompt based on what triggered the post
        if isinstance(context_data, dict) and context_data.get('type') == 'push':
            context_prompt = f"""
GitHub Activity: User just pushed {context_data['commits']} commit(s) to repo '{context_data['repo']}' {context_data['date']}.
Repo: https://github.com/{context_data['full_repo']}

WRITE A COMPLETE LINKEDIN POST - MUST INCLUDE EVERYTHING BELOW:

Structure (250-350 words total):
1. Hook (1-2 sentences) - relatable moment about coding/building
   - CRITICAL: Avoid ALL repetitive opening patterns - be completely unique each time
2. Story (3-4 sentences) - what this code work involved and what you learned  
3. Value (1-2 sentences) - why it matters or insight gained
4. Question (1 sentence) - ask your network something and tag relevant people/topics
5. HASHTAGS (MANDATORY FINAL LINE: exactly 15-20 hashtags space-separated)

CRITICAL REQUIREMENTS:
- Write the COMPLETE post - output MUST end with the hashtags line
- POST MUST END with a question followed by a blank line then hashtags
- Include @mentions naturally in the text when relevant (e.g., shoutout collaborators, tag tech communities)
- MANDATORY FINAL LINE: exactly 15-20 diverse hashtags covering topic, tech stack, community, career
  (example: #WebDev #JavaScript #React #NodeJS #Code #Design #Tech #Frontend #Backend #UI #UX #Learning #DevCommunity #Growth #Innovation #100DaysOfCode #Coding #Programming #TechCareer #OpenSource)
- Explicitly include this repo link: https://github.com/{context_data['full_repo']}
- Include 3-4 emojis naturally: 🎨 🚀 💡 ✨
- Length: 250-350 words TOTAL including hashtags
- DO NOT stop mid-sentence or before hashtags

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
        
        # Call Groq API with system message emphasizing completion
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a LinkedIn post writer. You MUST complete every post you write. Every post MUST end with exactly 15-20 hashtags on the final line. Include @mentions naturally when relevant. NEVER stop mid-sentence or before adding the hashtags."},
                {"role": "user", "content": context_prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
        )
        
        post_content = response.choices[0].message.content.strip()

        # Ensure the model didn't cut off mid-sentence or omit required hashtags
        def _looks_complete(text: str) -> bool:
            if not text or len(text.strip()) < 150:
                return False
            lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
            if not lines:
                return False
            last = lines[-1]
            # MUST have hashtags line with 15-20 hashtags
            tags = [w for w in last.split() if w.startswith('#')]
            if 15 <= len(tags) <= 20:
                return True
            # If no hashtags, it's incomplete
            return False

        def _attempt_finish(current_text: str, tries: int = 2) -> str:
            for attempt in range(tries):
                try:
                    # Check if we just need hashtags or a full continuation
                    lines = [l.strip() for l in current_text.strip().splitlines() if l.strip()]
                    last_line = lines[-1] if lines else ""
                    has_hashtags = any(w.startswith('#') for w in last_line.split())
                    
                    if has_hashtags:
                        # Already has hashtags line, might just need more hashtags
                        tags = [w for w in last_line.split() if w.startswith('#')]
                        if len(tags) >= 15:
                            return current_text  # Already complete
                    
                    # Determine what's missing
                    if not has_hashtags and current_text.strip().endswith(('.', '!', '?')):
                        # Complete sentence but no hashtags - just add hashtags
                        cont_prompt = (
                            "The LinkedIn post below is complete but missing the required hashtags. "
                            "Output ONLY a line with exactly 15-20 relevant diverse hashtags (space-separated). "
                            "Include hashtags for: topic, tech stack, community tags, career tags. "
                            "Format: #Tag1 #Tag2 #Tag3 etc.\n\nPOST:\n" + current_text
                        )
                    else:
                        # Incomplete - need to finish the thought AND add hashtags
                        cont_prompt = (
                            "The LinkedIn post below is incomplete. Continue it briefly (1-2 sentences max), "
                            "then on a NEW LINE add exactly 15-20 relevant diverse hashtags.\n\nPOST SO FAR:\n" + current_text
                        )
                    
                    resp = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[{"role": "user", "content": cont_prompt}],
                        temperature=0.6,
                        max_tokens=500,
                    )
                    addition = resp.choices[0].message.content.strip()
                    
                    # Smart merge - check if addition already has the full post
                    if len(addition) > len(current_text) * 0.8:
                        # Model repeated the whole post, use it directly
                        current_text = addition
                    else:
                        # Append the continuation
                        current_text = current_text.rstrip() + "\n\n" + addition
                    
                    if _looks_complete(current_text):
                        return current_text
                except Exception as e:
                    print(f"⚠️  Error attempting to finish truncated post: {e}")
                    continue
            # Last resort: force add synthesized hashtags
            print("⚠️  Using fallback hashtags generator...")
            if not current_text.strip().endswith(('.', '!', '?')):
                current_text = current_text.rstrip() + '.'
            # Use our synthesized hashtags
            from bot import synthesize_hashtags
            hashtags_line = synthesize_hashtags(current_text, desired=10)
            current_text = current_text.rstrip() + "\n\n" + hashtags_line
            return current_text

        if not _looks_complete(post_content):
            print("⚠️  Generated post appears incomplete — requesting continuation...")
            post_content = _attempt_finish(post_content, tries=2)

        return post_content
        
    except Exception as e:
        print(f"⚠️  Error generating post with Groq: {e}")
        print("💡 Tip: Make sure your Groq API key is valid and set in GROQ_API_KEY")
        return None

# --- IMAGE FUNCTIONS ---
def get_relevant_image(post_content):
    """Fetch a relevant image from Unsplash based on post content"""
    if not UNSPLASH_ACCESS_KEY:
        print("ℹ️  No Unsplash API key set, skipping image fetch")
        return None
    
    # Analyze post content for better image matching (Creative Technologist theme)
    content_lower = post_content.lower()
    
    # Prioritize images with CODE VISIBLE on screens - more engaging and relevant
    if any(word in content_lower for word in ['ui', 'ux', 'design', 'interface', 'beautiful', 'aesthetic']):
        search_term = random.choice([
            'designer working on ui design screen',
            'web design code on monitor',
            'figma interface on laptop screen',
            'graphic design software screen'
        ])
    elif any(word in content_lower for word in ['react', 'javascript', 'frontend', 'web app', 'website']):
        search_term = random.choice([
            'javascript code on laptop screen',
            'react code visible on monitor',
            'web developer coding javascript',
            'frontend code on computer display'
        ])
    elif any(word in content_lower for word in ['github', 'commit', 'code', 'repository', 'project']):
        search_term = random.choice([
            'github code visible on screen',
            'programming code displayed on laptop',
            'developer viewing code on monitor',
            'coding project on computer screen'
        ])
    elif any(word in content_lower for word in ['learn', 'student', 'study', 'journey', 'grow']):
        search_term = random.choice([
            'student coding with code on screen',
            'learning programming laptop display',
            'studying code on computer monitor',
            'person learning to code display'
        ])
    elif any(word in content_lower for word in ['team', 'collaborate', 'community', 'together']):
        search_term = random.choice([
            'developers working code on screens',
            'team programming computers display',
            'programmers pair coding screen',
            'developers collaboration code visible'
        ])
    elif any(word in content_lower for word in ['build', 'create', 'creative', 'innovation']):
        search_term = random.choice([
            'developer building app code screen',
            'programmer creating software display',
            'coding website project screen',
            'software development code visible'
        ])
    else:
        # Default: ALWAYS prioritize code/work visible on screen
        search_term = random.choice([
            'code on laptop screen close up',
            'programming code visible display',
            'developer working code monitor',
            'software engineer coding screen',
            'html css code on screen',
            'python code on laptop display'
        ])
    
    print(f"🖼️  Searching for image: '{search_term}'...")
    
    try:
        # Add more filters to get better quality, relevant tech photos
        url = f"https://api.unsplash.com/photos/random?query={quote(search_term)}&orientation=landscape&content_filter=high"
        headers = {
            'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            # Download the image directly and return the binary data
            # This avoids 404 issues with external URLs
            image_download_url = data['urls']['regular']
            image_description = data.get('alt_description', 'No description')
            print(f"✅ Found image: {image_description}")
            print(f"   Downloading...")
            
            # Download image content
            img_response = requests.get(image_download_url, timeout=10)
            if img_response.status_code == 200:
                print(f"✅ Image downloaded successfully ({len(img_response.content)} bytes)")
                return img_response.content  # Return binary data instead of URL
            else:
                print(f"⚠️  Failed to download image: {img_response.status_code}")
                return None
        else:
            print(f"⚠️  Unsplash API error: {response.status_code}")
            if response.status_code == 403:
                print("   Check your Unsplash API key and rate limits")
            elif response.status_code == 401:
                print("   Invalid API key - check your UNSPLASH_ACCESS_KEY")
            print(f"   Response: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"⚠️  Error fetching image: {e}")
        return None


def synthesize_hashtags(post_content, desired=18):
    """Create a fallback set of hashtags based on keywords in the post."""
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
    for d in defaults:
        if len(selected) >= desired:
            break
        if d not in selected:
            selected.append(d)
    # Ensure we have exactly `desired` hashtags
    if len(selected) > desired:
        selected = selected[:desired]
    return ' '.join(selected)

def upload_image_to_linkedin(image_data):
    """Upload an image to LinkedIn and return the asset URN"""
    print(f"📤 Uploading image to LinkedIn...")
    
    try:
        # Step 1: Register the upload
        register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
        headers = {
            'Authorization': f'Bearer {LINKEDIN_ACCESS_TOKEN}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        register_data = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": f"urn:li:person:{LINKEDIN_USER_URN}",
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent"
                    }
                ]
            }
        }
        
        response = requests.post(register_url, headers=headers, json=register_data)
        if response.status_code != 200:
            print(f"❌ Failed to register upload: {response.status_code}")
            print(response.text)
            return None
        
        register_response = response.json()
        asset_urn = register_response['value']['asset']
        upload_url = register_response['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl']
        
        # Step 2: Upload the image data directly (no download needed now)
        print("⬆️  Uploading to LinkedIn...")
        upload_headers = {
            'Authorization': f'Bearer {LINKEDIN_ACCESS_TOKEN}',
        }
        upload_response = requests.put(upload_url, headers=upload_headers, data=image_data)
        
        if upload_response.status_code in [200, 201]:
            print(f"✅ Image uploaded successfully: {asset_urn}")
            return asset_urn
        else:
            print(f"❌ Failed to upload image: {upload_response.status_code}")
            print(upload_response.text)
            return None
            
    except Exception as e:
        print(f"⚠️  Error uploading image: {e}")
        return None

# --- THE POSTING FUNCTION ---
def post_to_linkedin(message_text, image_asset_urn=None):
    """Post to LinkedIn with optional image"""
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        'Authorization': f'Bearer {LINKEDIN_ACCESS_TOKEN}',
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    
    # Prepare post data based on whether we have an image
    if image_asset_urn:
        post_data = {
            "author": f"urn:li:person:{LINKEDIN_USER_URN}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message_text},
                    "shareMediaCategory": "IMAGE",
                    "media": [
                        {
                            "status": "READY",
                            "media": image_asset_urn
                        }
                    ]
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
    else:
        post_data = {
            "author": f"urn:li:person:{LINKEDIN_USER_URN}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message_text},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
    
    print(f"🤖 Posting: '{message_text[:30]}...'")
    response = requests.post(url, headers=headers, json=post_data)
    if response.status_code == 201:
        print("\n✅ SUCCESS! Post is live.")
    else:
        print(f"\n❌ FAILED. {response.status_code}")
        print(response.text)

# --- MAIN BRAIN ---
if __name__ == "__main__":
    # Set TEST_MODE = True to preview posts without posting to LinkedIn
    TEST_MODE = False  # Change to False when you're ready to post live
    
    print("🤖 LinkedIn Post Bot Starting...\n")
    if TEST_MODE:
        print("🧪 TEST MODE ENABLED - Posts will NOT go live on LinkedIn\n")
    
    # Priority 1: Check for today's GitHub activity (may return multiple)
    print("Step 1️⃣: Checking GitHub activity...")
    github_activities = get_latest_github_activity()

    posts_to_publish = []

    if github_activities:
        print(f"✨ Found {len(github_activities)} GitHub activity(ies)!\n")
        posts_to_publish.extend(github_activities)
    else:
        # Fallback: check repo-level pushes (covers updates not visible in user events)
        print("\nStep 1️⃣b: No direct user events found — scanning repos for recent pushes...")
        repo_activities = get_recent_repo_updates()
        if repo_activities:
            print(f"✨ Found {len(repo_activities)} repo-level recent update(s)!\n")
            posts_to_publish.extend(repo_activities)
        else:
            # Priority 2: Check for GitHub stats/milestones
            print("\nStep 2️⃣: Checking GitHub milestones...")
            github_stats = get_github_stats()

            if github_stats and (github_stats['public_repos'] % 5 == 0 or github_stats['followers'] % 10 == 0):
                print("📊 Found a milestone! Generating post...\n")
                posts_to_publish.append(github_stats)
            else:
                # Priority 3: Use AI to generate generic dev content
                print("\nStep 3️⃣: Generating AI-powered generic post...\n")
                generic_context = {
                    'type': 'generic'
                }
                posts_to_publish.append(generic_context)
    
    # Post multiple items (one post per activity)
    if posts_to_publish:
        # Clear or create the preview file
        with open("last_generated_post.txt", "w", encoding="utf-8") as f:
            f.write("")

        for idx, ctx in enumerate(posts_to_publish):
            print(f"\n--- Generating post {idx+1}/{len(posts_to_publish)} ---")
            post_content = generate_post_with_ai(ctx)
            
            # Final fallback: if the model output seems truncated, append synthesized hashtags
            def _looks_complete_local(text: str) -> bool:
                if not text or len(text.strip()) < 150:
                    return False
                lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
                if not lines:
                    return False
                last = lines[-1]
                tags = [w for w in last.split() if w.startswith('#')]
                # MUST have 15-20 hashtags on the last line - no exceptions
                return 15 <= len(tags) <= 20

            if post_content and not _looks_complete_local(post_content):
                print("⚠️  Post missing proper hashtags line — applying fallback completion.")
                # Ensure post ends with proper punctuation
                if not post_content.strip().endswith(('.', '!', '?')):
                    # Find the last complete sentence
                    post_content = post_content.rstrip()
                    # If it trails off, add ellipsis or period
                    if post_content and post_content[-1].isalnum():
                        post_content += '.'
                hashtags_line = synthesize_hashtags(post_content, desired=18)
                post_content = post_content.rstrip() + '\n\n' + hashtags_line
            if not post_content:
                print("❌ Failed to generate post content for activity; skipping.")
                continue

            # Append to preview file with separator
            with open("last_generated_post.txt", "a", encoding="utf-8") as f:
                f.write("\n" + "="*60 + "\n")
                f.write(post_content + "\n")
                f.write("="*60 + "\n")

            print("\n📝 GENERATED POST PREVIEW (saved to last_generated_post.txt):")
            print(post_content)  # Show full post in preview

            if TEST_MODE:
                # Show image info in test mode
                image_data = get_relevant_image(post_content)
                if image_data:
                    print(f"🖼️  Image downloaded successfully ({len(image_data)} bytes - would be used in live mode)")
                else:
                    print("🖼️  No image for this post")
            else:
                # Live mode: fetch & upload image, then post
                image_data = get_relevant_image(post_content)
                image_asset_urn = None
                if image_data:
                    image_asset_urn = upload_image_to_linkedin(image_data)
                    if image_asset_urn:
                        print("🎨 Post will include an image!")

                post_to_linkedin(post_content, image_asset_urn)
                # Rate limit between posts to avoid spam
                if idx < (len(posts_to_publish) - 1):
                    delay_minutes = POST_DELAY_SECONDS / 60
                    print(f"⏱ Sleeping {delay_minutes:.0f} minutes before next post...")
                    time.sleep(POST_DELAY_SECONDS)
        print("\nAll posts processed. Previews saved to last_generated_post.txt")
    else:
        print("❌ No activities to generate posts from.")