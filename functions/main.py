from fastapi import FastAPI, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
try:
    from .database import get_db, engine, Base
    from . import models, schemas
except (ImportError, ValueError):
    from database import get_db, engine, Base
    import models, schemas
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mangum import Mangum
import os
import datetime

# --- HELPERS ---
def parse_date(d_val):
    if not d_val: return None
    if isinstance(d_val, datetime.date): return d_val
    try: return datetime.datetime.strptime(str(d_val), "%Y-%m-%d").date()
    except: return None

def parse_time(t_val):
    if not t_val: return None
    if isinstance(t_val, datetime.time): return t_val
    try: return datetime.datetime.strptime(str(t_val), "%H:%M").time()
    except:
        try: return datetime.datetime.strptime(str(t_val), "%H:%M:%S").time()
        except: return None

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Serving Frontend Static Files
# Assuming this file is in functions/ directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
# We moved static files to 'public' for Netlify
STATIC_DIR = os.path.join(PARENT_DIR, "public")

# Mount CSS, JS, and Assets folders
if os.path.exists(os.path.join(STATIC_DIR, "css")):
    app.mount("/css", StaticFiles(directory=os.path.join(STATIC_DIR, "css")), name="css")
if os.path.exists(os.path.join(STATIC_DIR, "js")):
    app.mount("/js", StaticFiles(directory=os.path.join(STATIC_DIR, "js")), name="js")
