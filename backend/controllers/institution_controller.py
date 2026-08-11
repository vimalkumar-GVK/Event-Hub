from flask import request, jsonify
from services.institution_service import srv_create_institution, srv_get_institutions, srv_get_institution, srv_update_institution, srv_delete_institution
from middleware.auth import require_super_admin, require_auth

@require_super_admin
def create_institution():
    data = request.json
    result, status = srv_create_institution(data)
    return jsonify(result), status

def get_institutions():
    result, status = srv_get_institutions()
    return jsonify(result), status

@require_auth
def get_institution(inst_id):
    result, status = srv_get_institution(inst_id)
    return jsonify(result), status

@require_super_admin
def update_institution(inst_id):
    data = request.json
    result, status = srv_update_institution(inst_id, data)
    return jsonify(result), status

@require_super_admin
def delete_institution(inst_id):
    result, status = srv_delete_institution(inst_id)
    return jsonify(result), status
