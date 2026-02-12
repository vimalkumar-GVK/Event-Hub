import sqlite3
import os

db_path = os.path.join('backend', 'test.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check events table
    cursor.execute("PRAGMA table_info(events)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Current columns in 'events':", columns)
    
    if 'is_story' not in columns:
        print("Adding 'is_story' to 'events' table...")
        cursor.execute("ALTER TABLE events ADD COLUMN is_story BOOLEAN DEFAULT 0")
        conn.commit()
        print("Column added.")
    else:
        print("'is_story' already exists.")

    conn.close()
else:
    print("Database not found")
