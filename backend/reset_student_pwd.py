from database.connection import get_db
from utils.jwt import hash_password

db = get_db()
db.users.update_one(
    {'email': 'vimalkumarg@rathinamstudent.in'},
    {'$set': {'hashed_password': hash_password('password123')}}
)
print("Password updated!")
