#!/usr/bin/env python3
import os
import pymysql
import urllib.request
import json

ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
ENV_PATH = os.path.normpath(ENV_PATH)

def load_env(path):
    env = {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        print(json.dumps({'error': f".env not found at {path}"}))
        raise
    return env


def main():
    env = load_env(ENV_PATH)
    host = env.get('DB_HOST', env.get('MYSQL_HOST', '127.0.0.1'))
    port = int(env.get('DB_PORT', env.get('MYSQL_PORT', '3306')))
    user = env.get('DB_USER', env.get('MYSQL_USER', 'root'))
    password = env.get('DB_PASSWORD', env.get('MYSQL_PASSWORD', ''))
    db = env.get('DB_NAME', env.get('MYSQL_DB', env.get('MYSQL_DATABASE', 'test')))

    out = {'db': {'host': host, 'port': port, 'db': db}, 'tables': {}, 'health': None}

    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=password, db=db, charset='utf8mb4')
    except Exception as e:
        out['error'] = f"Failed to connect to MySQL: {e}"
        print(json.dumps(out, indent=2))
        return

    try:
        with conn.cursor() as cur:
            cur.execute('SHOW TABLES')
            rows = cur.fetchall()
            existing = [r[0] for r in rows]
            out['db']['tables_all'] = existing

            for t in ['users', 'faces', 'attendance', 'refresh_tokens']:
                if t in existing:
                    try:
                        cur.execute(f"SHOW CREATE TABLE `{t}`")
                        r = cur.fetchone()
                        out['tables'][t] = {
                            'exists': True,
                            'create': r[1][:4000] if r and len(r) > 1 else None
                        }
                    except Exception as e:
                        out['tables'][t] = {'exists': True, 'error': str(e)}
                else:
                    out['tables'][t] = {'exists': False}
    finally:
        conn.close()

    # Smoke test /health
    health_urls = [
        env.get('APP_HEALTH_URL'),
        env.get('HEALTH_URL'),
        'http://127.0.0.1:5000/health',
        'http://localhost:5000/health',
    ]
    tried = set()
    for url in health_urls:
        if not url:
            continue
        if url in tried:
            continue
        tried.add(url)
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                out['health'] = {'url': url, 'status': r.status, 'body': r.read(1024).decode('utf-8', errors='replace')}
                break
        except Exception as e:
            out.setdefault('health_errors', []).append({'url': url, 'error': str(e)})

    print(json.dumps(out, indent=2))

if __name__ == '__main__':
    main()
