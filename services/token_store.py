import sqlite3
import os
import time

DB_PATH = os.getenv('TOKEN_DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'backend_tokens.db'))


def get_conn():
    dirpath = os.path.dirname(DB_PATH)
    if not os.path.exists(dirpath):
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
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        linkedin_user_urn TEXT UNIQUE,
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER
    )
    ''')
    conn.commit()
    conn.close()


def save_token(linkedin_user_urn, access_token, refresh_token=None, expires_at=None):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
    INSERT INTO accounts (linkedin_user_urn, access_token, refresh_token, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(linkedin_user_urn) DO UPDATE SET
        access_token=excluded.access_token,
        refresh_token=excluded.refresh_token,
        expires_at=excluded.expires_at
    ''', (linkedin_user_urn, access_token, refresh_token, expires_at))
    conn.commit()
    conn.close()


def get_token_by_urn(linkedin_user_urn):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT linkedin_user_urn, access_token, refresh_token, expires_at FROM accounts WHERE linkedin_user_urn=?', (linkedin_user_urn,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        'linkedin_user_urn': row[0],
        'access_token': row[1],
        'refresh_token': row[2],
        'expires_at': row[3]
    }


def get_all_tokens():
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT linkedin_user_urn, access_token, refresh_token, expires_at FROM accounts')
    rows = cur.fetchall()
    conn.close()
    results = []
    for r in rows:
        results.append({'linkedin_user_urn': r[0], 'access_token': r[1], 'refresh_token': r[2], 'expires_at': r[3]})
    return results


if __name__ == '__main__':
    init_db()
    print('Initialized token DB at', DB_PATH)
