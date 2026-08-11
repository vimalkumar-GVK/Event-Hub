from functools import wraps
from flask import request, jsonify
from jose import jwt, JWTError
from config.config import Config
from database.connection import get_db

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"detail": "Not authenticated"}), 401
            
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
            email = payload.get("sub")
            if not email:
                return jsonify({"detail": "Invalid token"}), 401
                
            db = get_db()
            user = db.users.find_one({"email": email})
            if not user:
                return jsonify({"detail": "User not found"}), 401
                
            request.user = user
        except JWTError:
            return jsonify({"detail": "Invalid token"}), 401
            
        return func(*args, **kwargs)
    return wrapper

def require_role(allowed_roles):
    def decorator(func):
        @wraps(func)
        @require_auth
        def wrapper(*args, **kwargs):
            if request.user.get("role") not in allowed_roles:
                return jsonify({"detail": "Insufficient permissions"}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator

require_super_admin = require_role(["super_admin"])
require_admin = require_role(["super_admin", "admin"])
require_sub_admin = require_role(["super_admin", "admin", "sub_admin"])
require_student = require_role(["student"])
