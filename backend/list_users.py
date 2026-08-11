from database.connection import get_db
db = get_db()
for u in db.users.find():
    print(f"{u['email']} - {u.get('role')} - {u.get('hashed_password')[:10]}")
