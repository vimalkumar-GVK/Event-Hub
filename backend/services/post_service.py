import datetime
from bson import ObjectId
from database.connection import get_db

def srv_get_posts(user_id=None):
    db = get_db()
    
    query = {}
    if user_id:
        query["user_id"] = str(user_id)
        
    # Fetch posts sorted by newest first
    posts = list(db.posts.find(query).sort("created_at", -1))
    
    for p in posts:
        p["id"] = str(p.pop("_id"))
    
    return posts, 200

def srv_create_post(current_user, post_dict):
    db = get_db()
    
    post_dict["user_id"] = str(current_user["_id"])
    post_dict["username"] = current_user.get("name", "Unknown User")
    post_dict["user_image"] = current_user.get("profile_photo", current_user.get("profile_pic"))
    
    now = datetime.datetime.utcnow()
    post_dict["created_at"] = now
    post_dict["likes"] = 0
    post_dict["comments"] = 0
    
    result = db.posts.insert_one(post_dict)
    post_dict["id"] = str(result.inserted_id)
    post_dict.pop("_id", None)
    
    return post_dict, 201

def srv_delete_post(current_user, post_id):
    db = get_db()
    
    post = db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        return {"detail": "Post not found"}, 404
        
    if str(post.get("user_id")) != str(current_user["_id"]):
        return {"detail": "Not authorized to delete this post"}, 403
        
    db.posts.delete_one({"_id": ObjectId(post_id)})
    return {"detail": "Post deleted successfully"}, 200
