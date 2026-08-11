import os
import uuid
from flask import request, jsonify
from werkzeug.utils import secure_filename
from services.story_service import srv_get_stories, srv_create_story, srv_delete_story
from middleware.auth import require_auth
from models.schemas import StoryCreate
from pydantic import ValidationError

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
if os.environ.get('VERCEL') == '1' or os.environ.get('STORAGE_PROVIDER') == 'cloud':
    UPLOAD_FOLDER = '/tmp/uploads'
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError:
    pass

@require_auth
def get_stories():
    result, status = srv_get_stories()
    return jsonify(result), status

@require_auth
def create_story():
    current_user = request.user
    
    # Check if a file is in the request
    if 'media' not in request.files:
        return jsonify({"detail": "No media file provided"}), 400
        
    file = request.files['media']
    if file.filename == '':
        return jsonify({"detail": "No selected file"}), 400

    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    file.save(file_path)
    
    media_url = f"/uploads/{unique_filename}"
    
    story_dict = {"media": media_url}
    
    # Validate payload
    try:
        validated = StoryCreate(**story_dict)
        story_dict = validated.dict(exclude_unset=True)
    except ValidationError as e:
        return jsonify({"detail": e.errors()}), 422
        
    result, status = srv_create_story(current_user, story_dict)
    return jsonify(result), status

@require_auth
def delete_story(story_id):
    current_user = request.user
    result, status = srv_delete_story(current_user, story_id)
    return jsonify(result), status
