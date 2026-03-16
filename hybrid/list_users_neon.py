import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text('SELECT username, role, password_hash FROM users')).fetchall()
        print("--- Users in Neon Cloud ---")
        for user in res:
            print(f"Username: {user[0]} | Role: {user[1]} | Hash: {user[2]}")
except Exception as e:
    print(f"ERROR: {e}")
