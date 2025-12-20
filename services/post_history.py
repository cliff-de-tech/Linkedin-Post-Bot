import sqlite3
import os
import json
import time

DB_PATH = os.getenv('POST_HISTORY_DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'post_history.db'))


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
    CREATE TABLE IF NOT EXISTS post_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        post_content TEXT,
        post_type TEXT,
        context TEXT,
        status TEXT,
        linkedin_post_id TEXT,
        engagement TEXT,
        created_at INTEGER,
        published_at INTEGER
    )
    ''')
    conn.commit()
    conn.close()


def save_post(user_id: str, post_content: str, post_type: str, context: dict, status: str = 'draft', linkedin_post_id: str = None):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    timestamp = int(time.time())
    published_at = timestamp if status == 'published' else None
    
    cur.execute('''
    INSERT INTO post_history 
    (user_id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        post_content,
        post_type,
        json.dumps(context),
        status,
        linkedin_post_id,
        json.dumps({}),
        timestamp,
        published_at
    ))
    post_id = cur.lastrowid
    conn.commit()
    conn.close()
    return post_id


def get_user_posts(user_id: str, limit: int = 50, status: str = None):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    if status:
        cur.execute('''
        SELECT id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at
        FROM post_history 
        WHERE user_id=? AND status=?
        ORDER BY created_at DESC
        LIMIT ?
        ''', (user_id, status, limit))
    else:
        cur.execute('''
        SELECT id, post_content, post_type, context, status, linkedin_post_id, engagement, created_at, published_at
        FROM post_history 
        WHERE user_id=?
        ORDER BY created_at DESC
        LIMIT ?
        ''', (user_id, limit))
    
    rows = cur.fetchall()
    conn.close()
    
    posts = []
    for row in rows:
        posts.append({
            'id': row[0],
            'post_content': row[1],
            'post_type': row[2],
            'context': json.loads(row[3]) if row[3] else {},
            'status': row[4],
            'linkedin_post_id': row[5],
            'engagement': json.loads(row[6]) if row[6] else {},
            'created_at': row[7],
            'published_at': row[8]
        })
    
    return posts


def update_post_status(post_id: int, status: str, linkedin_post_id: str = None):
    conn = get_conn()
    cur = conn.cursor()
    
    published_at = int(time.time()) if status == 'published' else None
    
    if linkedin_post_id:
        cur.execute('''
        UPDATE post_history 
        SET status=?, linkedin_post_id=?, published_at=?
        WHERE id=?
        ''', (status, linkedin_post_id, published_at, post_id))
    else:
        cur.execute('''
        UPDATE post_history 
        SET status=?, published_at=?
        WHERE id=?
        ''', (status, published_at, post_id))
    
    conn.commit()
    conn.close()


def delete_post(post_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('DELETE FROM post_history WHERE id=?', (post_id,))
    conn.commit()
    conn.close()


def get_user_stats(user_id: str):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    
    # Total posts
    cur.execute('SELECT COUNT(*) FROM post_history WHERE user_id=?', (user_id,))
    total_posts = cur.fetchone()[0]
    
    # Published posts
    cur.execute('SELECT COUNT(*) FROM post_history WHERE user_id=? AND status=?', (user_id, 'published'))
    published_posts = cur.fetchone()[0]
    
    # This month
    current_month_start = int(time.time()) - (30 * 24 * 60 * 60)
    cur.execute('SELECT COUNT(*) FROM post_history WHERE user_id=? AND created_at > ?', (user_id, current_month_start))
    posts_this_month = cur.fetchone()[0]
    
    conn.close()
    
    return {
        'total_posts': total_posts,
        'published_posts': published_posts,
        'posts_this_month': posts_this_month,
        'draft_posts': total_posts - published_posts
    }
