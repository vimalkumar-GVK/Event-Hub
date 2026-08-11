from concurrent.futures import ThreadPoolExecutor
from .certificate_engine import create_certificate_pdf
from .email_service import send_certificate_email_async
from database.connection import get_db
from datetime import datetime
import uuid

# Pool for bulk certificate processing
bg_executor = ThreadPoolExecutor(max_workers=3)

def generate_certificates_bulk(event_id, template_id, winners_data):
    """
    Background job to generate certificates for all attendees of an event.
    winners_data: dict mapping student_id -> 'Winner', 'Runner-Up', 'Third Prize'
    """
    try:
        db = get_db()
        # Fetch template
        template = db.certificate_templates.find_one({"id": template_id})
        if not template:
            print(f"[BG Job] Template {template_id} not found.")
            return

        # Fetch event
        event = db.events.find_one({"id": event_id})
        if not event:
            print(f"[BG Job] Event {event_id} not found.")
            return

        # Fetch all attendees who are marked 'Present'
        registrations = list(db.registrations.find({"event_id": event_id, "attendance": "Present"}))
        
        for reg in registrations:
            student_id = reg.get("user_id")
            student = db.users.find_one({"id": student_id})
            if not student:
                continue
                
            # Determine type
            cert_type = winners_data.get(str(student_id), 'Participation')
            
            # Check if certificate already exists
            existing_cert = db.certificates.find_one({"student_id": student_id, "event_id": event_id})
            if existing_cert:
                print(f"[BG Job] Certificate already exists for student {student_id}")
                continue
            
            # Generate ID
            cert_id = f"CERT-{event_id}-{student_id}-{uuid.uuid4().hex[:6].upper()}"
            issue_date = datetime.now().strftime("%Y-%m-%d")
            
            # Create PDF
            pdf_b64, crypto_hash = create_certificate_pdf(template, student, event, cert_id, issue_date, cert_type)
            
            # Save to DB
            cert_doc = {
                "id": cert_id,
                "certificate_id": cert_id,
                "student_id": student_id,
                "event_id": event_id,
                "template_id": template_id,
                "template_version": template.get("version", 1),
                "type": cert_type,
                "status": "Generated",
                "pdf_url": pdf_b64,
                "cryptographic_hash": crypto_hash,
                "issued_at": datetime.now()
            }
            db.certificates.insert_one(cert_doc)
            
            # Send Email Asynchronously
            send_certificate_email_async(
                to_email=student.get("email"),
                student_name=student.get("name"),
                event_name=event.get("title"),
                pdf_base64=pdf_b64,
                certificate_id=cert_id
            )
            
            # Update Registration Status
            db.registrations.update_one(
                {"_id": reg["_id"]},
                {"$set": {"certificate_url": cert_id, "certificate_type": cert_type}}
            )
            
        print(f"[BG Job] Bulk generation completed for event {event_id}")
    except Exception as e:
        print(f"[BG Job] Bulk generation failed for event {event_id}: {e}")

def trigger_bulk_generation(event_id, template_id, winners_data):
    bg_executor.submit(generate_certificates_bulk, event_id, template_id, winners_data)
