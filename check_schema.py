import sqlite3
import os

db_path = os.path.join('backend', 'test.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    tables = ['users', 'events', 'sub_events', 'registrations', 'messages', 'notifications']
    for table in tables:
        print(f"--- Schema for {table} ---")
        cursor.execute(f"PRAGMA table_info({table})")
        cols = cursor.fetchall()
        for col in cols:
            print(col)
        print()
    
    conn.close()
else:
    print("Database not found")
