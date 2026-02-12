import sqlite3
import os

db_path = os.path.join('backend', 'test.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(events)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Columns in 'events':", columns)
    conn.close()
else:
    print("Database not found")
