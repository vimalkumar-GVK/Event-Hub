import sqlite3
import os

db_path = "backend/test.db"
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, email, role FROM users")
        rows = cursor.fetchall()
        print("Users in DB:")
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    conn.close()
