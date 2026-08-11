import datetime
from bson import ObjectId
from database.connection import get_db

def srv_get_stories():
    db = get_db()
    now = datetime.datetime.utcnow()
    
    # Clean up expired stories automatically when fetching
    db.stories.delete_many({"expires_at": {"$lt": now}})
    
    # Fetch remaining valid stories
    stories = list(db.stories.find({"expires_at": {"$gte": now}}).sort("created_at", -1))
    
    for s in stories:
        s["id"] = str(s.pop("_id"))
    
    return stories, 200

def srv_create_story(current_user, story_dict):
    db = get_db()
    
    story_dict["user_id"] = str(current_user["_id"])
    story_dict["username"] = current_user.get("name", "Unknown User")
    story_dict["user_image"] = current_user.get("profile_photo", current_user.get("profile_pic"))
    
    now = datetime.datetime.utcnow()
    story_dict["created_at"] = now
    story_dict["expires_at"] = now + datetime.timedelta(hours=24)
    
    result = db.stories.insert_one(story_dict)
    story_dict["id"] = str(result.inserted_id)
    story_dict.pop("_id", None)
    
    return story_dict, 201

def srv_delete_story(current_user, story_id):
    db = get_db()
    
    # Make sure to only delete the story if it belongs to the current user
    try:
        obj_id = ObjectId(story_id)
    except Exception:
        return {"detail": "Invalid story ID"}, 400
        
    result = db.stories.delete_one({
        "_id": obj_id,
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        return {"detail": "Story not found or unauthorized"}, 404
        
    return {"detail": "Story deleted successfully"}, 200
