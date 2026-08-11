from flask import Blueprint
from controllers.certificate_controller import create_template, update_template_designer, get_templates, bulk_generate_certificates, get_my_certificates, verify_certificate, upload_manual_certificate, get_event_attendees

certificate_bp = Blueprint("certificates", __name__)

# Templates
certificate_bp.route("/templates", methods=["POST"], strict_slashes=False)(create_template)
certificate_bp.route("/templates/<template_id>/designer", methods=["PUT"], strict_slashes=False)(update_template_designer)
certificate_bp.route("/templates", methods=["GET"], strict_slashes=False)(get_templates)

# Generation & Manual Upload
certificate_bp.route("/generate", methods=["POST"], strict_slashes=False)(bulk_generate_certificates)
certificate_bp.route("/upload", methods=["POST"], strict_slashes=False)(upload_manual_certificate)
certificate_bp.route("/attendees/<event_id>", methods=["GET"], strict_slashes=False)(get_event_attendees)

# Student
certificate_bp.route("/me", methods=["GET"], strict_slashes=False)(get_my_certificates)

# Public
certificate_bp.route("/verify/<hash>", methods=["GET"], strict_slashes=False)(verify_certificate)
