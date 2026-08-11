import re
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Any
from datetime import date, time

# --- HELPERS ---
def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'[0-9]', password):
        raise ValueError("Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain at least one special character")
    return password

def validate_base64_media(media_data: Optional[str]) -> Optional[str]:
    if not media_data:
        return media_data
    # Limit base64 payload to ~15MB (15MB * 4/3 is approx 20M chars - Mongo limit is 16MB)
    if len(media_data) > 20_000_000:
        raise ValueError("Media payload too large (max 15MB)")
    if media_data.startswith("data:") and not re.match(r'^data:(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|ogg));base64,', media_data):
        raise ValueError("Invalid media format. Only JPEG, PNG, GIF, WebP, MP4, WebM, and OGG allowed.")
    return media_data

def validate_base64_image(image_data: Optional[str]) -> Optional[str]:
    if not image_data:
        return image_data
    # Limit base64 payload to ~5MB (Length * 3 / 4)
    # 5MB * 4/3 is approx 6.6M chars
    if len(image_data) > 7_000_000:
        raise ValueError("Image payload too large (max 5MB)")
    if image_data.startswith("data:") and not re.match(r'^data:image\/(jpeg|jpg|png|gif|webp);base64,', image_data):
        raise ValueError("Invalid image format. Only JPEG, PNG, GIF, and WebP allowed.")
    return image_data

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: 'UserResponse'

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    
    @validator("new_password")
    def password_complexity(cls, v):
        return validate_password_strength(v)

# --- INSTITUTION ---
class InstitutionBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    code: str = Field(..., min_length=2, max_length=15)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True
    
    @validator("logo_url")
    def validate_logo(cls, v):
        return validate_base64_image(v)

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: int
    created_at: Any

    class Config:
        from_attributes = True

# --- USER ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str
    role: str = 'student'
    institution_id: Optional[int] = None
    phone_number: Optional[str] = None
    profile_photo: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    student_id: Optional[str] = None
    year_of_study: Optional[str] = None
    is_verified: Optional[bool] = False
    verification_note: Optional[str] = None
    
    # Legacy fields (optional support)
    department_old: Optional[str] = None
    year: Optional[str] = None
    college: Optional[str] = None
    profile_pic: Optional[str] = None
    
    is_active: Optional[bool] = True
    theme: Optional[str] = 'light'
    hide_phone: Optional[bool] = False
    
    @validator("profile_photo", "profile_pic")
    def validate_photo(cls, v):
        return validate_base64_image(v)

class UserCreate(UserBase):
    password: str
    
    @validator("password")
    def password_complexity(cls, v):
        return validate_password_strength(v)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: Optional[Any] = None
    last_login: Optional[Any] = None
    institution: Optional[InstitutionResponse] = None

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
    amount: Optional[float] = 0.00
    department: Optional[str] = None
    fee_type: Optional[str] = 'per_person'
    team_size: Optional[int] = 1
    poster_url: Optional[str] = None

class SubEventCreate(BaseModel):
    name: str
    start_time: Optional[str] = None 
    end_time: Optional[str] = None
    venue: Optional[str] = None
    capacity: Optional[int] = 50
    is_paid: bool = False
    amount: float = 0.00
    department: Optional[str] = None
    fee_type: Optional[str] = 'per_person'
    team_size: Optional[int] = 1
    poster_url: Optional[str] = None

class SubEventResponse(SubEventBase):
    id: int

    class Config:
        from_attributes = True

# --- EVENT ---
class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    date: Optional[Any] = None 
    time: Optional[Any] = None 
    venue: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[str] = None
    image: Optional[str] = None
    status: str = 'published'
    admin_id: Optional[int] = None
    
    institution_id: Optional[int] = None
    created_by_institution: Optional[str] = None
    
    rules_pdf_url: Optional[str] = None
    payment_qr_url: Optional[str] = None
    attendance_code: Optional[str] = None
    is_story: bool = False
    featured: bool = False
    
    @validator("image", "payment_qr_url")
    def validate_event_images(cls, v):
        return validate_base64_image(v)

