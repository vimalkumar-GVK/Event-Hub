import sys
import os

# Add the backend directory to the Python path so absolute imports work
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.append(backend_dir)

# Vercel needs the application exposed. Usually for WSGI it is named 'app'.
from app import app  # type: ignore
