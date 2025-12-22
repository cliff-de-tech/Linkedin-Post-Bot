"""Test script to debug GitHub activity parsing"""
import requests
import sys
sys.path.append('.')

from services.github_activity import get_user_activity, parse_event

username = 'cliff-de-tech'
print(f"===== GITHUB DEBUG for {username} =====")

# Get raw events
r = requests.get(f'https://api.github.com/users/{username}/events/public', timeout=10)
events = r.json()[:10]

print(f"Raw API returned {len(events)} events")
for e in events[:5]:
    etype = e.get('type', 'Unknown')
    commits = len(e.get('payload', {}).get('commits', []))
    ref = e.get('payload', {}).get('ref_type', '-')
    print(f"  {etype}: commits={commits} ref_type={ref}")

print()
print("After parse_event:")
for e in events[:5]:
    p = parse_event(e)
    print(f"  {p.get('type') if p else 'FILTERED OUT'}")

print()
print(f"get_user_activity: {len(get_user_activity(username, 10))} results")

