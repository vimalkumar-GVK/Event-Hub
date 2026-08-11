from flask import Blueprint
from controllers.story_controller import get_stories, create_story, delete_story

story_bp = Blueprint("stories", __name__)

story_bp.route("/", methods=["GET"], strict_slashes=False)(get_stories)
story_bp.route("/", methods=["POST"], strict_slashes=False)(create_story)
story_bp.route("/<story_id>", methods=["DELETE"], strict_slashes=False)(delete_story)
