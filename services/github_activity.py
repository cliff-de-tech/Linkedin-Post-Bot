import requests
import os
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple

# Configure logging
logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

# =============================================================================
# SIMPLE IN-MEMORY CACHE
# Speeds up dashboard loading by caching GitHub API responses for 5 minutes
# =============================================================================
_cache: Dict[str, Tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def _get_cached(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if key in _cache:
        value, expires_at = _cache[key]
        if time.time() < expires_at:
            logger.debug(f"Cache HIT for {key}")
            return value
        else:
            del _cache[key]
            logger.debug(f"Cache EXPIRED for {key}")
    return None


def _set_cached(key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    """Store value in cache with TTL."""
    _cache[key] = (value, time.time() + ttl)
    logger.debug(f"Cache SET for {key}, expires in {ttl}s")


def clear_github_cache(username: str = None) -> None:
    """Clear cache for a user or all cache."""
    global _cache
    if username:
        keys_to_delete = [k for k in _cache if username in k]
        for k in keys_to_delete:
            del _cache[k]
        logger.info(f"Cleared cache for {username} ({len(keys_to_delete)} entries)")
    else:
        _cache = {}
        logger.info("Cleared all GitHub cache")


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
    
    CACHING: Results are cached for 5 minutes to speed up dashboard loading.
    """
    # Check cache first
    cache_key = f"activity:{username}:{limit}:{bool(token)}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached
    
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
        commits_data = payload.get('commits', [])
        commits_count = len(commits_data)
        
        # If commits array is empty but we have head/before SHAs, try Compare API
        # GitHub Events API sometimes doesn't include commits array
        if commits_count == 0:
            head_sha = payload.get('head')
            before_sha = payload.get('before')
            
            # If we have both SHAs, try to get commit count from Compare API
            if head_sha and before_sha and before_sha != '0000000000000000000000000000000000000000':
                try:
                    headers = {'Accept': 'application/vnd.github.v3+json'}
                    app_token = os.getenv('GITHUB_TOKEN')
                    if app_token:
                        headers['Authorization'] = f'token {app_token}'
                    
                    compare_url = f"{GITHUB_API}/repos/{repo}/compare/{before_sha}...{head_sha}"
                    compare_resp = requests.get(compare_url, headers=headers, timeout=5)
                    
                    if compare_resp.status_code == 200:
                        compare_data = compare_resp.json()
                        commits_count = compare_data.get('total_commits', 0)
                        # Get commit messages from compare
                        compare_commits = compare_data.get('commits', [])
                        commits_data = compare_commits  # Use for message extraction
                        logger.info(f"Got {commits_count} commits from Compare API for {repo}")
                except Exception as e:
                    logger.warning(f"Compare API failed for {repo}: {e}")
                    # Fall back to assuming at least 1 commit since there was a push
                    commits_count = 1
        
        # Extract commit messages for personalized posts (Pro feature)
        # Limit to 5 messages, truncate each to 100 chars
        commit_messages = []
        for commit in commits_data[:5]:
            # Handle both Events API format and Compare API format
            message = commit.get('message') or commit.get('commit', {}).get('message', '')
            # Take first line only and truncate
            first_line = message.split('\n')[0][:100]
            if first_line:
                commit_messages.append(first_line)
        
        # Handle both regular pushes and force pushes/updates (0 commits)
        if commits_count == 0:
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
                    'date': time_ago,
                    'commit_messages': []
                }
            })
        else:
            # Build a summary description from commit messages
            description = f"{commits_count} new commit{'s' if commits_count != 1 else ''}"
            if commit_messages:
                description = commit_messages[0][:60]
                if len(commit_messages) > 1:
                    description += f" (+{len(commit_messages)-1} more)"
            
            activity.update({
                'type': 'push',
                'icon': '🚀',
                'title': f"Pushed {commits_count} commit{'s' if commits_count != 1 else ''} to {repo}",
                'description': description,
                'context': {
                    'type': 'push',
                    'commits': commits_count,
                    'repo': repo.split('/')[-1],
                    'full_repo': repo,
                    'date': time_ago,
                    'commit_messages': commit_messages  # Pro feature data
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
    """Get repository details including total commit count"""
    # Check cache first
    cache_key = f"repo_details:{repo_full_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached
    
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
            
            # Get total commit count using the contributors stats endpoint
            # This is more accurate than paginating through all commits
            total_commits = 0
            try:
                # Use the participation stats which gives commit counts
                contrib_response = requests.get(
                    f"{GITHUB_API}/repos/{repo_full_name}/contributors?per_page=100&anon=true",
                    headers=headers,
                    timeout=10
                )
                if contrib_response.status_code == 200:
                    contributors = contrib_response.json()
                    # Ensure it's a list (API might return dict on error)
                    if isinstance(contributors, list) and len(contributors) > 0:
                        # Sum all contributor commits
                        total_commits = sum(c.get('contributions', 0) for c in contributors)
                        logger.info(f"Got {total_commits} total commits for {repo_full_name} from contributors")
            except Exception as e:
                logger.warning(f"Could not get contributor stats for {repo_full_name}: {e}")
            
            # Fallback: estimate from commit count header if still 0
            if total_commits == 0:
                try:
                    # Get first page of commits to check total via Link header
                    commits_resp = requests.get(
                        f"{GITHUB_API}/repos/{repo_full_name}/commits?per_page=1",
                        headers=headers,
                        timeout=5
                    )
                    if commits_resp.status_code == 200:
                        # Parse Link header to get total pages
                        link_header = commits_resp.headers.get('Link', '')
                        if 'last' in link_header:
                            # Extract last page number from Link header
                            import re
                            match = re.search(r'page=(\d+)>; rel="last"', link_header)
                            if match:
                                total_commits = int(match.group(1))
                                logger.info(f"Estimated {total_commits} commits for {repo_full_name} from pagination")
                        else:
                            # No pagination = single page = count the commits on this page
                            # Actually, with per_page=1, if there's at least 1 commit, there's at least 1
                            commits_data = commits_resp.json()
                            if isinstance(commits_data, list) and len(commits_data) > 0:
                                # Try to get actual count by fetching with higher per_page
                                commits_resp2 = requests.get(
                                    f"{GITHUB_API}/repos/{repo_full_name}/commits?per_page=100",
                                    headers=headers,
                                    timeout=10
                                )
                                if commits_resp2.status_code == 200:
                                    all_commits = commits_resp2.json()
                                    if isinstance(all_commits, list):
                                        total_commits = len(all_commits)
                                        # Check if there are more pages
                                        link_header2 = commits_resp2.headers.get('Link', '')
                                        if 'last' in link_header2:
                                            match2 = re.search(r'page=(\d+)>; rel="last"', link_header2)
                                            if match2:
                                                total_commits = int(match2.group(1)) * 100  # Rough estimate
                                        logger.info(f"Counted {total_commits} commits for {repo_full_name} from commit list")
                except Exception as e2:
                    logger.warning(f"Commit count fallback failed: {e2}")
            
            result = {
                'name': data.get('name'),
                'full_name': data.get('full_name'),
                'description': data.get('description'),
                'stars': data.get('stargazers_count', 0),
                'forks': data.get('forks_count', 0),
                'language': data.get('language'),
                'url': data.get('html_url'),
                'total_commits': total_commits,
                'default_branch': data.get('default_branch', 'main')
            }
            
            # Cache the result
            _set_cached(cache_key, result, ttl=600)  # Cache for 10 minutes
            return result
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

