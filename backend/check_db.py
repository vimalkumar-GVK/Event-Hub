from database.connection import get_db
db = get_db()
print(db.users.find_one({"email": "admin@rathinamcampus.edu"}))
