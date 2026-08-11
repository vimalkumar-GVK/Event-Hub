from database.connection import get_db
from utils.jwt import hash_password

db = get_db()
user = db.users.find_one({"email": "admin@rathinamcampus.edu"})
if user:
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "name": "Usha",
            "student_id": "RGU48",
            "hashed_password": hash_password("RGU48")
        }}
    )
    print("User updated successfully!")
else:
    print("User not found.")
