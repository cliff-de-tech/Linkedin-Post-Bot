with open('last_generated_post.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    posts = content.split('='*60)
    valid_posts = [p.strip() for p in posts if p.strip() and len(p.strip()) > 50]
    
    print(f'Total posts found: {len(valid_posts)}\n')
    
    for i, post in enumerate(valid_posts, 1):
        lines = [l.strip() for l in post.splitlines() if l.strip()]
        if not lines:
            continue
            
        last_line = lines[-1]
        tags = [w for w in last_line.split() if w.startswith('#')]
        
        print(f'Post {i}:')
        print(f'  Total lines: {len(lines)}')
        print(f'  Hashtags on last line: {len(tags)}')
        print(f'  Last line: {last_line}')
        print(f'  Status: {"✅ COMPLETE" if len(tags) >= 8 else "❌ INCOMPLETE"}')
        print()
