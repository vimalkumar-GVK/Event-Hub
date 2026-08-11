from flask import request, jsonify
from middleware.auth import require_sub_admin, require_admin, require_auth, require_student
from services.event_service import srv_get_events, srv_get_public_events, srv_create_event, srv_update_event, srv_delete_event, srv_get_pending_events, srv_approve_event, srv_mark_student_attendance, srv_get_my_events, srv_get_event_by_id, srv_approve_event_deletion

def get_events():
    auth_header = request.headers.get("Authorization")
    inst_id = request.args.get("institution_id")
    city = request.args.get("city")
    result, status = srv_get_events(auth_header, inst_id, city)
    return jsonify(result), status

def get_public_events():
    result, status = srv_get_public_events()
    return jsonify(result), status

@require_auth
def get_my_events():
    current_user = request.user
    result, status = srv_get_my_events(current_user)
    return jsonify(result), status

@require_auth
def get_event(event_id):
    result, status = srv_get_event_by_id(event_id)
    return jsonify(result), status

@require_sub_admin
def create_event():
    current_user = request.user
    event_dict = request.json
    result, status = srv_create_event(current_user, event_dict)
    return jsonify(result), status

@require_sub_admin
def update_event(event_id):
    current_user = request.user
    event_dict = request.json
    result, status = srv_update_event(event_id, current_user, event_dict)
    return jsonify(result), status

@require_sub_admin
def delete_event(event_id):
    current_user = request.user
    result, status = srv_delete_event(event_id, current_user)
    return jsonify(result), status

@require_admin
def get_pending_events():
    current_user = request.user
    result, status = srv_get_pending_events(current_user)
    return jsonify(result), status

@require_admin
def approve_event(event_id):
    current_user = request.user
    result, status = srv_approve_event(event_id, current_user)
    return jsonify(result), status

@require_admin
def approve_event_deletion(event_id):
    current_user = request.user
    result, status = srv_approve_event_deletion(event_id, current_user)
    return jsonify(result), status

import time
used_qr_tokens = {}

@require_auth
def scan_qr():
    qr_token = request.json.get("qr_token") if request.json else None
    if not qr_token:
        return jsonify({"error": "Missing QR token"}), 400
        
    # Replay Attack Check: Signature uniqueness
    parts = qr_token.split('.')
    if len(parts) != 3:
        return jsonify({"error": "Invalid token format"}), 400
        
    token_signature = parts[-1]
    
    current_time = time.time()
    keys_to_delete = [k for k, v in used_qr_tokens.items() if current_time - v > 15]
    for k in keys_to_delete:
        del used_qr_tokens[k]
        
    user_id = request.user.get("id")
    cache_key = f"{token_signature}_{user_id}"
    
    if cache_key in used_qr_tokens:
        return jsonify({"error": "Replay attack detected. Token already used by you."}), 403
        
    used_qr_tokens[cache_key] = current_time
    
    # Check-in logic would go here if fully integrated.
    return jsonify({"message": "Check-in successful"}), 200

@require_student
def mark_attendance(event_id):
    current_user = request.user
    result, status = srv_mark_student_attendance(event_id, current_user)
    return jsonify(result), status
