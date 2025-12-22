import requests
import os
import logging
from datetime import datetime, timedelta, timezone

# Configure logging
logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"


def get_user_activity(username: str, limit: int = 10, token: str = None):
    """
    Fetch recent GitHub activity for a user.
    
    AUTHENTICATION LOGIC:
    1. If `token` (User PAT) is provided:
       - Uses authenticated endpoint: /users/{username}/events
       - Returns PUBLIC and PRIVATE events (visible to token)
       - Rate limit: 5000 req/hr
       
    2. If NO `token` provided:
       - Uses public endpoint: /users/{username}/events/public
       - Returns PUBLIC events only
       - Uses GITHUB_TOKEN (App Secret) if available for rate limit boost (5000 req/hr)
       - Otherwise uses unauthenticated IP limit (60 req/hr)
    """
    try:
        headers = {
            'Accept': 'application/vnd.github.v3+json'
        }
        
        # Determine endpoint and auth based on token presence
        if token:
            # Case 1: User-Authenticated (Private + Public)
            url = f"{GITHUB_API}/users/{username}/events"
            headers['Authorization'] = f'token {token}'
            logger.info(f"Fetching GitHub activity for {username} using USER token")
        else:
            # Case 2: Public API (Public only)
            url = f"{GITHUB_API}/users/{username}/events/public"
            
            # Use App-Level token for rate limit boost if user token is missing
            # Rules: "If github_access_token exists: Use authenticated... If NOT: Use public..."
            # This is still "Public API" scope, just boosted.
            app_token = os.getenv('GITHUB_TOKEN')
            if app_token:
                headers['Authorization'] = f'token {app_token}'
                logger.info(f"Fetching GitHub activity for {username} using APP token (public only)")
            else:
                logger.info(f"Fetching GitHub activity for {username} UN-AUTHENTICATED (low rate limit)")
        
        # Get user's events
        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )
        
        # Rate Limit handling
        if response.status_code == 403:
            logger.warning(f"GitHub API Rate Limit Exceeded for {username}. Headers: {response.headers}")
            return []
            
        if response.status_code != 200:
            logger.error(f"GitHub API Error {response.status_code}: {response.text}")
            return []
        
        events = response.json()[:limit]
        
        activities = []
        for event in events:
            activity = parse_event(event)
            if activity:
                activities.append(activity)
        
        return activities
    except Exception as e:
        logger.error(f"Error fetching GitHub activity: {e}")
        return []


def parse_event(event):
    """Parse GitHub event into simplified activity format"""
    event_type = event.get('type')
    repo = event.get('repo', {}).get('name', '')
    created_at = event.get('created_at', '')
    
    # Format timestamp
    try:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo)
        diff = now - dt
        
        if diff.days > 0:
            time_ago = f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            minutes = diff.seconds // 60
            time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    except:
        time_ago = "recently"
    
    activity = {
        'id': event.get('id'),
        'repo': repo,
        'time_ago': time_ago,
        'created_at': created_at
    }
    
    if event_type == 'PushEvent':
        payload = event.get('payload', {})
        commits = len(payload.get('commits', []))
        # Handle both regular pushes and force pushes/updates (0 commits)
        if commits == 0:
            # Force push or branch update - still show it
            activity.update({
                'type': 'push',
                'icon': '🔄',
                'title': f"Updated {repo} branch",
                'description': "Repository update (force push or sync)",
                'context': {
                    'type': 'push',
                    'commits': 0,
                    'repo': repo.split('/')[-1],
                    'full_repo': repo,
                    'date': time_ago
                }
            })
        else:
            activity.update({
                'type': 'push',
                'icon': '🚀',
                'title': f"Pushed {commits} commit{'s' if commits != 1 else ''} to {repo}",
                'description': f"{commits} new commit{'s' if commits != 1 else ''}",
                'context': {
                    'type': 'push',
                    'commits': commits,
                    'repo': repo.split('/')[-1],
                    'full_repo': repo,
                    'date': time_ago
                }
            })
        return activity

    
    elif event_type == 'PullRequestEvent':
        payload = event.get('payload', {})
        action = payload.get('action', 'opened')
        pr = payload.get('pull_request', {})
        pr_number = pr.get('number', '')
        pr_title = pr.get('title', '')
        
        activity.update({
            'type': 'pull_request',
            'icon': '🔀',
            'title': f"Pull request #{pr_number} {action} in {repo}",
            'description': pr_title[:100],
            'context': {
                'type': 'pull_request',
                'action': action,
                'pr_number': pr_number,
                'pr_title': pr_title,
                'repo': repo.split('/')[-1],
                'full_repo': repo,
                'date': time_ago
            }
        })
        return activity
    
    elif event_type == 'CreateEvent':
        payload = event.get('payload', {})
        ref_type = payload.get('ref_type', 'repository')
        
        if ref_type == 'repository':
            activity.update({
                'type': 'new_repo',
                'icon': '✨',
                'title': f"Created new repository {repo}",
                'description': payload.get('description', 'New repository'),
                'context': {
                    'type': 'new_repo',
                    'repo': repo.split('/')[-1],
                    'full_repo': repo,
                    'date': time_ago
                }
            })
            return activity
    
    elif event_type == 'IssuesEvent':
        payload = event.get('payload', {})
        action = payload.get('action', 'opened')
        issue = payload.get('issue', {})
        
        activity.update({
            'type': 'issue',
            'icon': '🐛',
            'title': f"Issue {action} in {repo}",
            'description': issue.get('title', '')[:100],
            'context': {
                'type': 'generic',
                'activity': f"issue {action}",
                'repo': repo.split('/')[-1],
                'full_repo': repo,
                'date': time_ago
            }
        })
        return activity
    
    elif event_type == 'ReleaseEvent':
        payload = event.get('payload', {})
        release = payload.get('release', {})
        
        activity.update({
            'type': 'release',
            'icon': '🎉',
            'title': f"Released {release.get('tag_name', '')} in {repo}",
            'description': release.get('name', '')[:100],
            'context': {
                'type': 'milestone',
                'milestone': release.get('tag_name', ''),
                'repo': repo.split('/')[-1],
                'full_repo': repo,
                'date': time_ago
            }
        })
        return activity
    
    return None


