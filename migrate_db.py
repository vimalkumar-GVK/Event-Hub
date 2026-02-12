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
    
    if 'attendance_code' not in columns:
        print("Adding 'attendance_code' to 'events' table...")
        cursor.execute("ALTER TABLE events ADD COLUMN attendance_code TEXT")
        conn.commit()
        print("Column added.")
    else:
        print("'attendance_code' already exists.")

    # Check registrations table
    cursor.execute("PRAGMA table_info(registrations)")
    reg_columns = [col[1] for col in cursor.fetchall()]
    print("Current columns in 'registrations':", reg_columns)
    
    for col_name in ['attendance', 'certificate_url', 'certificate_type']:
        if col_name not in reg_columns:
            print(f"Adding '{col_name}' to 'registrations' table...")
            cursor.execute(f"ALTER TABLE registrations ADD COLUMN {col_name} TEXT")
            conn.commit()
    
    conn.close()
else:
    print("Database not found")
