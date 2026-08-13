from database.connection import get_db
from utils.jwt import hash_password
import datetime

EMAIL = "super@smartcampus.edu"
PASSWORD = "12345"

db = get_db()
if db is None:
    print("Database connection not available")
    exit(1)

existing = db.users.find_one({"email": EMAIL})
now = datetime.datetime.utcnow()
if existing:
    db.users.update_one({"_id": existing["_id"]}, {"$set": {
        "name": "Super Admin",
        "email": EMAIL,
        "hashed_password": hash_password(PASSWORD),
        "role": "super_admin",
        "institution_id": None,
        "phone_number": "",
        "is_active": True,
        "created_at": now
    }})
    print(f"Updated existing user: {EMAIL}")
else:
    user = {
        "name": "Super Admin",
        "email": EMAIL,
        "hashed_password": hash_password(PASSWORD),
        "role": "super_admin",
        "institution_id": None,
        "phone_number": "",
        "is_active": True,
        "created_at": now
    }
    db.users.insert_one(user)
    print(f"Created user: {EMAIL}")
