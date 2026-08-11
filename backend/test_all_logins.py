import requests

emails = ['super@smartcampus.edu', 'admin@rathinamcampus.edu', 'subadmin1@rathinamcampus.edu', 'student@rathinamcampus.edu']
for e in emails:
    r = requests.post('http://localhost:8000/api/login', json={'username': e, 'password': 'password123'})
    print(f'{e}: {r.status_code}')
