from flask import Blueprint
from controllers.user_controller import (
    get_users,
    get_user,
    delete_user,
    get_pending_students,
    verify_student,
    reject_student,
    create_sub_admin,
    update_profile,
    search_users
)

user_bp = Blueprint("users", __name__)

user_bp.route("/users", methods=["GET"])(get_users)
user_bp.route("/users/search", methods=["GET"])(search_users)
user_bp.route("/users/sub-admin", methods=["POST"])(create_sub_admin)
user_bp.route("/users/profile", methods=["PUT"])(update_profile)
user_bp.route("/users/<user_id>", methods=["GET"])(get_user)
user_bp.route("/users/<user_id>", methods=["DELETE"])(delete_user)
user_bp.route("/students/pending", methods=["GET"])(get_pending_students)
user_bp.route("/students/<student_id>/verify", methods=["POST"])(verify_student)
user_bp.route("/students/<student_id>/reject", methods=["POST"])(reject_student)