if os.path.exists(os.path.join(STATIC_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

@app.get("/")
async def read_index():
    # Primary for local development
    index_path = os.path.join(STATIC_DIR, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Smart Campus API is Running. Frontend not found in functions context."}

# --- ROUTES ---

# 1. AUTHENTICATION & USERS
@app.post("/api/login", response_model=schemas.UserResponse)
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_login.email, models.User.password == user_login.password).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Update last login
    user.last_login = datetime.datetime.utcnow().date()
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    user_exists = db.query(models.User).filter(models.User.email == user.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserBase, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

@app.put("/api/users/{user_id}/password")
def update_password(user_id: int, current_password: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.password != current_password:
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    user.password = new_password
    db.commit()
    return {"message": "Password updated successfully"}

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# 2. EVENTS
@app.get("/api/events", response_model=List[schemas.EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.created_at.desc()).all()

@app.post("/api/events", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    try:
        # Extract event data excluding sub_events
        event_dict = event.dict(exclude={"sub_events"})
        
        # Parse Dates/Times
        event_dict['date'] = parse_date(event_dict.get('date'))
        event_dict['time'] = parse_time(event_dict.get('time'))
        
        # Create Main Event
        db_event = models.Event(**event_dict)
        db.add(db_event)
        db.commit()
        db.refresh(db_event)

        # Create Sub Events
        if event.sub_events:
            for sub in event.sub_events:
                sub_dict = sub.dict()
                sub_dict['event_id'] = db_event.id
                sub_dict['start_time'] = parse_time(sub_dict.get('start_time'))
                sub_dict['end_time'] = parse_time(sub_dict.get('end_time'))
                db_sub = models.SubEvent(**sub_dict)
                db.add(db_sub)
        
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/events/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)):
    try:
        db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not db_event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update Main Event (excluding sub_events)
        event_dict = event.dict(exclude={"sub_events"})
        
        # Parse Dates/Times
        event_dict['date'] = parse_date(event_dict.get('date'))
        event_dict['time'] = parse_time(event_dict.get('time'))

        for key, value in event_dict.items():
            setattr(db_event, key, value)

        # Handle Sub Events: Clear old ones and add new ones
        db.query(models.SubEvent).filter(models.SubEvent.event_id == event_id).delete()
        
        if event.sub_events:
            for sub in event.sub_events:
                sub_dict = sub.dict()
                sub_dict['event_id'] = event_id
                sub_dict['start_time'] = parse_time(sub_dict.get('start_time'))
                sub_dict['end_time'] = parse_time(sub_dict.get('end_time'))
                db_sub = models.SubEvent(**sub_dict)
                db.add(db_sub)

        db.commit()
        db.refresh(db_event)
        return db_event
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}

# 3. REGISTRATIONS
@app.get("/api/registrations/id/{reg_id}", response_model=schemas.RegistrationResponse)
def get_registration_by_id(reg_id: int, db: Session = Depends(get_db)):
    reg = db.query(models.Registration).filter(models.Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    return reg

@app.get("/api/registrations", response_model=List[schemas.RegistrationResponse])
def get_registrations(db: Session = Depends(get_db)):
    return db.query(models.Registration).order_by(models.Registration.timestamp.desc()).all()

@app.get("/api/registrations/{user_id}", response_model=List[schemas.RegistrationResponse])
def get_user_registrations(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Registration).filter(models.Registration.user_id == user_id).order_by(models.Registration.timestamp.desc()).all()

@app.post("/api/registrations", response_model=schemas.RegistrationResponse)
def create_registration(reg: schemas.RegistrationCreate, db: Session = Depends(get_db)):
    existing_reg = db.query(models.Registration).filter(
        models.Registration.user_id == reg.user_id,
        models.Registration.event_id == reg.event_id,
        models.Registration.sub_event_id == reg.sub_event_id
    ).first()
    
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already registered")
    
    new_reg = models.Registration(**reg.dict())
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg

@app.put("/api/registrations/{reg_id}/status", response_model=schemas.RegistrationResponse)
def update_registration_status(reg_id: int, status: str = Body(..., embed=True), db: Session = Depends(get_db)):
    reg = db.query(models.Registration).filter(models.Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    reg.status = status
    db.commit()
    db.refresh(reg)
    return reg

@app.delete("/api/registrations/{reg_id}")
def delete_registration(reg_id: int, db: Session = Depends(get_db)):
    reg = db.query(models.Registration).filter(models.Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    db.delete(reg)
    db.commit()
    return {"message": "Registration deleted successfully"}

@app.put("/api/registrations/{reg_id}/attendance", response_model=schemas.RegistrationResponse)
def update_attendance(reg_id: int, attendance: str = Body(...), certificate_url: Optional[str] = Body(None), certificate_type: Optional[str] = Body(None), db: Session = Depends(get_db)):
    reg = db.query(models.Registration).filter(models.Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    reg.attendance = attendance
    
    # Auto-generate simulated certificate link if marked Present
    if attendance == 'Present':
        if not reg.certificate_url:
            reg.certificate_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-{reg.id}"
            reg.certificate_type = "Participation"
            
    if certificate_url:
        reg.certificate_url = certificate_url
        reg.certificate_type = certificate_type
    
    db.commit()
    db.refresh(reg)
    return reg

@app.post("/api/attendance/self-mark", response_model=schemas.RegistrationResponse)
def self_mark_attendance(user_id: int = Body(...), event_id: int = Body(...), attendance_code: str = Body(...), db: Session = Depends(get_db)):
    # Verify event code
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.attendance_code and event.attendance_code != attendance_code:
        raise HTTPException(status_code=400, detail="Invalid attendance code")
    
    # Find registration
    reg = db.query(models.Registration).filter(
        models.Registration.user_id == user_id, 
        models.Registration.event_id == event_id
    ).first()
    
    if not reg:
        raise HTTPException(status_code=404, detail="You are not registered for this event")
    
    reg.attendance = "Present"
    if not reg.certificate_url:
        reg.certificate_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-{reg.id}"
        reg.certificate_type = "Participation"
        
    db.commit()
    db.refresh(reg)
    return reg

# 4. MESSAGES
@app.get("/api/messages", response_model=List[schemas.MessageResponse])
def get_messages(db: Session = Depends(get_db)):
    return db.query(models.Message).order_by(models.Message.timestamp.asc()).all()

@app.post("/api/messages", response_model=schemas.MessageResponse)
def create_message(msg: schemas.MessageCreate, db: Session = Depends(get_db)):
    new_msg = models.Message(**msg.dict())
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# 5. NOTIFICATIONS
@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).order_by(models.Notification.timestamp.desc()).all()

@app.post("/api/notifications", response_model=schemas.NotificationResponse)
def create_notification(notif: schemas.NotificationCreate, db: Session = Depends(get_db)):
    new_notif = models.Notification(**notif.dict())
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif

@app.put("/api/notifications/read")
def mark_notifications_as_read(role: str = Body(..., embed=True), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.role == role).update({models.Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "Notifications marked as read"}

@app.delete("/api/notifications")
def clear_notifications(role: str = Body(..., embed=True), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.role == role).delete(synchronize_session=False)
    db.commit()
    return {"message": "Notifications cleared"}

# 6. SYSTEM STATS (SUPER ADMIN)
@app.get("/api/system/stats", response_model=schemas.SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_admins = db.query(models.User).filter(models.User.role == 'admin').count()
    total_active_admins = db.query(models.User).filter(models.User.role == 'admin', models.User.is_active == True).count()
    total_students = db.query(models.User).filter(models.User.role == 'student').count()
    total_events = db.query(models.Event).count()
    total_registrations = db.query(models.Registration).count()
    recent_activity = db.query(models.Notification).order_by(models.Notification.timestamp.desc()).limit(10).all()

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_active_admins": total_active_admins,
        "total_students": total_students,
        "total_events": total_events,
        "total_registrations": total_registrations,
        "recent_activity": recent_activity
    }

@app.post("/api/system/announce")
def create_system_announcement(text: str = Body(..., embed=True), db: Session = Depends(get_db)):
    new_notif = models.Notification(
        text=text,
        type='announcement',
        role='all',
        sender_name='Super Admin'
    )
    db.add(new_notif)
    db.commit()
    return {"message": "Announcement sent to all users"}

# Handler for Netlify/Lambda
handler = Mangum(app)
