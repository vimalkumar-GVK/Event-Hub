from flask import Blueprint
from controllers.registration_controller import (
    create_registration, 
    get_my_registrations, 
    get_registrations, 
    update_registration_status, 
    update_registration_attendance, 
    get_user_registrations,
    mark_attendance
)

registration_bp = Blueprint("registrations", __name__)

registration_bp.route("/", methods=["POST"], strict_slashes=False)(create_registration)
registration_bp.route("/my", methods=["GET"], strict_slashes=False)(get_my_registrations)
registration_bp.route("/", methods=["GET"], strict_slashes=False)(get_registrations)
registration_bp.route("/<reg_id>/status", methods=["PUT"], strict_slashes=False)(update_registration_status)
registration_bp.route("/<reg_id>/attendance", methods=["PUT"], strict_slashes=False)(update_registration_attendance)
registration_bp.route("/mark-attendance", methods=["POST"], strict_slashes=False)(mark_attendance)
registration_bp.route("/user/<user_id>", methods=["GET"], strict_slashes=False)(get_user_registrations)
