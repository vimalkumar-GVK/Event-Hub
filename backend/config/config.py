import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-goes-here-for-development")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/smartcampus")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8-hour sessions
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://192.168.20.1:5174,http://frontend,http://localhost:3000").split(",")
    ROLE_HIERARCHY = ["student", "sub_admin", "admin", "super_admin"]
