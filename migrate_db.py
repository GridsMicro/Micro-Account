import sqlite3
import os

DB_FILE = "database.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(company)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    # Columns that should exist in Company table
    required_cols = {
        'vat_rate': 'FLOAT DEFAULT 7.0',
        'withholding_tax_rate': 'FLOAT DEFAULT 3.0',
        'corporate_tax_rate': 'FLOAT DEFAULT 20.0',
        'tax_exemption_years': 'INTEGER DEFAULT 0',
        'tax_reduction_years': 'INTEGER DEFAULT 0',
        'tax_exemption_start_year': 'INTEGER',
        'currency': 'TEXT DEFAULT "฿"',
        'inv_prefix': 'TEXT DEFAULT "INV"',
        'rec_prefix': 'TEXT DEFAULT "REC"',
        'pay_prefix': 'TEXT DEFAULT "PAY"',
        'exp_prefix': 'TEXT DEFAULT "EXP"',
        'phone': 'TEXT',
        'email': 'TEXT'
    }

    for col, type_ in required_cols.items():
        if col not in existing_cols:
            print(f"Adding column {col} to company table...")
            try:
                cursor.execute(f"ALTER TABLE company ADD COLUMN {col} {type_}")
            except Exception as e:
                print(f"Error adding {col}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
