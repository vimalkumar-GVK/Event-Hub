
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.db')

def migrate():
    print(f"Migrating database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Disable Foreign Keys
        cursor.execute("PRAGMA foreign_keys=OFF")

        # 2. Start Transaction
        cursor.execute("BEGIN TRANSACTION")

        # 3. Rename existing table
        cursor.execute("ALTER TABLE events RENAME TO events_old")

        # 4. Create new table with nullable 'date' and 'time'
        # Note: We include all columns, including new ones we added recently
        create_table_sql = """
        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR NOT NULL,
            description TEXT,
            date DATE, 
            time TIME,
            venue VARCHAR,
            capacity INTEGER,
            type VARCHAR,
            image TEXT,
            status VARCHAR DEFAULT 'published',
            admin_id INTEGER,
            created_at DATE,
            rules_pdf_url TEXT,
            payment_qr_url TEXT,
            FOREIGN KEY(admin_id) REFERENCES users(id)
        );
        """
        cursor.execute(create_table_sql)

        # 5. Copy data
        # We need to list columns explicitly to allow for flexible migration
        # Get columns from old table
        cursor.execute("PRAGMA table_info(events_old)")
        columns = [info[1] for info in cursor.fetchall()]
        columns_str = ", ".join(columns)
        
        # We need to handle potential null dates in legacy data if any (though unlikely as it was Not Null)
        copy_sql = f"INSERT INTO events ({columns_str}) SELECT {columns_str} FROM events_old"
        cursor.execute(copy_sql)

        # 6. Drop old table
        cursor.execute("DROP TABLE events_old")

        # 7. Index
        cursor.execute("CREATE INDEX ix_events_id ON events (id)")
        # Add other indexes if needed, usually sqlalchemy handles them but for sqlite we might need to recreate manual ones if any.
        # But for this simple app, ix_events_id is the main one created by `index=True` in models.py

        conn.commit()
        print("✅ Migration successful: 'date' and 'time' columns are now NULLABLE.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
    finally:
        cursor.execute("PRAGMA foreign_keys=ON")
        conn.close()

if __name__ == "__main__":
    migrate()
