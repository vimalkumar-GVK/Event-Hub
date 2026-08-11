from flask import request, jsonify
from services.stats_service import (
    srv_get_stats,
    srv_get_system_stats,
    srv_post_system_announce
)
from middleware.auth import require_admin, require_super_admin

@require_admin
def get_stats():
    current_user = request.user
    result, status = srv_get_stats(current_user)
    return jsonify(result), status

@require_super_admin
def get_system_stats():
    result, status = srv_get_system_stats()
    return jsonify(result), status

@require_super_admin
def post_system_announce():
    current_user = request.user
    data = request.json
    result, status = srv_post_system_announce(current_user, data)
    return jsonify(result), status
