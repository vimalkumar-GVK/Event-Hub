from flask import Blueprint
from controllers.stats_controller import (
    get_stats,
    get_system_stats,
    post_system_announce
)

stats_bp = Blueprint("stats", __name__)

# /api/stats  (registered with url_prefix="/api")
stats_bp.route("/stats", methods=["GET"], strict_slashes=False)(get_stats)

# /api/system/stats  — the superadmin dashboard calls /api/system/stats
stats_bp.route("/system/stats", methods=["GET"], strict_slashes=False)(get_system_stats)

# /api/system/announce
stats_bp.route("/system/announce", methods=["POST"], strict_slashes=False)(post_system_announce)
