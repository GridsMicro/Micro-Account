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
        res = conn.execute(text('SELECT name, tax_id FROM company LIMIT 1')).fetchone()
        if res:
            print(f"SUCCESS: Found Company -> {res[0]} (Tax ID: {res[1]})")
        else:
            print("WARNING: Company table exists but no data found.")
except Exception as e:
    print(f"ERROR connecting to Neon: {e}")
