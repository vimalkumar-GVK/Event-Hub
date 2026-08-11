from flask import Blueprint, request, jsonify
from middleware.auth import require_auth
from database.connection import get_db
from bson.objectid import ObjectId
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

chat_bp = Blueprint("chat", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads', 'chat')
if os.environ.get('VERCEL') == '1' or os.environ.get('STORAGE_PROVIDER') == 'cloud':
    UPLOAD_FOLDER = '/tmp/uploads/chat'
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError:
    pass
# Max file size 50MB is configured in app.py

@chat_bp.route("/api/chat/users", methods=["GET"])
@require_auth
def search_users():
    """Globally search for users by name, email, or id"""
    current_user = request.user
    db = get_db()
    query = request.args.get("search", "").strip()
    
    if not query:
        return jsonify([]), 200

    # Avoid DB overload by limiting results
    db_query = {
        "$and": [
            {"_id": {"$ne": current_user["_id"]}},
            {"$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ]}
        ]
    }
    
    # If the query is exactly 24 chars hex, they might be searching by ID directly
    if len(query) == 24:
        try:
            db_query["$or"].append({"_id": ObjectId(query)})
        except:
            pass
            
    users = list(db.users.find(db_query, {"password": 0}).limit(20))
    
    res = []
    for u in users:
        u["id"] = str(u.pop("_id"))
        if "institution_id" in u and u["institution_id"]:
            u["institution_id"] = str(u["institution_id"])
        res.append(u)
        
    return jsonify(res), 200


@chat_bp.route("/api/chat/conversations", methods=["GET"])
@require_auth
def get_conversations():
    """Get active conversations for the current user"""
    current_user = request.user
    db = get_db()
    user_id = str(current_user["_id"])
    
    conversations = list(db.conversations.find({"participants": user_id}).sort("updated_at", -1))
    
    # Hydrate participants with user data for the frontend
    for conv in conversations:
        conv["id"] = str(conv.pop("_id"))
        
        participant_ids = [ObjectId(pid) for pid in conv.get("participants", []) if pid != user_id]
        if participant_ids:
            other_user = db.users.find_one({"_id": participant_ids[0]}, {"password": 0})
            if other_user:
                other_user["id"] = str(other_user.pop("_id"))
                conv["other_user"] = other_user
        
    return jsonify(conversations), 200


@chat_bp.route("/api/chat/conversations/<conv_id>/messages", methods=["GET"])
@require_auth
def get_messages(conv_id):
    """Get message history for a conversation"""
    current_user = request.user
    db = get_db()
    
    try:
        conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
        if not conv or str(current_user["_id"]) not in conv.get("participants", []):
            return jsonify({"detail": "Not authorized"}), 403
            
        messages = list(db.messages.find({"conversation_id": conv_id}).sort("created_at", 1))
        for m in messages:
            m["id"] = str(m.pop("_id"))
            
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"detail": str(e)}), 400


@chat_bp.route("/api/chat/conversations/<conv_id>/messages", methods=["POST"])
@require_auth
def send_message_http(conv_id):
    """Send a message via HTTP (fallback when WebSocket is not available)"""
    import utils.websocket_manager as ws_manager
    current_user = request.user
    db = get_db()
    data = request.json or {}

    content = data.get("content", "").strip()
    msg_type = data.get("type", "text")

    if not content:
        return jsonify({"detail": "content is required"}), 400

    try:
        conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
        user_id = str(current_user["_id"])
        if not conv or user_id not in conv.get("participants", []):
            return jsonify({"detail": "Not authorized"}), 403

        now_iso = datetime.utcnow().isoformat() + "Z"
        new_msg = {
            "conversation_id": conv_id,
            "sender_id": user_id,
            "content": content,
            "type": msg_type,
            "reply_to": data.get("reply_to"),
            "read_by": [user_id],
            "created_at": now_iso,
        }
        res = db.messages.insert_one(new_msg)
        new_msg["id"] = str(res.inserted_id)
        new_msg.pop("_id", None)

        # Update conversation last_message
        db.conversations.update_one(
            {"_id": ObjectId(conv_id)},
            {"$set": {"last_message": new_msg, "updated_at": now_iso}}
        )

        # Push to all participants via WebSocket if connected
        broadcast_payload = {"type": "new_message", "message": new_msg}
        for p_id in conv.get("participants", []):
            ws_manager.manager.send_to(p_id, broadcast_payload)

        return jsonify(new_msg), 201
    except Exception as e:
        return jsonify({"detail": str(e)}), 400



@chat_bp.route("/api/chat/conversations", methods=["POST"])
@require_auth
def get_or_create_conversation():
    """Create or return existing conversation with another user"""
    current_user = request.user
    db = get_db()
    data = request.json
    target_user_id = data.get("target_user_id")
    
    if not target_user_id:
        return jsonify({"detail": "target_user_id required"}), 400
        
    # Check if a conversation already exists between these two
    my_id = str(current_user["_id"])
    existing = db.conversations.find_one({
        "participants": {"$all": [my_id, target_user_id], "$size": 2}
    })
    
    if existing:
        existing["id"] = str(existing.pop("_id"))
        
        participant_ids = [ObjectId(pid) for pid in existing.get("participants", []) if pid != my_id]
        if participant_ids:
            other_user = db.users.find_one({"_id": participant_ids[0]}, {"password": 0})
            if other_user:
                other_user["id"] = str(other_user.pop("_id"))
                existing["other_user"] = other_user

        return jsonify(existing), 200
        
    # Create new
    new_conv = {
        "participants": [my_id, target_user_id],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_message": None
    }
    res = db.conversations.insert_one(new_conv)
    new_conv["id"] = str(res.inserted_id)
    new_conv.pop("_id")
    
    # hydrate
    other_user = db.users.find_one({"_id": ObjectId(target_user_id)}, {"password": 0})
    if other_user:
        other_user["id"] = str(other_user.pop("_id"))
        new_conv["other_user"] = other_user
    
    return jsonify(new_conv), 201


@chat_bp.route("/api/chat/upload", methods=["POST"])
@require_auth
def upload_file():
    """Upload an attachment for the chat (max 50MB)"""
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit
    if request.content_length and request.content_length > MAX_FILE_SIZE:
        return jsonify({"detail": "File size exceeds 50MB limit"}), 413

    if "file" not in request.files:
        return jsonify({"detail": "No file part"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"detail": "No selected file"}), 400
        
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'bin'
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_path)
    
    # Return relative URL
    file_url = f"/static/uploads/chat/{unique_filename}"
    return jsonify({"url": file_url, "filename": filename}), 200
