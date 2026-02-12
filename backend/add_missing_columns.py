"""
Add missing columns to events and sub_events tables
"""
from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Add missing columns to events table
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN rules_pdf_url TEXT"))
            print("✅ Added rules_pdf_url to events table")
        except Exception as e:
            print(f"⚠️ rules_pdf_url column: {e}")
        
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN payment_qr_url TEXT"))
            print("✅ Added payment_qr_url to events table")
        except Exception as e:
            print(f"⚠️ payment_qr_url column: {e}")
        
        # Add missing columns to sub_events table
        try:
            conn.execute(text("ALTER TABLE sub_events ADD COLUMN fee_type VARCHAR(50) DEFAULT 'per_person'"))
            print("✅ Added fee_type to sub_events table")
        except Exception as e:
            print(f"⚠️ fee_type column: {e}")
        
        try:
            conn.execute(text("ALTER TABLE sub_events ADD COLUMN team_size INTEGER DEFAULT 1"))
            print("✅ Added team_size to sub_events table")
        except Exception as e:
            print(f"⚠️ team_size column: {e}")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
