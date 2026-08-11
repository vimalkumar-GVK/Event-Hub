from flask import Blueprint
from controllers.auth_controller import login_user, register_user, get_current_user, forgot_password, verify_otp, reset_password

auth_bp = Blueprint("auth", __name__)

auth_bp.route("/login", methods=["POST"])(login_user)
auth_bp.route("/register", methods=["POST"])(register_user)
auth_bp.route("/me", methods=["GET"])(get_current_user)

auth_bp.route("/forgot-password", methods=["POST"], strict_slashes=False)(forgot_password)
auth_bp.route("/verify-otp", methods=["POST"], strict_slashes=False)(verify_otp)
auth_bp.route("/reset-password", methods=["POST"], strict_slashes=False)(reset_password)

