import datetime
from bson import ObjectId
from database.connection import get_db
import utils.websocket_manager as websocket_manager # Keep legacy import for now if needed, or update later

def srv_create_registration(current_user, reg):
    db = get_db()
    
    # User verification check is removed - verification happens during registration approval
        
    try:
        event = db.events.find_one({"_id": ObjectId(reg.get("event_id"))})
    except Exception:
        return {"detail": "Invalid Event ID"}, 400
        
    if not event:
        return {"detail": "Event not found"}, 404
        
    existing_query = {
        "user_id": str(current_user["_id"]),
        "event_id": reg.get("event_id")
    }
    if "sub_event_id" in reg and reg["sub_event_id"]:
        existing_query["sub_event_id"] = reg["sub_event_id"]

    existing = db.registrations.find_one(existing_query)
    
    if existing:
        return {"detail": "Already registered for this event"}, 400
        
    reg["user_id"] = str(current_user["_id"])
    reg["timestamp"] = datetime.datetime.utcnow()

    student_inst_id = current_user.get("institution_id")
    event_inst_id = str(event.get("institution_id")) if event.get("institution_id") else None

    # Determine initial status based on two-step verification workflow
    if student_inst_id and event_inst_id and str(student_inst_id) != str(event_inst_id):
        # Different colleges -> Requires Home College Sub-admin approval first
        reg["status"] = "pending_home"
    else:
        # Same college -> Goes straight to Organizer approval
        reg["status"] = "pending_organizer"
    
    result = db.registrations.insert_one(reg)
    reg["id"] = str(result.inserted_id)
    reg.pop("_id", None)
    return reg, 201

def srv_get_my_registrations(current_user):
    db = get_db()
    regs = list(db.registrations.find({"user_id": str(current_user["_id"])}))
    
    for r in regs:
        r["id"] = str(r.pop("_id"))
        try:
            event = db.events.find_one({"_id": ObjectId(r["event_id"])})
            if event:
                event["id"] = str(event.pop("_id"))
                r["event"] = event
        except Exception:
            pass
    return regs, 200

def srv_get_registrations(current_user):
    db = get_db()
    
    if current_user.get("role") == "super_admin":
        regs = list(db.registrations.find())
    else:
        inst_id = current_user.get("institution_id")
        
        # 1. Events hosted by this institution (Organizer perspective)
        events = list(db.events.find({"institution_id": inst_id}))
        event_ids = [str(e["_id"]) for e in events]
        
        # 2. Students belonging to this institution (Home Admin perspective)
        students = list(db.users.find({"institution_id": inst_id, "role": "student"}))
        student_ids = [str(u["_id"]) for u in students]
        
        regs = list(db.registrations.find({
            "$or": [
                {"event_id": {"$in": event_ids}},
                {"user_id": {"$in": student_ids}}
            ]
        }))
        
    for r in regs:
        r["id"] = str(r.pop("_id"))
        
        # Populate Event
        event = db.events.find_one({"_id": ObjectId(r["event_id"])}) if "event_id" in r else None
        if event:
            r["event_title"] = event.get("title", "Unknown Event")
            r["event_date"] = event.get("start_date", "")
            
            # Determine payment status
            r["is_paid"] = False
            r["amount"] = 0
            if "sub_event_id" in r and r["sub_event_id"]:
                # Check sub-event
                for sub in event.get("sub_events", []):
                    if str(sub.get("id")) == str(r["sub_event_id"]):
                        r["is_paid"] = sub.get("is_paid", False) or (sub.get("fee", 0) > 0)
                        r["amount"] = sub.get("fee", 0)
                        break
            else:
                r["is_paid"] = event.get("type") == "paid" or bool(event.get("payment_qr_url"))
                # main event might not have amount defined at root in this schema, so just leave 0
        else:
            r["event_title"] = "Unknown Event"
            r["event_date"] = ""
            r["is_paid"] = False
            r["amount"] = 0
            
        # Populate User
        user = db.users.find_one({"_id": ObjectId(r["user_id"])}) if "user_id" in r else None
        if user:
            r["student_name"] = user.get("name", "Unknown Student")
            r["student_id"] = user.get("student_id", "")
            
            # Fetch institution for college name
            student_inst_id = user.get("institution_id")
            if student_inst_id:
                try:
                    inst = db.institutions.find_one({"_id": ObjectId(student_inst_id)})
                    r["college_name"] = inst.get("name", "Unknown College") if inst else "Unknown College"
                except:
                    r["college_name"] = "Unknown College"
            else:
                r["college_name"] = "Unknown College"
        else:
            student_inst_id = None
            r["student_name"] = "Unknown Student"
            r["student_id"] = ""
            r["college_name"] = "Unknown College"
            
        # Permission Flags
        event_inst_id = event.get("institution_id") if event else None
        
        if current_user.get("role") == "super_admin":
            r["can_approve_home"] = True
            r["can_approve_organizer"] = True
        else:
            r["can_approve_home"] = (str(student_inst_id) == str(current_user.get("institution_id")))
            r["can_approve_organizer"] = (str(event_inst_id) == str(current_user.get("institution_id"))) if event else False
            
    return regs, 200

