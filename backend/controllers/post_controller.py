import os
import uuid
from flask import request, jsonify
from werkzeug.utils import secure_filename
from services.post_service import srv_get_posts, srv_create_post, srv_delete_post
from middleware.auth import require_auth
from models.schemas import PostCreate
from pydantic import ValidationError

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
if os.environ.get('VERCEL') == '1' or os.environ.get('STORAGE_PROVIDER') == 'cloud':
    UPLOAD_FOLDER = '/tmp/uploads'
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError:
    pass

@require_auth
def get_posts():
    user_id = request.args.get('user_id')
    result, status = srv_get_posts(user_id=user_id)
    return jsonify(result), status

@require_auth
def create_post():
    current_user = request.user
    
    post_dict = {}
    
    if 'caption' in request.form:
        post_dict['caption'] = request.form['caption']
        
    if 'media' in request.files:
        file = request.files['media']
        if file.filename != '':
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            media_url = f"/uploads/{unique_filename}"
            post_dict['media'] = media_url
    
    # Validate payload
    try:
        validated = PostCreate(**post_dict)
        post_dict = validated.dict(exclude_unset=True)
    except ValidationError as e:
        return jsonify({"detail": e.errors()}), 422
        
    result, status = srv_create_post(current_user, post_dict)
    return jsonify(result), status

@require_auth
def delete_post(post_id):
    current_user = request.user
    result, status = srv_delete_post(current_user, post_id)
    return jsonify(result), status
