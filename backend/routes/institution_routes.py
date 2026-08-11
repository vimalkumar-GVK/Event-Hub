from flask import Blueprint
from controllers.institution_controller import create_institution, get_institutions, get_institution, update_institution, delete_institution

institution_bp = Blueprint("institutions", __name__)

# strict_slashes=False so both /api/institutions and /api/institutions/ work
# without Flask issuing a 308 redirect (which causes axios to drop the auth header)
institution_bp.route("/", methods=["POST"], strict_slashes=False)(create_institution)
institution_bp.route("/", methods=["GET"], strict_slashes=False)(get_institutions)
institution_bp.route("/<inst_id>", methods=["GET"], strict_slashes=False)(get_institution)
institution_bp.route("/<inst_id>", methods=["PUT"], strict_slashes=False)(update_institution)
institution_bp.route("/<inst_id>", methods=["DELETE"], strict_slashes=False)(delete_institution)