def srv_update_registration_status(reg_id, data, current_user):
    db = get_db()
    
    try:
        reg = db.registrations.find_one({"_id": ObjectId(reg_id)})
    except Exception:
        return {"detail": "Invalid registration ID"}, 400
        
    if not reg:
        return {"detail": "Registration not found"}, 404
        
    action = data.get("status")
    
    # 1. Determine roles
    is_super = current_user.get("role") == "super_admin"
    inst_id = current_user.get("institution_id")
    
    user = db.users.find_one({"_id": ObjectId(reg["user_id"])})
    student_inst_id = user.get("institution_id") if user else None
    
    event = db.events.find_one({"_id": ObjectId(reg["event_id"])})
    event_inst_id = event.get("institution_id") if event else None
    
    can_approve_home = is_super or (str(student_inst_id) == str(inst_id))
    can_approve_organizer = is_super or (str(event_inst_id) == str(inst_id))
    
    current_status = reg.get("status")
    new_status = current_status
    
    if action == "rejected":
        new_status = "rejected"
    elif action == "approved":
        if current_status == "pending_home":
            if not can_approve_home:
                return {"detail": "Not authorized to approve for student's college"}, 403
            # If they can approve BOTH, it goes straight to approved
            if can_approve_organizer:
                new_status = "approved"
            else:
                new_status = "pending_organizer"
        elif current_status == "pending_organizer":
            if not can_approve_organizer:
                return {"detail": "Not authorized to approve for this event"}, 403
            new_status = "approved"
        else:
            return {"detail": "Invalid state transition"}, 400
    
    db.registrations.update_one({"_id": ObjectId(reg_id)}, {"$set": {"status": new_status}})
    
    # Notify user via WebSocket - TODO update websocket imports to new structure later
    try:
        websocket_manager.manager.send_to(reg.get("user_id"), {
            "type": "registration_approved" if new_status == "approved" else "registration_rejected",
            "message": f"Your registration for event {reg.get('event_id')} has been {new_status}."
        })
    except Exception:
        pass
    
    return {"message": f"Registration status updated to {new_status}"}, 200

def srv_update_registration_attendance(reg_id, data):
    db = get_db()
    attendance = data.get("attendance")
    
    try:
        reg = db.registrations.find_one({"_id": ObjectId(reg_id)})
    except Exception:
        return {"detail": "Invalid registration ID"}, 400
        
    if not reg:
        return {"detail": "Registration not found"}, 404
        
    db.registrations.update_one({"_id": ObjectId(reg_id)}, {"$set": {"attendance": attendance}})
    return {"message": f"Attendance updated to {attendance}"}, 200

def srv_get_user_registrations(user_id):
    db = get_db()
    regs = list(db.registrations.find({"user_id": user_id}).sort("created_at", -1))
    for r in regs:
        r["id"] = str(r.pop("_id"))
        try:
            event_id_str = r.get("event_id")
            event = db.events.find_one({"_id": ObjectId(event_id_str)})
            if event:
                event["id"] = str(event.pop("_id"))
                r["event"] = event
                # Fetch sub-event if applicable
                sub_event_id = r.get("sub_event_id")
                if sub_event_id:
                    for se in event.get("sub_events", []):
                        if str(se.get("id")) == str(sub_event_id):
                            r["sub_event"] = se
                            break
                            
                # Calculate registered counts
                event_count = db.registrations.count_documents({
                    "event_id": event_id_str,
                    "status": "approved"
                })
                r["event"]["registered_count"] = event_count
                
                if sub_event_id and "sub_event" in r:
                    sub_event_count = db.registrations.count_documents({
                        "event_id": event_id_str,
                        "sub_event_id": str(sub_event_id) if type(sub_event_id) != str else sub_event_id,
                        "status": "approved"
                    })
                    r["sub_event"]["registered_count"] = sub_event_count
        except Exception:
            pass
    return regs, 200

def srv_mark_student_attendance(current_user, data):
    db = get_db()
    event_id = data.get("event_id")
    if not event_id:
        return {"detail": "event_id is required"}, 400
        
    user_id = str(current_user["_id"])
    
    # Find the registration for this user and event
    reg = db.registrations.find_one({
        "user_id": user_id,
        "event_id": event_id
    })
    
    if not reg:
        return {"detail": "No registration found for this event."}, 404
        
    if reg.get("status") != "approved":
        return {"detail": "Registration must be approved to mark attendance."}, 403
        
    if reg.get("attendance") == "present" or reg.get("attendance") is True:
        return {"message": "Attendance already marked."}, 200
        
    db.registrations.update_one(
        {"_id": reg["_id"]},
        {"$set": {"attendance": "present"}}
    )
    
    return {"message": "Attendance marked successfully!"}, 200
