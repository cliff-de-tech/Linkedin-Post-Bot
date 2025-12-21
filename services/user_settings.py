import sqlite3
import os
import json

DB_PATH = os.getenv('USER_SETTINGS_DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'user_settings.db'))


def get_conn():
    dirpath = os.path.dirname(DB_PATH)
    if dirpath and not os.path.exists(dirpath):
        try:
            os.makedirs(dirpath, exist_ok=True)
        except Exception:
            pass
    conn = sqlite3.connect(DB_PATH)
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    
    # Check if table exists to determine if we need to migrate/alter
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'")
    table_exists = cur.fetchone() is not None
    
    if not table_exists:
        cur.execute('''
        CREATE TABLE user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            linkedin_client_id TEXT,
            linkedin_client_secret TEXT,
            github_username TEXT,
            groq_api_key TEXT,
            unsplash_access_key TEXT,
            persona TEXT,
            subscription_tier TEXT DEFAULT 'free',
            subscription_status TEXT DEFAULT 'active',
            subscription_expires_at INTEGER,
            created_at INTEGER,
            updated_at INTEGER
        )
        ''')
    else:
        # Check if new columns exist, if not add them (simple migration)
        cur.execute("PRAGMA table_info(user_settings)")
        columns = [info[1] for info in cur.fetchall()]
        
        if 'subscription_tier' not in columns:
            cur.execute("ALTER TABLE user_settings ADD COLUMN subscription_tier TEXT DEFAULT 'free'")
        if 'subscription_status' not in columns:
            cur.execute("ALTER TABLE user_settings ADD COLUMN subscription_status TEXT DEFAULT 'active'")
        if 'subscription_expires_at' not in columns:
            cur.execute("ALTER TABLE user_settings ADD COLUMN subscription_expires_at INTEGER")

    conn.commit()
    conn.close()


def save_user_settings(user_id: str, settings: dict):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    import time
    timestamp = int(time.time())
    
    # First, get existing settings to merge with new ones
    existing = get_user_settings(user_id) or {}
    
    # Merge: only update fields that are explicitly provided and not empty
    def merge_field(key):
        new_val = settings.get(key)
        # If new value is provided and not empty, use it; otherwise keep existing
        if new_val is not None and new_val != '':
            return new_val
        return existing.get(key) or None
    
    merged = {
        'linkedin_client_id': merge_field('linkedin_client_id'),
        'linkedin_client_secret': merge_field('linkedin_client_secret'),
        'github_username': merge_field('github_username'),
        'groq_api_key': merge_field('groq_api_key'),
        'unsplash_access_key': merge_field('unsplash_access_key'),
        'persona': settings.get('persona') or existing.get('persona') or {},
        'subscription_tier': settings.get('subscription_tier') or existing.get('subscription_tier') or 'free',
        'subscription_status': settings.get('subscription_status') or existing.get('subscription_status') or 'active',
    }
    
    cur.execute('''
    INSERT INTO user_settings 
    (user_id, linkedin_client_id, linkedin_client_secret, github_username, 
     groq_api_key, unsplash_access_key, persona, subscription_tier, subscription_status, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
        linkedin_client_id=excluded.linkedin_client_id,
        linkedin_client_secret=excluded.linkedin_client_secret,
        github_username=excluded.github_username,
        groq_api_key=excluded.groq_api_key,
        unsplash_access_key=excluded.unsplash_access_key,
        persona=excluded.persona,
        subscription_tier=excluded.subscription_tier,
        subscription_status=excluded.subscription_status,
        updated_at=excluded.updated_at
    ''', (
        user_id,
        merged['linkedin_client_id'],
        merged['linkedin_client_secret'],
        merged['github_username'],
        merged['groq_api_key'],
        merged['unsplash_access_key'],
        json.dumps(merged['persona']),
        merged['subscription_tier'],
        merged['subscription_status'],
        timestamp,
        existing.get('created_at', timestamp) # Preserve created_at on update
    ))
    conn.commit()
    conn.close()


def get_user_settings(user_id: str):
    init_db()
    conn = get_conn()
    conn.row_factory = sqlite3.Row  # Enable accessing columns by name
    cur = conn.cursor()
    cur.execute('SELECT * FROM user_settings WHERE user_id=?', (user_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # helper to safely get column
    def get_col(name, default=None):
        try:
            return row[name]
        except (IndexError, KeyError):
            return default

    return {
        'user_id': get_col('user_id'),
        'linkedin_client_id': get_col('linkedin_client_id'),
        'linkedin_client_secret': get_col('linkedin_client_secret'),
        'github_username': get_col('github_username'),
        'groq_api_key': get_col('groq_api_key'),
        'unsplash_access_key': get_col('unsplash_access_key'),
        'persona': json.loads(get_col('persona') or '{}') if get_col('persona') else {},
        'subscription_tier': get_col('subscription_tier', 'free'),
        'subscription_status': get_col('subscription_status', 'active'),
        'subscription_expires_at': get_col('subscription_expires_at'),
        'created_at': get_col('created_at'),
        'updated_at': get_col('updated_at')
    }
