from flask import request, jsonify
from database.connection import get_db
from middleware.auth import require_admin, require_super_admin, require_auth, require_sub_admin
from services.background_jobs import trigger_bulk_generation
from datetime import datetime
import uuid
import os
from werkzeug.utils import secure_filename

# --- TEMPLATES ---
@require_admin
def create_template():
    user_data = request.user
    db = get_db()
    
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No image selected"}), 400
        
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
    upload_path = os.path.join('uploads', 'templates', unique_filename)
    if os.environ.get('VERCEL') == '1' or os.environ.get('STORAGE_PROVIDER') == 'cloud':
        upload_path = os.path.join('/tmp', 'uploads', 'templates', unique_filename)
    
    try:
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    except OSError:
        pass
    file.save(upload_path)
    
    background_url = f"/uploads/templates/{unique_filename}"

    template_id = f"TPL-{uuid.uuid4().hex[:8].upper()}"
    doc = {
        "id": template_id,
        "name": request.form.get("name"),
        "category": request.form.get("category", "Participation"),
        "template_type": request.form.get("template_type", "Common"),
        "background_image_url": background_url,
        "version": 1,
        "status": "Draft",
        "fields": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "history": []
    }
    db.certificate_templates.insert_one(doc)
    
    db.audit_logs.insert_one({
        "id": uuid.uuid4().hex,
        "user_id": user_data["id"],
        "role": user_data["role"],
        "action": "TEMPLATE_CREATED",
        "entity_id": template_id,
        "timestamp": datetime.now()
    })
    
    return jsonify({"message": "Template created successfully", "id": template_id}), 201

@require_admin
def update_template_designer(template_id):
    user_data = request.user
    db = get_db()
    data = request.json
    template = db.certificate_templates.find_one({"id": template_id})
    if not template:
        return jsonify({"message": "Template not found"}), 404
        
    # Version control
    old_version = template.copy()
    if "_id" in old_version:
        del old_version["_id"]
    if "history" in old_version:
        del old_version["history"]
    
    history = template.get("history", [])
    history.append(old_version)
    
    new_version = template.get("version", 1) + 1
    
    db.certificate_templates.update_one(
        {"id": template_id},
        {"$set": {
            "fields": data.get("fields", []),
            "version": new_version,
            "status": data.get("status", template.get("status", "Draft")),
            "updated_at": datetime.now(),
            "history": history
        }}
    )
    
    db.audit_logs.insert_one({
        "id": uuid.uuid4().hex,
        "user_id": user_data["id"],
        "role": user_data["role"],
        "action": "TEMPLATE_UPDATED",
        "entity_id": template_id,
        "timestamp": datetime.now()
    })
    
    return jsonify({"message": "Template fields updated successfully"})

@require_auth
def get_templates():
    db = get_db()
    templates = list(db.certificate_templates.find({}, {"_id": 0}))
    return jsonify(templates)

# --- GENERATION ---
@require_sub_admin
def bulk_generate_certificates():
    user_data = request.user
    data = request.json
    event_id = int(data.get("event_id")) if data.get("event_id") else None
    template_id = data.get("template_id")
    winners_data = data.get("winners_data", {})
    
    if not event_id or not template_id:
        return jsonify({"message": "event_id and template_id required"}), 400
        
    trigger_bulk_generation(event_id, template_id, winners_data)
    
    db = get_db()
    db.audit_logs.insert_one({
        "id": uuid.uuid4().hex,
        "user_id": user_data["id"],
        "role": user_data["role"],
        "action": "BULK_GENERATE_STARTED",
        "entity_id": str(event_id),
        "timestamp": datetime.now()
    })
    
    return jsonify({"message": "Bulk generation started in background"}), 202

