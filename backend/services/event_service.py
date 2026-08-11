import datetime
from bson import ObjectId
from jose import jwt
from database.connection import get_db
from config.config import Config

def _populate_event_creator(db, e):
    if "created_by" in e and e["created_by"]:
        try:
            creator = db.users.find_one({"_id": ObjectId(e["created_by"])})
            if creator:
                e["created_by_name"] = creator.get("name") or creator.get("email")
        except Exception:
            pass
    return e

def srv_get_events(auth_header, inst_id, city):
    db = get_db()
    user = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
            user = db.users.find_one({"email": payload.get("sub")})
        except Exception:
            pass

    query = {}
    if inst_id and inst_id != "undefined":
        query["$or"] = [
            {"institution_id": inst_id},
            {"institution_id": None},
            {"institution_id": {"$exists": False}}
        ]
        
    if city:
        insts = list(db.institutions.find({"city": city}))
        inst_ids = [str(i["_id"]) for i in insts]
        query["institution_id"] = {"$in": inst_ids}
        
    if not user or user.get("role") not in ("admin", "super_admin"):
        query["status"] = "published"
        query["approval_status"] = "approved"
        
    events = list(db.events.find(query).sort("created_at", -1))
    for e in events:
        e["id"] = str(e.pop("_id"))
        _populate_event_creator(db, e)
    return events, 200

def srv_get_my_events(current_user):
    db = get_db()
    user_id = str(current_user["_id"])
    query = {"created_by": user_id}
    events = list(db.events.find(query).sort("created_at", -1))
    for e in events:
        e["id"] = str(e.pop("_id"))
        _populate_event_creator(db, e)
    return events, 200

def srv_get_event_by_id(event_id):
    db = get_db()
    try:
        event = db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        return {"detail": "Invalid Event ID"}, 400
    if not event:
        return {"detail": "Event not found"}, 404
    event["id"] = str(event.pop("_id"))
    _populate_event_creator(db, event)
    return event, 200

def srv_get_public_events():
    db = get_db()
    events = list(db.events.find({"status": "published"}).sort("created_at", -1).limit(10))
    for e in events:
        e["id"] = str(e.pop("_id"))
        _populate_event_creator(db, e)
    return events, 200

def srv_create_event(current_user, event_dict):
    db = get_db()
    
    event_dict["admin_id"] = str(current_user["_id"])
    event_dict["created_by"] = str(current_user["_id"])
    event_dict["created_by_role"] = current_user.get("role")
    
    if current_user.get("role") != "super_admin":
        event_dict["institution_id"] = current_user.get("institution_id")
        
    if event_dict.get("institution_id"):
        try:
            inst = db.institutions.find_one({"_id": ObjectId(event_dict["institution_id"])})
            if inst:
                event_dict["created_by_institution"] = inst.get("name")
        except Exception:
            pass
            
    if current_user.get("role") in ("admin", "super_admin"):
        event_dict["approval_status"] = "approved"
        event_dict["status"] = "published"
        event_dict["approved_by"] = str(current_user["_id"])
        event_dict["approved_at"] = datetime.datetime.utcnow()
    else:
        event_dict["approval_status"] = "pending_approval"
        event_dict["status"] = "draft"
        
    event_dict["created_at"] = datetime.datetime.utcnow()
    
    result = db.events.insert_one(event_dict)
    event_dict["id"] = str(result.inserted_id)
    event_dict.pop("_id", None)
    
    from services.notification_service import srv_create_notification
    if current_user.get("role") in ("admin", "super_admin"):
        srv_create_notification(f"New event '{event_dict.get('title')}' is now published!", event_dict["id"], "Admin", "info", target_role="student")
    else:
        srv_create_notification(f"Event '{event_dict.get('title')}' is pending approval.", event_dict["id"], current_user.get("name"), "info", target_role="admin", target_institution=current_user.get("institution_id"))
        
    return event_dict, 201

def srv_update_event(event_id, current_user, event_dict):
    db = get_db()
    
    try:
        db_event = db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not db_event:
        return {"detail": "Event not found"}, 404
        
    # Enforce 2-hour edit limit
    created_at = db_event.get("created_at")
    if created_at and (datetime.datetime.utcnow() - created_at).total_seconds() > 7200:
        return {"detail": "Event can no longer be edited (2-hour time limit exceeded)."}, 403
        
    if current_user.get("role") == "sub_admin" and db_event.get("created_by") != str(current_user["_id"]):
        return {"detail": "You can only edit events you created"}, 403
        
    if current_user.get("role") in ("admin", "super_admin"):
        db.events.update_one({"_id": ObjectId(event_id)}, {"$set": event_dict})
        
        from services.notification_service import srv_create_notification
        srv_create_notification(f"Event '{db_event.get('title')}' has been updated.", event_id, "Admin", "info", target_role="student")
    else:
        db.events.update_one({"_id": ObjectId(event_id)}, {
            "$set": {
                "pending_changes": event_dict,
                "approval_status": "pending_approval"
            }
        })
        from services.notification_service import srv_create_notification
        srv_create_notification(f"Sub-Admin updated event '{db_event.get('title')}'. Pending approval.", event_id, current_user.get("name"), "info", target_role="admin", target_institution=current_user.get("institution_id"))
        
    updated = db.events.find_one({"_id": ObjectId(event_id)})
    updated["id"] = str(updated.pop("_id"))
    return updated, 200

