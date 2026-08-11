import datetime
from bson import ObjectId
from database.connection import get_db
from utils.jwt import hash_password

def srv_create_institution(data):
    db = get_db()
    if db.institutions.find_one({"code": data.get("code")}):
        return {"detail": "Institution code already exists"}, 400

    admin_password = data.pop("admin_password", None)
    admin_phone = data.pop("admin_phone_number", "")
    admin_name = data.pop("admin_name", data.get("name", "Institution Admin"))
    admin_user_id = data.pop("admin_user_id", "")
    data["is_active"] = data.get("is_active", True)
    data["created_at"] = datetime.datetime.utcnow()

    result = db.institutions.insert_one(data)
    inst_id = str(result.inserted_id)
    data["id"] = inst_id
    data.pop("_id", None)

    created_admin = None
    if admin_password and data.get("email"):
        existing = db.users.find_one({"email": data["email"]})
        if not existing:
            admin_user = {
                "name": admin_name,
                "student_id": admin_user_id,
                "email": data["email"],
                "hashed_password": hash_password(admin_password),
                "role": "admin",
                "institution_id": inst_id,
                "phone_number": admin_phone,
                "designation": "Head Coordinator",
                "department": "Administration",
                "is_verified": True,
                "is_active": True,
                "theme": "light",
                "created_at": datetime.datetime.utcnow().isoformat(),
            }
            admin_result = db.users.insert_one(admin_user)
            created_admin = {
                "id": str(admin_result.inserted_id),
                "email": data["email"],
                "role": "admin",
            }

    response = dict(data)
    if created_admin:
        response["admin_created"] = created_admin

    return response, 201

def srv_get_institutions():
    db = get_db()
    institutions = list(db.institutions.find({"is_active": True}))
    for inst in institutions:
        inst["id"] = str(inst.pop("_id"))
    return institutions, 200

def srv_get_institution(inst_id):
    db = get_db()
    try:
        inst = db.institutions.find_one({"_id": ObjectId(inst_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
    if not inst:
        return {"detail": "Institution not found"}, 404
        
    inst["id"] = str(inst.pop("_id"))
    return inst, 200

def srv_update_institution(inst_id, data):
    db = get_db()
    try:
        admin_name = data.pop("admin_name", None)
        admin_user_id = data.pop("admin_user_id", None)
        admin_password = data.pop("admin_password", None)
        
        db.institutions.update_one({"_id": ObjectId(inst_id)}, {"$set": data})
        
        admin_update = {}
        if admin_name: admin_update["name"] = admin_name
        if admin_user_id: admin_update["student_id"] = admin_user_id
        if admin_password: admin_update["hashed_password"] = hash_password(admin_password)
        if admin_update:
            db.users.update_one({"institution_id": inst_id, "role": "admin"}, {"$set": admin_update})

        inst = db.institutions.find_one({"_id": ObjectId(inst_id)})
        inst["id"] = str(inst.pop("_id"))
        return inst, 200
    except Exception as e:
        return {"detail": str(e)}, 400

def srv_delete_institution(inst_id):
    db = get_db()
    try:
        db.institutions.delete_one({"_id": ObjectId(inst_id)})
        return {"message": "Institution deleted successfully"}, 200
    except Exception:
        return {"detail": "Error deleting"}, 400
