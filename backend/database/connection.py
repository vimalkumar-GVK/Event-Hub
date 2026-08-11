import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/smartcampus")

try:
    # Try connecting with a 2-second timeout
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Force a connection test
    client.admin.command('ping')
    try:
        db = client.get_default_database()
    except Exception:
        db = client["smartcampus"]
    print("Successfully connected to real MongoDB instance.")
except Exception as e:
    print(f"Warning: Real MongoDB connection failed ({e}).")
    print("Falling back to in-memory mongomock database for instant zero-config startup!")
    try:
        import mongomock
        client = mongomock.MongoClient()
        db = client["smartcampus"]
    except ImportError:
        print("Error: mongomock is not installed. Database operations will fail.")
        db = None

def get_db():
    return db
