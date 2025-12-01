"""Apply the canonical SQL schema from ../doc/schema.sql to the configured MySQL database.
This script uses PyMySQL and reads DB config from backend/.env (loaded by app).
"""
import os
import pymysql
from dotenv import load_dotenv

# repo root is two levels up from this script (project root)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(os.path.dirname(ROOT), '.env'))

# Prefer backend/.env if present
load_dotenv(os.path.join(ROOT, 'backend', '.env'))

DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'face_attendance')

schema_path = os.path.join(ROOT, 'doc', 'schema.sql')
if not os.path.exists(schema_path):
    print('schema.sql not found at', schema_path)
    raise SystemExit(1)

with open(schema_path, 'r', encoding='utf-8') as f:
    sql = f.read()

conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, autocommit=True)
try:
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` DEFAULT CHARACTER SET utf8mb4")
        cur.execute(f"USE `{DB_NAME}`")
        # split by ; and execute statements (simple)
        for stmt in sql.split(';'):
            s = stmt.strip()
            if s:
                cur.execute(s)
    print('Schema applied to database', DB_NAME)
finally:
    conn.close()
