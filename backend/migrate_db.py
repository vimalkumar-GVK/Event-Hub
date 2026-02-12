import sqlite3
import os

db_path = "test.db"

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add is_active column if not exists
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
            print("Added 'is_active' column.")
        except sqlite3.OperationalError:
            print("'is_active' column already exists.")

        # Add last_login column if not exists
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login DATE")
            print("Added 'last_login' column.")
        except sqlite3.OperationalError:
            print("'last_login' column already exists.")
        # Add theme column if not exists
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'")
            print("Added 'theme' column.")
        except sqlite3.OperationalError:
            print("'theme' column already exists.")

        conn.commit()
        conn.close()
        print("Database migration successful!")
    except Exception as e:
        print(f"Error migrating database: {e}")
else:
    print(f"Database {db_path} does not exist yet. It will be created by the app.")
