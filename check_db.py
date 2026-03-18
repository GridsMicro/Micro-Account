import sqlite3
import os

db_path = 'database.db'
if not os.path.exists(db_path):
    print(f"File {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:", [t[0] for t in tables])
    conn.close()
