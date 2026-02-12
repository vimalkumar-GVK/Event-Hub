from sqlalchemy import Column, Integer, String, Boolean, Text, Date, Time, DateTime, DECIMAL, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

# --- USER ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum('student', 'admin', 'super', name='user_roles'), default='student')
    department = Column(String, nullable=True)
    year = Column(String, nullable=True)
    college = Column(String, nullable=True)
    profile_pic = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(Date, nullable=True)
    theme = Column(String, default='light')

    # Relationships
    registrations = relationship("Registration", back_populates="user")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiver_id")
    created_events = relationship("Event", back_populates="admin")

    created_at = Column(Date, default=datetime.datetime.utcnow)


# --- EVENT ---
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    venue = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    type = Column(String, nullable=True)  # Academic, Cultural, etc.
    image = Column(Text, nullable=True)
    status = Column(String, default="published")
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rules_pdf_url = Column(Text, nullable=True)
    payment_qr_url = Column(Text, nullable=True)
    attendance_code = Column(String, nullable=True) # For student-self-scan

    # Relationships
    admin = relationship("User", back_populates="created_events")
    sub_events = relationship("SubEvent", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SubEvent(Base):
    __tablename__ = "sub_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    venue = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    is_paid = Column(Boolean, default=False)
    amount = Column(DECIMAL(10, 2), default=0.00)
    department = Column(String, nullable=True)
    fee_type = Column(String, default='per_person')
    team_size = Column(Integer, default=1)

    # Relationships
    event = relationship("Event", back_populates="sub_events")
    registrations = relationship("Registration", back_populates="sub_event")


# --- REGISTRATION ---
class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    sub_event_id = Column(Integer, ForeignKey("sub_events.id"), nullable=True)
    
    status = Column(Enum('pending', 'approved', 'rejected', name='reg_status'), default='pending')
    payment_screenshot = Column(Text, nullable=True)
    college_name = Column(String, nullable=True)
    attendance = Column(String, default="Absent") # 'Present', 'Absent'
    certificate_url = Column(Text, nullable=True)
    certificate_type = Column(String, default="Participation")

    # Relationships
    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    sub_event = relationship("SubEvent", back_populates="registrations")

    timestamp = Column(Date, default=datetime.datetime.utcnow)


# --- MESSAGE ---
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=True)
    attachment = Column(JSON, nullable=True)

    # Relationships
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    receiver = relationship("User", back_populates="received_messages", foreign_keys=[receiver_id])

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


# --- NOTIFICATION ---
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    type = Column(String, default="info")
    role = Column(String, default="all") # 'student', 'admin', 'all'
    sender_name = Column(String, default="System")
    is_read = Column(Boolean, default=False)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