@require_sub_admin
def upload_manual_certificate():
    user_data = request.user
    db = get_db()
    
    if 'certificate' not in request.files:
        return jsonify({"message": "No certificate file provided"}), 400
        
    file = request.files['certificate']
    event_id = request.form.get('event_id')
    student_id = request.form.get('student_id')
    
    if not event_id or not student_id:
         return jsonify({"message": "event_id and student_id required"}), 400

    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400
        
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
    upload_path = os.path.join('uploads', 'certificates', unique_filename)
    if os.environ.get('VERCEL') == '1' or os.environ.get('STORAGE_PROVIDER') == 'cloud':
        upload_path = os.path.join('/tmp', 'uploads', 'certificates', unique_filename)
        
    try:
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    except OSError:
        pass
    file.save(upload_path)
    
    pdf_url = f"/uploads/certificates/{unique_filename}"
    
    import hashlib
    SECRET_KEY = os.environ.get("SECRET_KEY", "super_secret_certificate_key")
    cert_id = f"CERT-{event_id}-{student_id}-{uuid.uuid4().hex[:6].upper()}"
    data_to_hash = f"{cert_id}-{student_id}-{event_id}-{SECRET_KEY}"
    crypto_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()

    cert_doc = {
        "id": cert_id,
        "certificate_id": cert_id,
        "student_id": student_id,
        "event_id": event_id,
        "template_id": "MANUAL",
        "type": "Manual Upload",
        "status": "Generated",
        "pdf_url": pdf_url,
        "cryptographic_hash": crypto_hash,
        "issued_at": datetime.now()
    }
    
    # Use update with upsert to prevent duplicates if uploading multiple times
    db.certificates.update_one(
        {"student_id": student_id, "event_id": event_id},
        {"$set": cert_doc},
        upsert=True
    )
    
    db.registrations.update_one(
        {"event_id": event_id, "user_id": student_id},
        {"$set": {"certificate_url": cert_id, "certificate_type": "Manual Upload"}}
    )
    
    return jsonify({"message": "Certificate uploaded successfully", "id": cert_id}), 201

@require_sub_admin
def get_event_attendees(event_id):
    db = get_db()
    # Find registrations for the event that have attendance marked as present
    registrations = list(db.registrations.find({
        "event_id": str(event_id),
        "attendance": {"$in": ["present", "Present", True]}
    }))
    
    attendees = []
    for reg in registrations:
        try:
            from bson import ObjectId
            student = db.users.find_one({"$or": [{"_id": ObjectId(reg["user_id"])}, {"id": reg["user_id"]}]})
        except Exception:
            student = db.users.find_one({"id": reg["user_id"]})
            
        if student:
            student_id_str = str(student.get("_id"))
            # Check if certificate is already issued
            cert = db.certificates.find_one({"event_id": str(event_id), "student_id": student_id_str})
            attendees.append({
                "student_id": student_id_str,
                "student_name": student.get("name") or student.get("username", "Unknown"),
                "student_email": student.get("email", ""),
                "status": "Issued" if cert else "Pending",
                "certificate_url": cert.get("pdf_url") if cert else None,
                "sub_event_id": reg.get("sub_event_id")
            })
            
    return jsonify(attendees)

# --- STUDENT / PUBLIC ---
@require_auth
def get_my_certificates():
    user_data = request.user
    db = get_db()
    
    student_id_str = str(user_data.get("_id"))
    fallback_id = user_data.get("id")
    
    certs = list(db.certificates.find(
        {"student_id": {"$in": [student_id_str, fallback_id]}}, 
        {"_id": 0}
    ))
    
    for cert in certs:
        event = db.events.find_one({"id": cert["event_id"]})
        if not event:
            from bson import ObjectId
            try:
                event = db.events.find_one({"_id": ObjectId(cert["event_id"])})
            except Exception:
                pass
        if event:
            cert["event_title"] = event.get("title")
    return jsonify(certs)

def verify_certificate(hash):
    db = get_db()
    cert = db.certificates.find_one({"cryptographic_hash": hash}, {"_id": 0})
    if not cert:
        return jsonify({"status": "Invalid", "message": "Certificate not found or hash invalid"}), 404
        
    if cert.get("status") == "Revoked":
        return jsonify({"status": "Revoked", "message": f"Revoked: {cert.get('revocation_reason')}"}), 400
        
    student = db.users.find_one({"id": cert["student_id"]})
    event = db.events.find_one({"id": cert["event_id"]})
    
    return jsonify({
        "status": "Authentic",
        "certificate": cert,
        "student_name": student.get("name") if student else "Unknown",
        "event_title": event.get("title") if event else "Unknown"
    })
