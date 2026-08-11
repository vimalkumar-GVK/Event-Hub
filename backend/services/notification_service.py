import datetime
from bson import ObjectId
from database.connection import get_db
from utils.websocket_manager import manager

def srv_get_notifications(current_user):
    db = get_db()
    user_id = str(current_user["_id"])
    role = current_user.get("role")
    inst_id = current_user.get("institution_id")
    
    # Query: targeted to this user OR targeted to this role (and matching inst if applicable)
    query = {
        "$or": [
            {"target_user_id": user_id},
            {
                "target_role": role,
                "$or": [
                    {"target_institution": inst_id},
                    {"target_institution": {"$exists": False}}
                ]
            }
        ]
    }
    
    # Sort newest first, limit to 50
    notifs = list(db.notifications.find(query).sort("created_at", -1).limit(50))
    
    # Format for frontend
    result = []
    for n in notifs:
        n["id"] = str(n.pop("_id"))
        
        # Determine read status
        read_by = n.get("read_by", [])
        is_read = n.get("is_read", False)
        
        # If it's a broadcast, check if user is in read_by
        if "target_role" in n:
            n["is_read"] = user_id in read_by
        else:
            n["is_read"] = is_read
            
        n.pop("read_by", None) # Don't send large array to frontend
        result.append(n)
        
    return result, 200

def srv_mark_notification_read(notification_id, current_user):
    db = get_db()
    user_id = str(current_user["_id"])
    
    try:
        notif = db.notifications.find_one({"_id": ObjectId(notification_id)})
    except Exception:
        return {"detail": "Invalid notification ID"}, 400
        
    if not notif:
        return {"detail": "Notification not found"}, 404
        
    if "target_role" in notif:
        # It's a broadcast
        db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$addToSet": {"read_by": user_id}}
        )
    else:
        # It's targeted
        db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )
        
    return {"message": "Marked as read"}, 200

def srv_create_notification(text, event_id, sender_name, notif_type="info", target_user_id=None, target_role=None, target_institution=None):
    db = get_db()
    notif = {
        "text": text,
        "type": notif_type,
        "event_id": event_id,
        "sender_name": sender_name,
        "created_at": datetime.datetime.utcnow()
    }
    
    if target_user_id:
        notif["target_user_id"] = target_user_id
        notif["is_read"] = False
    
    if target_role:
        notif["target_role"] = target_role
        notif["read_by"] = []
        
    if target_institution:
        notif["target_institution"] = target_institution
        
    result = db.notifications.insert_one(notif)
    notif["id"] = str(result.inserted_id)
    notif.pop("_id", None)
    notif.pop("read_by", None)
    
    # Broadcast via websocket
    if target_user_id:
        manager.send_to(target_user_id, notif)
    elif target_role:
        manager.send_to_role(target_role, notif, db)

