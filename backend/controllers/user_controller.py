from flask import request, jsonify
from services.user_service import (
    srv_get_users,
    srv_get_user,
    srv_delete_user,
    srv_get_pending_students,
    srv_verify_student,
    srv_reject_student,
    srv_update_profile,
    srv_search_users
)
from middleware.auth import require_admin, require_super_admin, require_auth, require_sub_admin

@require_sub_admin
def get_users():
    current_user = request.user
    inst_id = request.args.get("institution_id")
    result, status = srv_get_users(current_user, inst_id)
    return jsonify(result), status

@require_auth
def get_user(user_id):
    result, status = srv_get_user(user_id)
    return jsonify(result), status

@require_sub_admin
def delete_user(user_id):
    current_user = request.user
    result, status = srv_delete_user(user_id, current_user)
    return jsonify(result), status

@require_admin
def create_sub_admin():
    current_user = request.user
    data = request.json
    from services.user_service import srv_create_sub_admin
    result, status = srv_create_sub_admin(data, current_user)
    return jsonify(result), status

@require_admin
def get_pending_students():
    current_user = request.user
    result, status = srv_get_pending_students(current_user)
    return jsonify(result), status

@require_admin
def verify_student(student_id):
    current_user = request.user
    result, status = srv_verify_student(student_id, current_user)
    return jsonify(result), status

@require_admin
def reject_student(student_id):
    current_user = request.user
    reason = request.json.get("reason", "Rejected by Admin") if request.is_json else "Rejected by Admin"
    result, status = srv_reject_student(student_id, current_user, reason)
    return jsonify(result), status

@require_auth
def update_profile():
    current_user = request.user
    data = request.json
    result, status = srv_update_profile(current_user, data)
    return jsonify(result), status

@require_auth
def search_users():
    current_user = request.user
    query = request.args.get("q", "")
    result, status = srv_search_users(current_user, query)
    return jsonify(result), status
