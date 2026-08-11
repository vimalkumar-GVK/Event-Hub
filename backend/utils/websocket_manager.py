import json
from flask_sock import Sock

sock = Sock()

class ConnectionManager:
    def __init__(self):
        # Maps user_id to active WebSocket connections
        self.active_connections = {}

    def connect(self, user_id, websocket):
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    def send_to(self, user_id, message):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].send(json.dumps(message))
            except:
                self.disconnect(user_id)

    def send_to_role(self, role, message, db):
        # Find users with the specified role
        users = db.users.find({"role": role})
        for user in users:
            user_id = str(user["_id"])
            if user_id in self.active_connections:
                try:
                    self.active_connections[user_id].send(json.dumps(message))
                except:
                    self.disconnect(user_id)

    def broadcast(self, message):
        disconnected = []
        for user_id, connection in self.active_connections.items():
            try:
                connection.send(json.dumps(message))
            except:
                disconnected.append(user_id)
        for user_id in disconnected:
            self.disconnect(user_id)

manager = ConnectionManager()

def init_websockets(app):
    sock.init_app(app)
    
    @sock.route('/ws/<user_id>')
    def websocket_endpoint(ws, user_id):
        from flask import request
        token = request.args.get("token")
        if not token:
            ws.close(1008, "Policy Violation")
            return
            
        try:
            from jose import jwt
            from config.config import Config
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
            email = payload.get("sub")
            from database.connection import get_db
            db = get_db()
            user = db.users.find_one({"email": email})
            if not user or str(user["_id"]) != user_id:
                ws.close(1008, "Policy Violation")
                return
        except Exception:
            ws.close(1008, "Policy Violation")
            return

        manager.connect(user_id, ws)
        try:
            while True:
                data = ws.receive()
                if data is None:
                    break
                try:
                    payload = json.loads(data)
                    event_type = payload.get("type")
                    
                    if event_type == "message":
                        conv_id = payload.get("conversation_id")
                        content = payload.get("content")
                        msg_type = payload.get("msg_type", "text")
                        reply_to = payload.get("reply_to")
                        
                        if conv_id and content:
                            from bson.objectid import ObjectId
                            from datetime import datetime
                            
                            conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
                            if conv and user_id in conv.get("participants", []):
                                now_iso = datetime.utcnow().isoformat() + "Z"
                                new_msg = {
                                    "conversation_id": conv_id,
                                    "sender_id": user_id,
                                    "content": content,
                                    "type": msg_type,
                                    "reply_to": reply_to,
                                    "read_by": [user_id],
                                    "created_at": now_iso
                                }
                                res = db.messages.insert_one(new_msg)
                                new_msg["id"] = str(res.inserted_id)
                                new_msg.pop("_id")
                                
                                # Update conversation
                                db.conversations.update_one(
                                    {"_id": ObjectId(conv_id)},
                                    {"$set": {"last_message": new_msg, "updated_at": now_iso}}
                                )
                                
                                # Broadcast to participants
                                broadcast_payload = {"type": "new_message", "message": new_msg}
                                for p_id in conv.get("participants", []):
                                    manager.send_to(p_id, broadcast_payload)
                                    
                    elif event_type == "typing":
                        conv_id = payload.get("conversation_id")
                        is_typing = payload.get("isTyping", False)
                        if conv_id:
                            from bson.objectid import ObjectId
                            conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
                            if conv and user_id in conv.get("participants", []):
                                broadcast_payload = {"type": "typing", "conversation_id": conv_id, "user_id": user_id, "isTyping": is_typing}
                                for p_id in conv.get("participants", []):
                                    if p_id != user_id:
                                        manager.send_to(p_id, broadcast_payload)
                                        
                    elif event_type == "read":
                        conv_id = payload.get("conversation_id")
                        msg_ids = payload.get("message_ids", [])
                        if conv_id and msg_ids:
                            from bson.objectid import ObjectId
                            
                            # Convert string ids to ObjectIds
                            obj_ids = [ObjectId(mid) for mid in msg_ids if len(mid) == 24]
                            if obj_ids:
                                db.messages.update_many(
                                    {"_id": {"$in": obj_ids}, "conversation_id": conv_id},
                                    {"$addToSet": {"read_by": user_id}}
                                )
                                conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
                                if conv:
                                    broadcast_payload = {"type": "messages_read", "conversation_id": conv_id, "message_ids": msg_ids, "read_by": user_id}
                                    for p_id in conv.get("participants", []):
                                        manager.send_to(p_id, broadcast_payload)
                                        
                    elif event_type == "action":
                        action = payload.get("action")
                        msg_id = payload.get("message_id")
                        data_payload = payload.get("data")
                        
                        if msg_id:
                            from bson.objectid import ObjectId
                            msg = db.messages.find_one({"_id": ObjectId(msg_id)})
                            
                            if msg:
                                conv_id = msg.get("conversation_id")
                                conv = db.conversations.find_one({"_id": ObjectId(conv_id)})
                                
                                if conv and user_id in conv.get("participants", []):
                                    if action == "react":
                                        db.messages.update_one({"_id": ObjectId(msg_id)}, {"$set": {"reaction": data_payload}})
                                    elif action == "unsend" and msg.get("sender_id") == user_id:
                                        db.messages.update_one({"_id": ObjectId(msg_id)}, {"$set": {"content": "This message was unsent", "type": "unsent", "reaction": None}})
                                        
                                    # Broadcast updated message
                                    updated_msg = db.messages.find_one({"_id": ObjectId(msg_id)})
                                    updated_msg["id"] = str(updated_msg.pop("_id"))
                                    broadcast_payload = {"type": "message_updated", "message": updated_msg}
                                    for p_id in conv.get("participants", []):
                                        manager.send_to(p_id, broadcast_payload)
                                        
                except Exception as e:
                    print(f"WS Parse Error: {e}")
        except Exception:
            pass
        finally:
            manager.disconnect(user_id)
