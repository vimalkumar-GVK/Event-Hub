from flask import Blueprint
from controllers.post_controller import get_posts, create_post, delete_post

post_bp = Blueprint("posts", __name__)

post_bp.route("/", methods=["GET"], strict_slashes=False)(get_posts)
post_bp.route("/", methods=["POST"], strict_slashes=False)(create_post)
post_bp.route("/<post_id>", methods=["DELETE"], strict_slashes=False)(delete_post)
