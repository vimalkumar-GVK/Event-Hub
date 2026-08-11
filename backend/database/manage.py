import os
import sys
import argparse
import datetime
from datetime import timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db
from app import auth

def seed_admin():
    db = get_db()
    if db is None:
        print("Database connection failed.")
        return
        
    try:
        INSTITUTIONS = [
            {
                "name": "Rathinam College of Arts and Science",
                "code": "RCAS",
                "city": "Coimbatore",
                "state": " ",
                "email": "info@rathinam.in"
            },
            {
                "name": "PSG College of Technology",
                "code": "PSGTECH",
                "city": "Coimbatore",
                "state": "Tamil Nadu",
                "email": "info@psgtech.edu"
            }
        ]

        inst_map = {}
        print("Seeding Institutions...")
        for data in INSTITUTIONS:
            inst = db.institutions.find_one({"code": data["code"]})
            if not inst:
                data["is_active"] = True
                data["created_at"] = datetime.datetime.utcnow()
                result = db.institutions.insert_one(data)
                inst_id = str(result.inserted_id)
                print(f"  Created Institution: {data['name']}")
            else:
                inst_id = str(inst["_id"])
                print(f"  Institution exists: {inst['name']}")
            inst_map[data["code"]] = inst_id

        USERS = [
            {
                "name": "Super Admin",
                "email": "super@smartcampus.edu",
                "password": "super123",
                "role": "super_admin",
                "institution_id": None,
                "phone_number": "9876543210"
            },
            {
                "name": "Rathinam SubAdmin",
                "email": "sub1@rathinam.edu",
                "password": "sub123",
                "role": "sub_admin",
                "institution_id": inst_map["RCAS"],
                "phone_number": "9876543212",
                "designation": "Event Manager"
            },
            {
                "name": "Rathinam Student 1",
                "email": "student1@rathinam.edu",
                "password": "user123",
                "role": "student",
                "institution_id": inst_map["RCAS"],
                "phone_number": "9876543213",
                "student_id": "RCAS001",
                "department": "Computer Science",
                "year_of_study": "3rd",
                "is_verified": True
            },
            {
                "name": "Rathinam Student 2",
                "email": "student2@rathinam.edu",
                "password": "user123",
                "role": "student",
                "institution_id": inst_map["RCAS"],
                "phone_number": "9876543214",
                "student_id": "RCAS002",
                "department": "Commerce",
                "year_of_study": "1st",
                "is_verified": False
            },
            {
                "name": "PSG Admin",
                "email": "admin2@psg.edu",
                "password": "admin123",
                "role": "admin",
                "institution_id": inst_map["PSGTECH"],
                "phone_number": "9876543221",
                "designation": "Principal"
            },
            {
                "name": "PSG SubAdmin",
                "email": "sub2@psg.edu",
                "password": "sub123",
                "role": "sub_admin",
                "institution_id": inst_map["PSGTECH"],
                "phone_number": "9876543222",
                "designation": "Dept Head"
            },
            {
                "name": "PSG Student 1",
                "email": "student1@psg.edu",
                "password": "user123",
                "role": "student",
                "institution_id": inst_map["PSGTECH"],
                "phone_number": "9876543223",
                "student_id": "PSG001",
                "department": "Mechanical",
                "year_of_study": "4th",
                "is_verified": True
            },
            {
                "name": "PSG Student 2",
                "email": "student2@psg.edu",
                "password": "user123",
                "role": "student",
                "institution_id": inst_map["PSGTECH"],
                "phone_number": "9876543224",
                "student_id": "PSG002",
                "department": "IT",
                "year_of_study": "2nd",
                "is_verified": False
            },
            {
                "name": "John Doe", 
                "email": "john@rathinamstudent.edu", 
                "password": "john123", 
                "role": "student", 
                "institution_id": inst_map["RCAS"], 
                "department": "CS",
                "is_verified": True
            }
        ]

        print("\nSeeding Users...")
        for data in USERS:
            password = data.pop("password")
            user = db.users.find_one({"email": data["email"]})
            if user:
                data["hashed_password"] = auth.hash_password(password)
                db.users.update_one({"_id": user["_id"]}, {"$set": data})
                print(f"  Updated User: {data['email']} ({data['role']})")
            else:
                data["hashed_password"] = auth.hash_password(password)
                data["created_at"] = datetime.datetime.utcnow()
                db.users.insert_one(data)
                print(f"  Created User: {data['email']} ({data['role']})")

        print("\nSeeding complete!\n")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback; traceback.print_exc()

def add_sample_data():
    db = get_db()
    if db is None:
        print("Database connection failed.")
        return
        
    try:
        user = db.users.find_one({"email": "john@rathinamstudent.edu"})
        if not user:
            print("User John Doe not found! Please run 'seed_admin' first.")
            return

        events = list(db.events.find().limit(3))
        if len(events) < 3:
            print("Not enough events to create sample registrations.")
            return

        for i in range(3):
            reg = {
                "user_id": str(user["_id"]),
                "event_id": str(events[i]["_id"]),
                "status": "approved",
                "attendance": "Present",
                "timestamp": datetime.datetime.utcnow() - timedelta(days=30*i)
            }
            db.registrations.insert_one(reg)
            
        print("Successfully added 3 sample 'Present' registrations for John Doe.")
    except Exception as e:
        print(f"Error: {e}")

def reset_users():
    db = get_db()
    if db is None:
        print("Database connection failed.")
        return
        
    try:
        # Delete all users and institutions
        result_users = db.users.delete_many({})
        result_inst = db.institutions.delete_many({})
        print(f"Deleted {result_users.deleted_count} users and {result_inst.deleted_count} institutions.")
        
        print("Re-seeding initial users...")
        seed_admin()
        
    except Exception as e:
        print(f"Error resetting users: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Database Management Script (MongoDB)")
    parser.add_argument("command", choices=[
        "seed_admin", 
        "add_sample_data", 
        "reset_users"
    ], help="The database operation to perform")
    
    args = parser.parse_args()
    
    if args.command == "seed_admin":
        seed_admin()
    elif args.command == "add_sample_data":
        add_sample_data()
    elif args.command == "reset_users":
        reset_users()
