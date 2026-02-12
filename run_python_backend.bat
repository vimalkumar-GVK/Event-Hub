@echo off
echo Installing Python dependencies...
pip install -r backend/requirements.txt

echo.
echo Starting Python Backend Server...
cd backend
uvicorn main:app --reload
pause
