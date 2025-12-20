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
    cur.execute('''
    CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        linkedin_client_id TEXT,
        linkedin_client_secret TEXT,
        github_username TEXT,
        groq_api_key TEXT,
        unsplash_access_key TEXT,
        persona TEXT,
        created_at INTEGER,
        updated_at INTEGER
    )
    ''')
    conn.commit()
    conn.close()


def save_user_settings(user_id: str, settings: dict):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    import time
    timestamp = int(time.time())
    
    cur.execute('''
    INSERT INTO user_settings 
    (user_id, linkedin_client_id, linkedin_client_secret, github_username, 
     groq_api_key, unsplash_access_key, persona, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
        linkedin_client_id=excluded.linkedin_client_id,
        linkedin_client_secret=excluded.linkedin_client_secret,
        github_username=excluded.github_username,
        groq_api_key=excluded.groq_api_key,
        unsplash_access_key=excluded.unsplash_access_key,
        persona=excluded.persona,
        updated_at=excluded.updated_at
    ''', (
        user_id,
        settings.get('linkedin_client_id'),
        settings.get('linkedin_client_secret'),
        settings.get('github_username'),
        settings.get('groq_api_key'),
        settings.get('unsplash_access_key'),
        json.dumps(settings.get('persona', {})),
        timestamp,
        timestamp
    ))
    conn.commit()
    conn.close()


def get_user_settings(user_id: str):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM user_settings WHERE user_id=?', (user_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        'user_id': row[1],
        'linkedin_client_id': row[2],
        'linkedin_client_secret': row[3],
        'github_username': row[4],
        'groq_api_key': row[5],
        'unsplash_access_key': row[6],
        'persona': json.loads(row[7]) if row[7] else {},
        'created_at': row[8],
        'updated_at': row[9]
    }
