import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models

db = SessionLocal()
try:
    messages = db.query(models.Message).all()
    print(f"Messages found: {len(messages)}")
    for m in messages:
        print(m.id, m.text, m.timestamp)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
