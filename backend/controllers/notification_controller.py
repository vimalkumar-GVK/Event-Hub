from flask import request, jsonify
from services.notification_service import srv_get_notifications, srv_mark_notification_read
from middleware.auth import require_auth

@require_auth
def get_notifications():
    current_user = request.user
    result, status = srv_get_notifications(current_user)
    return jsonify(result), status

@require_auth
def mark_notification_read(notification_id):
    current_user = request.user
    result, status = srv_mark_notification_read(notification_id, current_user)
    return jsonify(result), status

@require_auth
def create_notification():
    current_user = request.user
    data = request.get_json()
    from services.notification_service import srv_create_notification
    srv_create_notification(
        text=data.get("text"),
        event_id=data.get("event_id"),
        sender_name="System",
        notif_type=data.get("type", "info"),
        target_user_id=str(current_user["_id"])
    )
    return jsonify({"message": "Notification created"}), 201
