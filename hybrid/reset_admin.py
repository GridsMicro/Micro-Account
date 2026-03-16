import os
from sqlalchemy import create_engine, text
from passlib.hash import pbkdf2_sha256
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

new_pass = "Admin1234"
new_hash = pbkdf2_sha256.hash(new_pass)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET password_hash = :hash WHERE username = 'Admin'"), {"hash": new_hash})
        conn.commit()
    print(f"SUCCESS: Set Admin password to '{new_pass}'")
except Exception as e:
    print(f"ERROR: {e}")
