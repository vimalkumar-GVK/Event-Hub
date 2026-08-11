from flask import Blueprint
from controllers.event_controller import get_events, get_public_events, create_event, update_event, delete_event, get_pending_events, approve_event, scan_qr, mark_attendance, get_my_events, get_event, approve_event_deletion

event_bp = Blueprint("events", __name__)

event_bp.route("/", methods=["GET"], strict_slashes=False)(get_events)
event_bp.route("/public", methods=["GET"], strict_slashes=False)(get_public_events)
event_bp.route("/me", methods=["GET"], strict_slashes=False)(get_my_events)
event_bp.route("/", methods=["POST"], strict_slashes=False)(create_event)
event_bp.route("/<event_id>", methods=["GET"], strict_slashes=False)(get_event)
event_bp.route("/<event_id>", methods=["PUT"], strict_slashes=False)(update_event)
event_bp.route("/<event_id>", methods=["DELETE"], strict_slashes=False)(delete_event)
event_bp.route("/pending", methods=["GET"], strict_slashes=False)(get_pending_events)
event_bp.route("/<event_id>/approve", methods=["PUT"], strict_slashes=False)(approve_event)
event_bp.route("/<event_id>/approve-deletion", methods=["PUT"], strict_slashes=False)(approve_event_deletion)
event_bp.route("/scan", methods=["POST"], strict_slashes=False)(scan_qr)
event_bp.route("/<event_id>/attendance", methods=["POST"], strict_slashes=False)(mark_attendance)
