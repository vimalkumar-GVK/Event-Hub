from flask import Blueprint
from controllers.notification_controller import get_notifications, mark_notification_read, create_notification

notification_bp = Blueprint("notifications", __name__)

notification_bp.route("/", methods=["GET"], strict_slashes=False)(get_notifications)
notification_bp.route("/<notification_id>/read", methods=["PUT"], strict_slashes=False)(mark_notification_read)
notification_bp.route("/create", methods=["POST"], strict_slashes=False)(create_notification)
