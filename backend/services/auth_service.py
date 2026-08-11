import datetime
from bson import ObjectId
from database.connection import get_db
from utils.jwt import verify_password, hash_password, create_access_token

def populate_institution(user_dict, db):
    if not user_dict:
        return user_dict
    inst_id = user_dict.get("institution_id")
    if inst_id:
        try:
            inst = db.institutions.find_one({"_id": ObjectId(inst_id)})
            if inst:
                inst["id"] = str(inst.pop("_id"))
                user_dict["institution"] = inst
            else:
                user_dict["institution"] = None
        except Exception:
            user_dict["institution"] = None
    else:
        user_dict["institution"] = None
    return user_dict

def authenticate_user(username, password):
    db = get_db()
    user = db.users.find_one({"email": username})
    if not user:
        return {"detail": "Invalid credentials"}, 400

    stored_password = user.get("hashed_password", "")
    
    # Lazy Hashing Check
    if not stored_password.startswith("$2b$") and not stored_password.startswith("$2a$"):
        # Legacy plain text comparison
        if password == stored_password:
            # Upgrade password transparently
            hashed = hash_password(password)
            db.users.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": hashed}})
            stored_password = hashed
        else:
            return {"detail": "Invalid credentials"}, 400
            
    if not verify_password(password, stored_password):
        return {"detail": "Invalid credentials"}, 400

    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.datetime.utcnow().isoformat()}})
    
    access_token = create_access_token(data={"sub": user["email"]})
    user["id"] = str(user.pop("_id"))
    user.pop("hashed_password", None)
    user.pop("reset_otp", None)
    user.pop("reset_otp_expiry", None)

    for k, v in list(user.items()):
        if isinstance(v, datetime.datetime):
            user[k] = v.isoformat()

    user.setdefault("is_active", True)
    user.setdefault("is_verified", user.get("role") != "student")
    user.setdefault("theme", "light")

    populate_institution(user, db)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }, 200

def register_new_user(user_data):
    db = get_db()
    if db.users.find_one({"email": user_data.get("email")}):
        return {"detail": "User already exists"}, 400
    if not user_data.get("institution_id"):
        return {"detail": "Institution is required"}, 400

    password = user_data.pop("password")
    user_data["hashed_password"] = hash_password(password)
    user_data["role"] = "student"
    user_data["is_verified"] = False
    user_data["created_at"] = datetime.datetime.utcnow()

    result = db.users.insert_one(user_data)
    user_data["id"] = str(result.inserted_id)
    user_data.pop("_id", None)
    user_data.pop("hashed_password", None)
    
    for k, v in list(user_data.items()):
        if isinstance(v, datetime.datetime):
            user_data[k] = v.isoformat()
            
    populate_institution(user_data, db)

    # TODO: Add websocket notification logic here
    
    return user_data, 201

def get_user_profile(user):
    db = get_db()
    user["id"] = str(user.pop("_id"))
    user.pop("hashed_password", None)
    user.pop("reset_otp", None)
    user.pop("reset_otp_expiry", None)
    
    for k, v in list(user.items()):
        if isinstance(v, datetime.datetime):
            user[k] = v.isoformat()
            
    populate_institution(user, db)
    return user, 200

import random
from twilio.rest import Client
from config.config import Config

def send_sms(phone_number, otp):
    message_body = f"Your Smart Campus Events password reset OTP is: {otp}. It expires in 10 minutes."
    print(f"\n[{datetime.datetime.utcnow().isoformat()}] SMS to {phone_number}: {message_body}\n")
    if getattr(Config, "TWILIO_ACCOUNT_SID", None) and getattr(Config, "TWILIO_AUTH_TOKEN", None):
        try:
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message_body,
                from_=getattr(Config, "TWILIO_PHONE_NUMBER", "+1234567890"),
                to=phone_number
            )
        except Exception as e:
            print(f"Twilio error: {e}")

def srv_forgot_password(phone_number):
    if not phone_number:
        return {"detail": "Phone number is required"}, 400
    
    db = get_db()
    user = db.users.find_one({"phone_number": phone_number})
    if not user:
        return {"detail": "No account found with this phone number"}, 404
        
    otp = str(random.randint(100000, 999999))
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expiry}}
    )
    
    send_sms(phone_number, otp)
    return {"message": "OTP sent successfully"}, 200

def srv_verify_otp(phone_number, otp):
    if not phone_number or not otp:
        return {"detail": "Phone number and OTP are required"}, 400
        
    db = get_db()
    user = db.users.find_one({"phone_number": phone_number, "reset_otp": otp})
    
    if not user:
        return {"detail": "Invalid OTP or phone number"}, 400
        
    if datetime.datetime.utcnow() > user.get("reset_otp_expiry", datetime.datetime.min):
        return {"detail": "OTP has expired"}, 400
        
    return {"message": "OTP verified successfully", "token": otp}, 200

def srv_reset_password(phone_number, otp, new_password):
    if not phone_number or not otp or not new_password:
        return {"detail": "Missing required fields"}, 400
        
    db = get_db()
    user = db.users.find_one({"phone_number": phone_number, "reset_otp": otp})
    
    if not user or datetime.datetime.utcnow() > user.get("reset_otp_expiry", datetime.datetime.min):
        return {"detail": "Invalid or expired OTP"}, 400
        
    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": hash_password(new_password)},
            "$unset": {"reset_otp": "", "reset_otp_expiry": ""}
        }
    )
    return {"message": "Password reset successfully"}, 200
