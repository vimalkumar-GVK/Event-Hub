from flask import request, jsonify
from services.registration_service import (
    srv_create_registration,
    srv_get_my_registrations,
    srv_get_registrations,
    srv_update_registration_status,
    srv_update_registration_attendance,
    srv_get_user_registrations
)
from middleware.auth import require_student, require_sub_admin, require_auth

@require_student
def create_registration():
    current_user = request.user
    reg_data = request.json
    result, status = srv_create_registration(current_user, reg_data)
    return jsonify(result), status

@require_student
def get_my_registrations():
    current_user = request.user
    result, status = srv_get_my_registrations(current_user)
    return jsonify(result), status

@require_sub_admin
def get_registrations():
    current_user = request.user
    result, status = srv_get_registrations(current_user)
    return jsonify(result), status

@require_sub_admin
def update_registration_status(reg_id):
    current_user = request.user
    data = request.json
    result, status = srv_update_registration_status(reg_id, data, current_user)
    return jsonify(result), status

@require_sub_admin
def update_registration_attendance(reg_id):
    data = request.json
    result, status = srv_update_registration_attendance(reg_id, data)
    return jsonify(result), status

@require_auth
def get_user_registrations(user_id):
    result, status = srv_get_user_registrations(user_id)
    return jsonify(result), status

@require_student
def mark_attendance():
    current_user = request.user
    data = request.json
    from services.registration_service import srv_mark_student_attendance
    result, status = srv_mark_student_attendance(current_user, data)
    return jsonify(result), status
