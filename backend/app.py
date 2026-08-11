import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import traceback
from pydantic import ValidationError

from config.config import Config
from database.connection import get_db
import utils.websocket_manager as websocket_manager

from routes.auth_routes import auth_bp
from routes.event_routes import event_bp
from routes.institution_routes import institution_bp
from routes.registration_routes import registration_bp
from routes.stats_routes import stats_bp
from routes.user_routes import user_bp
from routes.story_routes import story_bp
from routes.post_routes import post_bp
from routes.notification_routes import notification_bp
from routes.certificate_routes import certificate_bp
from routes.chat_routes import chat_bp

app = Flask(__name__)
# Allow 1GB uploads
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024
CORS(app, resources={r"/*": {"origins": Config.ALLOWED_ORIGINS}}, supports_credentials=True)

app.config["MONGO_URI"] = Config.MONGO_URI
app.config["SECRET_KEY"] = Config.SECRET_KEY

# Initialize WebSockets
websocket_manager.init_websockets(app)

# Register Blueprints

# Wait, the original was /api/login, so the prefix should just be /api for auth, or I can update auth_routes to use the exact names.
# Actually in routes I used /login, so url_prefix="/api" is correct.
# Wait, for institutions the original was /api/institutions. In institution_routes I mapped / and /<inst_id>.
# So the prefix should be /api/institutions for that one.
# Let's map exactly based on my route definitions:
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(institution_bp, url_prefix="/api/institutions")
app.register_blueprint(event_bp, url_prefix="/api/events")
app.register_blueprint(registration_bp, url_prefix="/api/registrations")
app.register_blueprint(stats_bp, url_prefix="/api")
app.register_blueprint(user_bp, url_prefix="/api") # Original was /api/users, but user_bp also has /students/pending which would map to /api/users/students/pending unless I fix it.
app.register_blueprint(story_bp, url_prefix="/api/stories")
app.register_blueprint(post_bp, url_prefix="/api/posts")
app.register_blueprint(notification_bp, url_prefix="/api/notifications")
app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
app.register_blueprint(chat_bp)

import re
from flask import request

def sanitize_dict(d):
    cleanr = re.compile('<.*?>')
    for key, value in d.items():
        if isinstance(value, str):
            d[key] = re.sub(cleanr, '', value)
        elif isinstance(value, dict):
            sanitize_dict(value)
        elif isinstance(value, list):
            d[key] = [re.sub(cleanr, '', v) if isinstance(v, str) else v for v in value]
    return d

request_counts = {}
import time

@app.before_request
def security_middleware():
    client_ip = request.remote_addr
    
    # Rate Limiting (100 requests per minute per IP)
    current_time = time.time()
    if client_ip not in request_counts:
        request_counts[client_ip] = []
    request_counts[client_ip] = [t for t in request_counts[client_ip] if current_time - t < 60]
    if len(request_counts[client_ip]) > 100:
        return jsonify({"error": "Too many requests"}), 429
    request_counts[client_ip].append(current_time)

    # Input Sanitization
    if request.is_json and request.json:
        sanitize_dict(request.json)
        
    # Global Authentication (Skip public routes and OPTIONS)
    public_routes = ['/api/login', '/api/register', '/uploads/', '/api/institutions', '/api/certificates/verify']
    is_public = any(request.path.startswith(route) for route in public_routes) or request.path == '/'
    
    if not is_public and request.method != 'OPTIONS':
        if not request.headers.get('Authorization'):
            token = request.cookies.get('jwt_token')
            if token:
                request.environ['HTTP_AUTHORIZATION'] = f'Bearer {token}'

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    upload_dir = '/tmp/uploads' if os.environ.get('VERCEL') == '1' else 'uploads'
    return send_from_directory(upload_dir, filename)

@app.errorhandler(Exception)
def global_exception_handler(exc):
    print(f"ERROR: {str(exc)}")
    traceback.print_exc()
    return jsonify({"detail": str(exc)}), 500

@app.errorhandler(ValidationError)
def pydantic_exception_handler(exc):
    return jsonify({"detail": exc.errors()}), 422

# Serving Frontend Static Files (Legacy)
PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(PARENT_DIR, "public")

@app.route("/")
def index():
    if os.path.exists(os.path.join(PUBLIC_DIR, 'index.html')):
        return send_from_directory(PUBLIC_DIR, 'index.html')
    return jsonify({"message": "Smart Campus Flask API (Refactored)"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=8000, use_reloader=True)
