from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_users():
    db = SessionLocal()
    try:
        # 1. Seed Admin
        admin_email = "admin@smartcampus.edu"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if admin:
            print(f"Admin already exists: {admin_email}")
            admin.password = "admin123"
        else:
            new_admin = models.User(
                name="System Admin",
                email=admin_email,
                password="admin123",
                role="admin",
                college="Smart Campus University",
                department="Administration"
            )
            db.add(new_admin)
            print(f"Admin created: {admin_email}")

        # 2. Seed Super Admin
        super_email = "super@smartcampus.edu"
        super_admin = db.query(models.User).filter(models.User.email == super_email).first()
        
        if super_admin:
            print(f"Super Admin already exists: {super_email}")
            super_admin.password = "super123"
        else:
            new_super = models.User(
                name="Super Admin",
                email=super_email,
                password="super123",
                role="super",
                college="Smart Campus HQ",
                department="Management"
            )
            db.add(new_super)
            print(f"Super Admin created: {super_email}")

        db.commit()
        print("\nSeeding complete!")
        print(f"Admin: {admin_email} / admin123")
        print(f"Super: {super_email} / super123")
    except Exception as e:
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
