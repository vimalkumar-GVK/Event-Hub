import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import base64
from concurrent.futures import ThreadPoolExecutor

# SMTP Configuration
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "dummy@example.com")
SMTP_PASS = os.environ.get("SMTP_PASS", "dummypassword")

# Use a thread pool for non-blocking email dispatch
email_executor = ThreadPoolExecutor(max_workers=5)

def send_certificate_email_sync(to_email, student_name, event_name, pdf_base64, certificate_id):
    """Synchronous function to send email."""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f"Your Certificate for {event_name} is Ready!"
        
        body = f"""
        Dear {student_name},
        
        Congratulations on your participation in {event_name}! 
        Attached is your official certificate (ID: {certificate_id}).
        
        You can verify this certificate at any time by scanning the QR code on the certificate.
        
        Best Regards,
        Event Management Team
        """
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach PDF
        if pdf_base64:
            b64_data = pdf_base64.split(',')[1] if ',' in pdf_base64 else pdf_base64
            pdf_bytes = base64.b64decode(b64_data)
            part = MIMEApplication(pdf_bytes, Name=f"{certificate_id}.pdf")
            part['Content-Disposition'] = f'attachment; filename="{certificate_id}.pdf"'
            msg.attach(part)
        
        # We wrap SMTP connection in try-except. Since we may not have valid credentials,
        # we will print a message instead of failing completely for development.
        print(f"[EmailService] Pretending to send email to {to_email} (SMTP server not fully configured for dev)")
        # server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        # server.starttls()
        # server.login(SMTP_USER, SMTP_PASS)
        # server.send_message(msg)
        # server.quit()
        return True
    except Exception as e:
        print(f"[EmailService] Failed to construct email to {to_email}: {e}")
        return False

def send_certificate_email_async(to_email, student_name, event_name, pdf_base64, certificate_id):
    """Queues email for asynchronous sending."""
    email_executor.submit(send_certificate_email_sync, to_email, student_name, event_name, pdf_base64, certificate_id)