class EventCreate(EventBase):
    sub_events: List[SubEventCreate] = []

class EventResponse(EventBase):
    id: int
    admin_id: Optional[int] = None
    sub_events: List[SubEventResponse] = []
    created_at: Optional[Any] = None
    date: Optional[Any] = None
    time: Optional[Any] = None
    # Approval workflow fields
    created_by: Optional[int] = None
    created_by_role: Optional[str] = None
    approval_status: Optional[str] = 'approved'
    
    class Config:
        from_attributes = True

# --- REGISTRATION ---
class RegistrationBase(BaseModel):
    user_id: int
    event_id: int
    sub_event_id: Optional[int] = None
    payment_screenshot: Optional[str] = None
    payment_upi_id: Optional[str] = None
    college_name: Optional[str] = None
    status: str = 'pending_home'
    attendance: str = 'Absent'
    certificate_url: Optional[str] = None
    certificate_type: str = 'Participation'
    
    @validator("payment_screenshot")
    def validate_screenshot(cls, v):
        return validate_base64_image(v)

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationResponse(RegistrationBase):
    id: int
    timestamp: Optional[date] = None
    
    class Config:
        from_attributes = True

# --- MESSAGE ---
class MessageBase(BaseModel):
    text: Optional[str] = Field(None, max_length=2000)
    sender_id: int
    receiver_id: int
    attachment: Optional[Any] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    timestamp: Any

    class Config:
        from_attributes = True

# --- NOTIFICATION ---
class NotificationBase(BaseModel):
    text: str = Field(..., max_length=1000)
    type: str = 'info'
    role: str = 'all'
    sender_name: str = 'System'
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    timestamp: Any

    class Config:
        from_attributes = True

class SystemStats(BaseModel):
    total_users: int
    total_admins: int
    total_active_admins: int
    total_students: int
    total_events: int
    total_registrations: int
    total_institutions: int
    recent_activity: List[NotificationResponse]

# --- STORY ---
class StoryBase(BaseModel):
    media: str
    user_id: Optional[int] = None

class StoryCreate(StoryBase):
    pass

class StoryResponse(StoryBase):
    id: int
    username: str
    user_image: Optional[str] = None
    created_at: Any
    expires_at: Any

    class Config:
        from_attributes = True

# --- POST ---
class PostBase(BaseModel):
    caption: Optional[str] = None
    media: Optional[str] = None
    user_id: Optional[int] = None

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    username: str
    user_image: Optional[str] = None
    created_at: Any
    likes: int = 0
    comments: int = 0

    class Config:
        from_attributes = True

# --- CERTIFICATES ---
class CertificateField(BaseModel):
    id: str
    type: str
    x: float
    y: float
    font_size: int = 24
    color: str = '#000000'
    font_family: str = 'Helvetica'
    value: Optional[str] = None

class CertificateTemplateBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    category: str = 'Participation'
    background_image_url: str
    is_active: bool = True
    fields: List[CertificateField] = []

class CertificateTemplateCreate(CertificateTemplateBase):
    pass

class CertificateTemplateResponse(CertificateTemplateBase):
    id: str
    version: int
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True

class CertificateBase(BaseModel):
    student_id: int
    event_id: int
    template_id: str
    template_version: int
    type: str = 'Participation'
    status: str = 'Generated'
    pdf_url: str
    cryptographic_hash: str
    revocation_reason: Optional[str] = None

class CertificateCreate(CertificateBase):
    pass

class CertificateResponse(CertificateBase):
    id: str
    certificate_id: str
    issued_at: Any

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    user_id: int
    role: str
    action: str
    entity_id: str
    ip_address: Optional[str] = None
    details: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: Any

    class Config:
        from_attributes = True

LoginResponse.update_forward_refs()
