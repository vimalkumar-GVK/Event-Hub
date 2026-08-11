from database.connection import get_db
from utils.jwt import hash_password

db = get_db()
new_hash = hash_password("password123")
db.users.update_many({}, {"$set": {"hashed_password": new_hash}})
print("All passwords updated to 'password123'")
