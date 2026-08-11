import datetime
from database.connection import get_db
import utils.websocket_manager as websocket_manager

def srv_get_stats(current_user):
    db = get_db()
    query = {}
    if current_user.get("role") != "super_admin":
        query["institution_id"] = current_user.get("institution_id")
        
    total_users = db.users.count_documents(query)
    total_students = db.users.count_documents({**query, "role": "student"})
    total_admins = db.users.count_documents({**query, "role": "admin"})
    total_sub_admins = db.users.count_documents({**query, "role": "sub_admin"})
    
    total_events = db.events.count_documents(query)
    
    reg_query = {}
    if current_user.get("role") != "super_admin":
        events = list(db.events.find(query, {"_id": 1}))
        event_ids = [str(e["_id"]) for e in events]
        reg_query["event_id"] = {"$in": event_ids}
        
    total_registrations = db.registrations.count_documents(reg_query)
    total_institutions = db.institutions.count_documents({})
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_admins": total_admins,
        "total_sub_admins": total_sub_admins,
        "total_active_admins": total_admins,
        "total_events": total_events,
        "total_registrations": total_registrations,
        "total_institutions": total_institutions,
        "recent_activity": []
    }, 200

def srv_get_system_stats():
    db = get_db()
    query = {}
    
    total_users = db.users.count_documents(query)
    total_students = db.users.count_documents({**query, "role": "student"})
    total_admins = db.users.count_documents({**query, "role": "admin"})
    total_sub_admins = db.users.count_documents({**query, "role": "sub_admin"})
    total_events = db.events.count_documents(query)
    total_registrations = db.registrations.count_documents({})
    total_institutions = db.institutions.count_documents({})
    
    recent = []
    try:
        announcements = list(db.announcements.find().sort("timestamp", -1).limit(5))
        for a in announcements:
            a["id"] = str(a.pop("_id"))
            if isinstance(a.get("timestamp"), datetime.datetime):
                a["timestamp"] = a["timestamp"].isoformat()
            recent.append(a)
    except Exception:
        pass
        
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_admins": total_admins,
        "total_sub_admins": total_sub_admins,
        "total_active_admins": total_admins,
        "total_events": total_events,
        "total_registrations": total_registrations,
        "total_institutions": total_institutions,
        "recent_activity": recent
    }, 200

def srv_post_system_announce(current_user, data):
    db = get_db()
    text = data.get("text")
    if not text:
        return {"detail": "Message text is required"}, 400
        
    announcement = {
        "text": text,
        "type": "announcement",
        "sender_name": current_user.get("name", "Super Admin"),
        "timestamp": datetime.datetime.utcnow()
    }
    try:
        db.announcements.insert_one(announcement)
    except Exception:
        pass
        
    try:
        websocket_manager.manager.broadcast({
            "type": "announcement",
            "message": text
        })
    except Exception:
        pass
    
    return {"message": "Announcement broadcasted successfully"}, 200
