import requests

resp = requests.post("http://localhost:8000/api/login", json={"username": "super@smartcampus.edu", "password": "password123"})
print(resp.status_code)
print(resp.json())
