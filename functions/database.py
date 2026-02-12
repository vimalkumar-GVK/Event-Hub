from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Use DATABASE_URL from .env or default to local SQLite for easy testing
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

import shutil

# Determine default database path
# In generic Lambda/serverless environments, the code directory is read-only.
# We use /tmp which is writable (but ephemeral) for SQLite if no external DB is provided.
if os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("NETLIFY"):
    default_db_path = "/tmp/test.db"
    source_db = os.path.join(BASE_DIR, 'test.db')
    
    # If the database exists in the deployment package but not in /tmp, copy it.
    # This allows deploying a pre-seeded database (e.g. with admin users).
    if os.path.exists(source_db) and not os.path.exists(default_db_path):
        try:
            shutil.copy2(source_db, default_db_path)
            print(f"Copied pre-seeded database from {source_db} to {default_db_path}")
        except Exception as e:
            print(f"Failed to copy database: {e}")
else:
    default_db_path = os.path.join(BASE_DIR, 'test.db')

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
