from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import date, time

# --- SHARED ---

# --- USER ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str = 'student'
    department: Optional[str] = None
    year: Optional[str] = None
    college: Optional[str] = None
    profile_pic: Optional[str] = None
    is_active: bool = True
    theme: str = 'light'

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: date
    last_login: Optional[date] = None

    class Config:
        from_attributes = True

# --- SUB EVENT ---
class SubEventBase(BaseModel):
    event_id: Optional[int] = None
    name: str
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    is_paid: bool = False
    amount: float = 0.00
    department: Optional[str] = None
    fee_type: Optional[str] = 'per_person'
    team_size: Optional[int] = 1

class SubEventCreate(BaseModel):
    name: str
    start_time: Optional[str] = None  # Accept as string for flexibility
    end_time: Optional[str] = None
    venue: Optional[str] = None
    capacity: Optional[int] = 50
    is_paid: bool = False
    amount: float = 0.00
    department: Optional[str] = None
    fee_type: Optional[str] = 'per_person'
    team_size: Optional[int] = 1

class SubEventResponse(SubEventBase):
    id: int

    class Config:
        from_attributes = True

# --- EVENT ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[Any] = None  # Accept as string or date object
    time: Optional[Any] = None  # Accept as string or time object
    venue: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[str] = None
    image: Optional[str] = None
    status: str = 'published'
    admin_id: Optional[int] = None
    rules_pdf_url: Optional[str] = None
    payment_qr_url: Optional[str] = None
    attendance_code: Optional[str] = None

class EventCreate(EventBase):
    sub_events: List[SubEventCreate] = []

class EventResponse(EventBase):
    id: int
    admin_id: Optional[int] = None
    sub_events: List[SubEventResponse] = []
    created_at: Optional[Any] = None
    date: Optional[Any] = None
    time: Optional[Any] = None

    class Config:
        from_attributes = True

# --- REGISTRATION ---
class RegistrationBase(BaseModel):
    user_id: int
    event_id: int
    sub_event_id: Optional[int] = None
    payment_screenshot: Optional[str] = None
    college_name: Optional[str] = None
    status: str = 'pending'
    attendance: str = 'Absent'
    certificate_url: Optional[str] = None
    certificate_type: str = 'Participation'

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationResponse(RegistrationBase):
    id: int
    timestamp: date
    
    class Config:
        from_attributes = True

# --- MESSAGE ---
class MessageBase(BaseModel):
    text: Optional[str] = None
    sender_id: int
    receiver_id: int
    attachment: Optional[Any] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    timestamp: date

    class Config:
        from_attributes = True

# --- NOTIFICATION ---
class NotificationBase(BaseModel):
    text: str
    type: str = 'info'
    role: str = 'all'
    sender_name: str = 'System'
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    timestamp: date

    class Config:
        from_attributes = True

# --- SYSTEM STATS ---
class SystemStats(BaseModel):
    total_users: int
    total_admins: int
    total_active_admins: int
    total_students: int
    total_events: int
    total_registrations: int
    recent_activity: List[NotificationResponse]
