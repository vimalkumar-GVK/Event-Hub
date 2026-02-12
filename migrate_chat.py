import sqlite3
import os

db_path = 'backend/test.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # SQLite doesn't support ALTER COLUMN easily. 
    # But it also doesn't strictly enforce Date vs DateTime types in the storage.
    # We can try to just use it, OR we can rename and recreate if we want clean schema.
    
    # Let's try to just update the schema by recreating the tables if they have 'DATE'
    # Actually, for simplicity and safety, I'll just leave the storage as is, 
    # as SQLite will allow inserting full DATETIME strings into a DATE column.
    # The real issue is the default values and how SQLAlchemy handles it.
    
    # Let's just do a clean migration:
    try:
        # Check messages
        cursor.execute("PRAGMA table_info(messages)")
        cols = cursor.fetchall()
        for col in cols:
            if col[1] == 'timestamp' and col[2] == 'DATE':
                print("Updating messages table timestamp to DATETIME...")
                # SQLite doesn't allow ALTER COLUMN. We need to:
                # 1. Rename table
                # 2. Create new table
                # 3. Copy data
                # 4. Drop old table
                cursor.execute("ALTER TABLE messages RENAME TO messages_old")
                cursor.execute("""
                    CREATE TABLE messages (
                        id INTEGER NOT NULL, 
                        sender_id INTEGER NOT NULL, 
                        receiver_id INTEGER NOT NULL, 
                        text TEXT, 
                        attachment JSON, 
                        timestamp DATETIME, 
                        PRIMARY KEY (id), 
                        FOREIGN KEY(sender_id) REFERENCES users (id), 
                        FOREIGN KEY(receiver_id) REFERENCES users (id)
                    )
                """)
                cursor.execute("INSERT INTO messages (id, sender_id, receiver_id, text, attachment, timestamp) SELECT id, sender_id, receiver_id, text, attachment, timestamp FROM messages_old")
                cursor.execute("DROP TABLE messages_old")
        
        # Check notifications
        cursor.execute("PRAGMA table_info(notifications)")
        cols = cursor.fetchall()
        for col in cols:
            if col[1] == 'timestamp' and col[2] == 'DATE':
                print("Updating notifications table timestamp to DATETIME...")
                cursor.execute("ALTER TABLE notifications RENAME TO notifications_old")
                cursor.execute("""
                    CREATE TABLE notifications (
                        id INTEGER NOT NULL, 
                        text TEXT NOT NULL, 
                        type VARCHAR, 
                        role VARCHAR, 
                        sender_name VARCHAR, 
                        is_read BOOLEAN, 
                        timestamp DATETIME, 
                        PRIMARY KEY (id)
                    )
                """)
                cursor.execute("INSERT INTO notifications (id, text, type, role, sender_name, is_read, timestamp) SELECT id, text, type, role, sender_name, is_read, timestamp FROM notifications_old")
                cursor.execute("DROP TABLE notifications_old")
        
        conn.commit()
        print("Migration successful")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()
else:
    print("Database not found")