def get_repo_details(repo_full_name: str, token: str = None):
    """Get repository details"""
    try:
        headers = {
            'Accept': 'application/vnd.github.v3+json'
        }
        
        if token:
            headers['Authorization'] = f'token {token}'
        else:
            app_token = os.getenv('GITHUB_TOKEN')
            if app_token:
                headers['Authorization'] = f'token {app_token}'
        
        response = requests.get(
            f"{GITHUB_API}/repos/{repo_full_name}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'name': data.get('name'),
                'description': data.get('description'),
                'stars': data.get('stargazers_count', 0),
                'language': data.get('language'),
                'url': data.get('html_url')
            }
    except Exception as e:
        logger.error(f"Error fetching repo details: {e}")
    
    return None


def get_github_stats(username: str, token: str = None):
    """
    Fetch GitHub user stats for inspirational posts.
    
    Args:
        username: GitHub username
        token: Optional user PAT for authenticated requests
        
    Returns:
        dict with public_repos, followers, location, html_url, login
        
    MULTI-TENANT: Accepts user token for per-user API calls.
    """
    logger.info(f"Fetching GitHub stats for {username}...")
    try:
        url = f"{GITHUB_API}/users/{username}"
        headers = {'Accept': 'application/vnd.github.v3+json'}
        
        if token:
            headers['Authorization'] = f'token {token}'
        else:
            app_token = os.getenv('GITHUB_TOKEN')
            if app_token:
                headers['Authorization'] = f'token {app_token}'
        
        response = requests.get(url, headers=headers, timeout=10)
        
        # Handle unauthorized token
        if response.status_code == 401 and 'Authorization' in headers:
            logger.warning("GitHub token unauthorized, retrying without auth")
            del headers['Authorization']
            response = requests.get(url, headers=headers, timeout=10)

        if response.status_code != 200:
            logger.warning(f"Could not fetch GitHub user info: {response.status_code}")
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
        logger.error(f"Error fetching GitHub stats: {e}")
        return None


def get_recent_repo_updates(username: str, token: str = None, hours: int = 24):
    """
    Scan user's repositories and return recent updates (pushed_at) within the time window.
    
    Args:
        username: GitHub username
        token: Optional user PAT for authenticated requests
        hours: Time window to look back (default 24 hours)
        
    Returns:
        List of activity dicts, or None on error
        
    MULTI-TENANT: Accepts user token for per-user API calls.
    """
    logger.info(f"Scanning repos for recent pushes for {username}...")
    try:
        url = f"{GITHUB_API}/users/{username}/repos?per_page=100&type=owner"
        headers = {'Accept': 'application/vnd.github.v3+json'}
        
        if token:
            headers['Authorization'] = f'token {token}'
        else:
            app_token = os.getenv('GITHUB_TOKEN')
            if app_token:
                headers['Authorization'] = f'token {app_token}'
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Could not fetch repos: {response.status_code}")
            return None

        repos = response.json()
        now_utc = datetime.now(timezone.utc)
        cutoff = now_utc - timedelta(hours=hours)

        recent = []
        for r in repos:
            pushed = r.get('pushed_at')
            if not pushed:
                continue
            
            try:
                pushed_dt = datetime.fromisoformat(pushed.replace('Z', '+00:00'))
            except ValueError:
                continue
                
            if pushed_dt >= cutoff:
                repo_name = r.get('name')
                full_repo = r.get('full_name')
                
                # Try to get latest commit info
                commit_url = f"{GITHUB_API}/repos/{full_repo}/commits?per_page=1"
                c_resp = requests.get(commit_url, headers=headers, timeout=10)
                
                if c_resp.status_code == 200:
                    commits = c_resp.json()
                    if commits:
                        commit = commits[0]
                        commit_time = commit.get('commit', {}).get('author', {}).get('date')
                        try:
                            commit_dt = datetime.fromisoformat(commit_time.replace('Z', '+00:00'))
                            delta = now_utc - commit_dt
                            hours_ago = int(delta.total_seconds() // 3600)
                            when_text = f"{hours_ago} hour{'s' if hours_ago != 1 else ''} ago" if hours_ago >= 1 else f"{max(1,int(delta.total_seconds()//60))} minutes ago"
                        except:
                            when_text = "recently"
                        
                        recent.append({
                            'type': 'push',
                            'repo': repo_name,
                            'full_repo': full_repo,
                            'commits': 1,
                            'date': when_text
                        })
                else:
                    delta = now_utc - pushed_dt
                    hours_ago = int(delta.total_seconds() // 3600)
                    when_text = f"{hours_ago} hour{'s' if hours_ago != 1 else ''} ago" if hours_ago >= 1 else "recently"
                    recent.append({
                        'type': 'push',
                        'repo': repo_name,
                        'full_repo': full_repo,
                        'commits': 1,
                        'date': when_text
                    })

        return recent
    except Exception as e:
        logger.error(f"Error scanning repos: {e}")
        return None

