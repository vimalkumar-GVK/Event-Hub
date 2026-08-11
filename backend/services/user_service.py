from bson import ObjectId
from database.connection import get_db
import utils.websocket_manager as websocket_manager # Legacy import
from utils.jwt import hash_password
import datetime

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

def srv_get_users(current_user, inst_id):
    db = get_db()
    query = {}
    
    if current_user.get("role") == "super_admin":
        if inst_id:
            query["institution_id"] = inst_id
    else:
        query["institution_id"] = current_user.get("institution_id")
        
    users = list(db.users.find(query))
    for u in users:
        u["id"] = str(u.pop("_id"))
        u.pop("hashed_password", None)
        populate_institution(u, db)
    return users, 200

def srv_get_user(user_id):
    db = get_db()
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return {"detail": "Invalid user ID"}, 400
        
    if not user:
        return {"detail": "User not found"}, 404
        
    user["id"] = str(user.pop("_id"))
    user.pop("hashed_password", None)
    populate_institution(user, db)
    return user, 200

def srv_delete_user(user_id, current_user):
    db = get_db()

    if str(current_user["_id"]) == user_id:
        return {"detail": "You cannot delete your own account."}, 400

    try:
        target = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return {"detail": "Invalid user ID"}, 400

    if not target:
        return {"detail": "User not found"}, 404

    if target.get("role") == "super_admin":
        return {"detail": "Super admin accounts cannot be deleted."}, 403

    if current_user.get("role") == "admin":
        if target.get("institution_id") != current_user.get("institution_id"):
            return {"detail": "Not authorized to delete users outside your institution."}, 403
        if target.get("role") == "admin":
            return {"detail": "Admins cannot delete other admins."}, 403

    if current_user.get("role") == "sub_admin":
        if target.get("institution_id") != current_user.get("institution_id"):
            return {"detail": "Not authorized to delete users outside your institution."}, 403
        if target.get("role") != "student":
            return {"detail": "Sub-admins can only delete student accounts."}, 403

    db.users.delete_one({"_id": ObjectId(user_id)})
    db.registrations.delete_many({"user_id": user_id})
    db.messages.delete_many({"sender_id": user_id})

    return {"message": f"User '{target.get('name')}' deleted successfully."}, 200

def srv_create_sub_admin(data, current_user):
    db = get_db()
    
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return {"detail": "Name, email, and password are required"}, 400
        
    if db.users.find_one({"email": email}):
        return {"detail": "User with this email already exists"}, 400
        
    new_user = {
        "name": name,
        "email": email,
        "hashed_password": hash_password(password),
        "role": "sub_admin",
        "institution_id": current_user.get("institution_id"),
        "phone_number": data.get("phone_number", ""),
        "student_id": data.get("student_id", ""),
        "department": data.get("department", ""),
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    db.users.insert_one(new_user)
    return {"message": "Sub-admin created successfully"}, 201

def srv_get_pending_students(current_user):
    db = get_db()
    query = {"role": "student", "is_verified": False}
    if current_user.get("role") != "super_admin":
        query["institution_id"] = current_user.get("institution_id")
        
    students = list(db.users.find(query))
    for s in students:
        s["id"] = str(s.pop("_id"))
        s.pop("hashed_password", None)
        populate_institution(s, db)
    return students, 200

def srv_verify_student(student_id, current_user):
    db = get_db()
    try:
        student = db.users.find_one({"_id": ObjectId(student_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not student:
        return {"detail": "Student not found"}, 404
        
    if current_user.get("role") != "super_admin" and student.get("institution_id") != current_user.get("institution_id"):
        return {"detail": "Not authorized for this college"}, 403

    db.users.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"is_verified": True, "verification_note": "Verified by " + current_user.get("name", "")}}
    )

    try:
        websocket_manager.manager.send_to(student_id, {
            "type": "account_verified",
            "message": "✅ Your account has been verified! You can now register for events."
        })
    except Exception:
        pass
    return {"message": "Student verified"}, 200

def srv_reject_student(student_id, current_user, reason):
    db = get_db()
    try:
        student = db.users.find_one({"_id": ObjectId(student_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not student:
        return {"detail": "Student not found"}, 404
        
    if current_user.get("role") != "super_admin" and student.get("institution_id") != current_user.get("institution_id"):
        return {"detail": "Not authorized for this college"}, 403

    db.users.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"is_verified": False, "verification_note": reason}}
    )

    try:
        websocket_manager.manager.send_to(student_id, {
            "type": "account_rejected",
            "message": f"❌ Verification rejected. Reason: {reason}"
        })
    except Exception:
        pass
    return {"message": "Verification rejected"}, 200

def srv_update_profile(current_user, data):
    db = get_db()
    user_id = ObjectId(current_user["_id"])
    
    update_data = {}
    
    if "name" in data and data["name"]:
        update_data["name"] = data["name"]
        
    if "student_id" in data and data["student_id"]:
        update_data["student_id"] = data["student_id"]
        
    if "phone_number" in data:
        update_data["phone_number"] = data["phone_number"]
        
    if "hide_phone" in data:
        update_data["hide_phone"] = bool(data["hide_phone"])
        
    if "department" in data and current_user.get("role") == "sub_admin":
        update_data["department"] = data["department"]
        
    if "profile_photo" in data:
        update_data["profile_photo"] = data["profile_photo"]
        
    if "password" in data and data["password"]:
        from utils.jwt import hash_password
        update_data["hashed_password"] = hash_password(data["password"])
        
    if update_data:
        db.users.update_one({"_id": user_id}, {"$set": update_data})
        
    # Fetch updated user
    updated_user = db.users.find_one({"_id": user_id})
    if updated_user:
        updated_user["id"] = str(updated_user.pop("_id"))
        updated_user.pop("hashed_password", None)
        populate_institution(updated_user, db)
        return updated_user, 200
    
    return {"detail": "User not found"}, 404

def srv_search_users(current_user, search_query):
    db = get_db()
    if not search_query:
        return [], 200
        
    query = {
        "name": {"$regex": search_query, "$options": "i"}
    }
    
    # If not super admin, restrict to same institution
    if current_user.get("role") != "super_admin":
        query["institution_id"] = current_user.get("institution_id")
        
    users = list(db.users.find(query, {"name": 1, "profile_photo": 1, "profile_pic": 1, "role": 1}).limit(20))
    for u in users:
        u["id"] = str(u.pop("_id"))
        
    return users, 200