def srv_delete_event(event_id, current_user):
    db = get_db()
    try:
        db_event = db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not db_event:
        return {"detail": "Event not found"}, 404
        
    # Enforce 2-hour delete limit for non-super admins
    created_at = db_event.get("created_at")
    if current_user.get("role") != "super_admin" and created_at and (datetime.datetime.utcnow() - created_at).total_seconds() > 7200:
        return {"detail": "Event can no longer be deleted (2-hour time limit exceeded)."}, 403
        
    if current_user.get("role") == "sub_admin" and db_event.get("created_by") != str(current_user["_id"]):
        return {"detail": "Not authorized to delete this event"}, 403
        
    if current_user.get("role") == "admin" and db_event.get("institution_id") != current_user.get("institution_id"):
        return {"detail": "Cannot delete events from other institutions"}, 403
        
    user_role = current_user.get("role")
    inst_id = db_event.get("institution_id")
    
    if user_role in ("sub_admin", "super_admin"):
        if not inst_id and user_role == "super_admin":
            db.events.delete_one({"_id": ObjectId(event_id)})
            return {"message": "Global event deleted successfully by Super Admin."}, 200

        db.events.update_one({"_id": ObjectId(event_id)}, {
            "$set": {
                "deletion_status": "pending_approval",
                "deletion_requested_by": str(current_user["_id"])
            }
        })
        
        from services.notification_service import srv_create_notification
        title = db_event.get("title", "Unknown Event")
        deleter_name = "Super Admin" if user_role == "super_admin" else current_user.get("name", "Sub Admin")
        msg = f"Deletion Request: {deleter_name} requested to delete event '{title}'."
        if inst_id:
            srv_create_notification(msg, event_id, "System", "warning", target_role="admin", target_institution=inst_id)
            
        return {"message": "Deletion approval requested from institution admin."}, 200
        
    db.events.delete_one({"_id": ObjectId(event_id)})
    return {"message": "Event deleted successfully"}, 200

def srv_get_pending_events(current_user):
    db = get_db()
    if current_user.get("role") not in ("admin", "super_admin"):
        return {"detail": "Not authorized"}, 403
    
    query = {
        "$or": [
            {"approval_status": "pending_approval"},
            {"deletion_status": "pending_approval"}
        ]
    }
    if current_user.get("role") == "admin":
        query["institution_id"] = current_user.get("institution_id")
        
    events = list(db.events.find(query).sort("created_at", -1))
    for e in events:
        e["id"] = str(e.pop("_id"))
    return events, 200

def srv_approve_event(event_id, current_user):
    db = get_db()
    if current_user.get("role") not in ("admin", "super_admin"):
        return {"detail": "Not authorized"}, 403
        
    try:
        db_event = db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not db_event:
        return {"detail": "Event not found"}, 404
        
    if current_user.get("role") == "admin" and db_event.get("institution_id") != current_user.get("institution_id"):
        return {"detail": "Cannot approve events from other institutions"}, 403
        
    update_data = {
        "approval_status": "approved",
        "status": "published",
        "approved_by": str(current_user["_id"]),
        "approved_at": datetime.datetime.utcnow()
    }
    
    if "pending_changes" in db_event:
        update_data.update(db_event["pending_changes"])
        db.events.update_one({"_id": ObjectId(event_id)}, {"$unset": {"pending_changes": ""}})
        
    db.events.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    
    from services.notification_service import srv_create_notification
    srv_create_notification(f"Your event '{db_event.get('title')}' has been approved!", event_id, current_user.get("name"), "success", target_user_id=db_event.get("created_by"))
    srv_create_notification(f"New event '{db_event.get('title')}' is now published!", event_id, "Admin", "info", target_role="student")
    
    return {"message": "Event approved successfully"}, 200

def srv_mark_student_attendance(event_id, current_user):
    db = get_db()
    
    try:
        event = db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"detail": "Event not found"}, 404
    except Exception:
        return {"detail": "Invalid Event ID"}, 400

    user_id = str(current_user["_id"])
    
    # Check registration
    reg = db.registrations.find_one({"user_id": user_id, "event_id": event_id})
    if not reg:
        return {"detail": "You are not registered for this event"}, 403
        
    if reg.get("status") != "approved":
        return {"detail": "Your registration is not approved yet"}, 403
        
    if reg.get("attendance") == "Present":
        return {"message": "Attendance already marked as Present"}, 200
        
    # Mark present
    db.registrations.update_one({"_id": reg["_id"]}, {"$set": {"attendance": "Present"}})
    
    return {"message": "Attendance marked successfully!"}, 200

def srv_approve_event_deletion(event_id, current_user):
    db = get_db()
    if current_user.get("role") not in ("admin", "super_admin"):
        return {"detail": "Not authorized"}, 403
        
    try:
        db_event = db.events.find_one({"_id": ObjectId(event_id)})
    except Exception:
        return {"detail": "Invalid ID"}, 400
        
    if not db_event:
        return {"detail": "Event not found"}, 404
        
    if current_user.get("role") == "admin" and db_event.get("institution_id") != current_user.get("institution_id"):
        return {"detail": "Cannot approve deletions for events from other institutions"}, 403
        
    if db_event.get("deletion_status") != "pending_approval":
        return {"detail": "Event is not pending deletion"}, 400
        
    db.events.delete_one({"_id": ObjectId(event_id)})
    
    from services.notification_service import srv_create_notification
    requester = db_event.get("deletion_requested_by")
    if requester:
        srv_create_notification(f"Your deletion request for '{db_event.get('title')}' was approved.", event_id, current_user.get("name"), "success", target_user_id=requester)
        
    return {"message": "Event deletion approved and event removed."}, 200
