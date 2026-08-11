import os
import io
import hashlib
import qrcode
from datetime import datetime
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.utils import ImageReader
import base64
import urllib.parse

SECRET_KEY = os.environ.get("SECRET_KEY", "super_secret_certificate_key")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

def generate_crypto_hash(certificate_id, student_id, event_id):
    data = f"{certificate_id}-{student_id}-{event_id}-{SECRET_KEY}"
    return hashlib.sha256(data.encode()).hexdigest()

def get_image_from_base64(b64_string):
    if b64_string.startswith('data:image'):
        b64_string = b64_string.split(',')[1]
    image_data = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(image_data))

def get_image_reader(image_url):
    if not image_url:
        return None
    if image_url.startswith('data:image'):
        return ImageReader(get_image_from_base64(image_url))
    elif '/uploads/' in image_url:
        # Extract relative path from URL
        path = urllib.parse.urlparse(image_url).path
        # e.g., /uploads/templates/filename.png -> backend/uploads/templates/filename.png
        local_path = path.lstrip('/')
        if os.path.exists(local_path):
            return ImageReader(Image.open(local_path))
    return None

def create_certificate_pdf(template_data, student_data, event_data, certificate_id, issue_date, cert_type="Participation"):
    """
    Generates a PDF certificate based on template configuration.
    Returns: (pdf_base64, crypto_hash)
    """
    crypto_hash = generate_crypto_hash(certificate_id, student_data.get('id', 'unknown'), event_data.get('id', 'unknown'))
    verify_url = f"{FRONTEND_URL}/verify-certificate/{crypto_hash}"
    
    # Generate QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    # Draw Background
    try:
        bg_reader = get_image_reader(template_data.get('background_image_url'))
        if bg_reader:
            c.drawImage(bg_reader, 0, 0, width=width, height=height)
    except Exception as e:
        print(f"Error loading background image: {e}")
    
    # Draw Fields
    for field in template_data.get('fields', []):
        f_type = field.get('type')
        x_pct = field.get('x', 50) / 100.0
        y_pct = field.get('y', 50) / 100.0
        
        # PDF coordinates are bottom-left origin
        pdf_x = x_pct * width
        pdf_y = height - (y_pct * height)
        
        rotation = field.get('rotation', 0)
        
        c.saveState()
        c.translate(pdf_x, pdf_y)
        if rotation != 0:
            c.rotate(-rotation) # negative because reportlab rotates counter-clockwise
            
        c.setFillColor(field.get('color', '#000000'))
        
        # We don't have bold variants natively in reportlab without registering TTF, 
        # so we'll just use Helvetica-Bold if font_weight > 400
        font_name = field.get('font_family', 'Helvetica')
        font_weight = field.get('font_weight', 'normal')
        if font_weight in ['bold', '700', 700, '800', 800, '900', 900]:
            if font_name == 'Helvetica': font_name = 'Helvetica-Bold'
            elif font_name == 'Times-Roman': font_name = 'Times-Bold'
            elif font_name == 'Courier': font_name = 'Courier-Bold'
        
        c.setFont(font_name, field.get('font_size', 24))
        
        align = field.get('align', 'center')
        
        text = ""
        is_image = False
        
        if f_type == 'StudentName':
            text = student_data.get('name', 'Student Name')
        elif f_type == 'EventName':
            text = event_data.get('title', 'Event Name')
        elif f_type == 'Date' or f_type == 'IssueDate':
            text = str(issue_date)
        elif f_type == 'EventDate':
            text = event_data.get('date', 'Event Date')
        elif f_type == 'CertificateID':
            text = certificate_id
        elif f_type == 'CustomText':
            text = field.get('value', '')
        elif f_type == 'Rank':
            text = cert_type
        elif f_type == 'Achievement':
            text = cert_type
        elif f_type == 'Department':
            text = student_data.get('department', 'Department')
        elif f_type == 'College':
            text = student_data.get('college', 'College')
        elif f_type == 'OrganizerName':
            text = event_data.get('organizer', 'Organizer')
        elif f_type == 'QRCode':
            is_image = True
            qr_reader = ImageReader(qr_img)
            # Default QR size 100
            qr_w = field.get('width', 100)
            qr_h = field.get('height', 100)
            c.drawImage(qr_reader, -(qr_w/2), -(qr_h/2), width=qr_w, height=qr_h)
        elif f_type in ['Signature', 'Logo', 'Image']:
            is_image = True
            img_val = field.get('value')
            if img_val:
                try:
                    img_reader = get_image_reader(img_val)
                    if img_reader:
                        img_w = field.get('width', 150)
                        img_h = field.get('height', 50)
                        c.drawImage(img_reader, -(img_w/2), -(img_h/2), width=img_w, height=img_h, mask='auto')
                except Exception as e:
                    print(f"Error drawing image field: {e}")

        if not is_image and text:
            text_transform = field.get('text_transform', 'none')
            if text_transform == 'uppercase':
                text = text.upper()
            elif text_transform == 'lowercase':
                text = text.lower()
                
            if align == 'center':
                c.drawCentredString(0, 0, text)
            elif align == 'right':
                c.drawRightString(0, 0, text)
            else:
                c.drawString(0, 0, text)
                
        c.restoreState()
    
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    pdf_base64 = "data:application/pdf;base64," + base64.b64encode(pdf_bytes).decode('utf-8')
    return pdf_base64, crypto_hash
