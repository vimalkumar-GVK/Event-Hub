from database.connection import get_db
from utils.jwt import hash_password
import requests

db = get_db()
db.users.update_one({'email': 'super@smartcampus.edu'}, {'$set': {'hashed_password': hash_password('super123')}})
print("Updated password.")

r = requests.post("http://localhost:8000/api/login", data={"username": "super@smartcampus.edu", "password": "super123"})
print(r.status_code)
print(r.text)
