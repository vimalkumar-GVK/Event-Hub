@echo off
echo Installing Python dependencies...
pip install -r backend/requirements.txt

echo.
echo Starting Python Flask Backend Server...
cd backend
python -m app.main
pause
