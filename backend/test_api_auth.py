import requests

# 1. Calling /api/users WITHOUT token
resp1 = requests.get("http://localhost:8000/api/users")
print("GET /api/users without token:", resp1.status_code)
if resp1.status_code != 401:
    print(resp1.json())

# 2. Login via /api/login -> get token
resp2 = requests.post("http://localhost:8000/api/login", data={"username": "super@smartcampus.edu", "password": "super123"})
print("POST /api/login:", resp2.status_code)
if resp2.status_code == 200:
    token = resp2.json().get("access_token")
    
    # 3. Call /api/users WITH token -> should work
    resp3 = requests.get("http://localhost:8000/api/users", headers={"Authorization": f"Bearer {token}"})
    print("GET /api/users with token:", resp3.status_code)
    if resp3.status_code == 200:
        print("Users:", len(resp3.json()))
    else:
        print(resp3.json())
else:
    print(resp2.json())
