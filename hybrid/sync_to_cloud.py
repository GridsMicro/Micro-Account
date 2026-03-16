import sqlite3
import os
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

# Configuration
SQLITE_DB = "database.db"
NEON_URL = os.getenv("DATABASE_URL")

BOOLEAN_COLUMNS = {
    'is_setup', 'is_default', 'is_active', 'receipt_issued', 
    'tax_deductible', 'submitted', 'auto_send_email', 'smtp_use_tls'
}

def migrate_data():
    if not os.path.exists(SQLITE_DB):
        print(f"❌ Error: {SQLITE_DB} not found.")
        return

    print("🔌 Connecting to Local SQLite and Neon Cloud...")
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()

        neon_conn = psycopg2.connect(NEON_URL)
        neon_cursor = neon_conn.cursor()

        # Get all tables from SQLite
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row['name'] for row in sqlite_cursor.fetchall()]

        print(f"📦 Found {len(tables)} tables to sync.")

        for table in tables:
            print(f"⏳ Syncing table: {table}...", end=" ", flush=True)
            
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print("Empty (Skipped)")
                continue

            columns = rows[0].keys()
            
            # Prepare data and handle Boolean conversion
            data_to_insert = []
            for row in rows:
                new_row = []
                for col in columns:
                    val = row[col]
                    if col in BOOLEAN_COLUMNS and isinstance(val, int):
                        val = bool(val)
                    new_row.append(val)
                data_to_insert.append(tuple(new_row))

            # Quote column names with double quotes for PostgreSQL reserved keywords
            quoted_col_names = ", ".join([f'"{col}"' for col in columns])
            
            # Truncate and insert
            neon_cursor.execute(f'TRUNCATE TABLE "{table}" CASCADE;') 
            
            execute_values(neon_cursor, f'INSERT INTO "{table}" ({quoted_col_names}) VALUES %s', data_to_insert)
            
            print(f"✅ {len(rows)} records synced.")

        neon_conn.commit()
        print("\n🎉 ALL DATA SYNCED TO NEON SUCCESSFULLY!")

    except Exception as e:
        print(f"\n❌ Migration Error: {e}")
        if 'neon_conn' in locals():
            neon_conn.rollback()
    finally:
        if 'sqlite_conn' in locals(): sqlite_conn.close()
        if 'neon_conn' in locals(): neon_conn.close()

if __name__ == "__main__":
    migrate_data()
