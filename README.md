# Smart Campus Event Management System

A centralized digital solution for managing campus events end-to-end. This application features a modern Single Page Application (SPA) frontend built with vanilla JavaScript and a robust Python FastAPI backend.

## 🎯 Features

### 🌟 Public Website
- Modern, responsive landing page
- Upcoming events preview
- Smooth scrolling and glassmorphism design

### 🎓 Student Portal
- **Dashboard**: Overview of your activity with stats and notifications
- **Browse Events**: View and register for upcoming events with sub-events
- **My Registrations**: Track registration status (Pending/Approved/Rejected)
- **QR Codes**: Generate attendance QR codes for approved registrations
- **Certificates**: Download certificates after event completion
- **Campus Chat**: Communicate with admins
- **Profile**: Manage your student details and theme preferences

### 🛡️ Admin Portal
- **Dashboard**: Analytics on events, registrations, and system activity
- **Event Management**: Create, edit, and delete events with sub-events
- **Registration Management**: Approve or reject student registration requests
- **Attendance Tracking**: QR code scanner for marking attendance
- **Certificate Upload**: Issue certificates to participants
- **Campus Chat**: Communicate with students
- **Notifications**: Real-time updates on system activities

### 👑 Super Admin Portal
- **User Management**: Add, view, and delete users (admins and students)
- **System Statistics**: Overview of total users, events, and registrations
- **System Announcements**: Send notifications to all users
- **Settings**: Manage profile and theme preferences

## 🚀 Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** - Zero framework dependencies
- **Single Page Application (SPA)** - Fast and responsive
- **Font Awesome** - Icon library
- **Google Fonts (Outfit)** - Modern typography
- **QR Code Libraries** - html5-qrcode, qrcode.js

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Production database (SQLite for development)
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

## 📋 Prerequisites

- **Python 3.8 or higher**
- **pip** (Python package manager)
- **PostgreSQL** (for production) or SQLite (for development)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
cd smart-campus-events
```

### 2. Set Up Python Backend

#### Install Dependencies
```bash
sudo apt update
sudo apt install python3-pip python3-venv

cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=sqlite:///./test.db
# For PostgreSQL in production:
# DATABASE_URL=postgresql://user:password@localhost/dbname
```

#### Initialize Database
```bash
# Run migrations (if needed)
python migrate_db.py

# Seed admin users
python seed_admin.py
```

### 3. Run the Application

#### Start the Backend Server
```bash
# From the backend directory
python main.py

# Or use uvicorn directly
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

#### Access the Application
Open your browser and navigate to:
```
http://localhost:8000
```

The FastAPI backend serves both the API and the frontend static files.

## 🔐 Default Credentials

### Super Admin
- **Email**: `super@smartcampus.edu`
- **Password**: `super123`

### Admin
- **Email**: `admin@smartcampus.edu`
- **Password**: `admin123`

### Student
- **Email**: `john@student.edu`
- **Password**: `user`

> **Note**: Change these credentials in production!

## 📁 Project Structure

```
smart-campus-events/
├── backend/          # Python FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic schemas for validation
│   ├── database.py         # Database configuration
│   ├── requirements.txt    # Python dependencies
│   ├── seed_admin.py       # Script to create admin users
│   └── test.db             # SQLite database (development)
├── js/
│   ├── app.js              # Main application logic (SPA)
│   └── data.js             # API client and data layer
├── css/
│   ├── styles.css          # Main stylesheet
│   └── ott-styles.css      # Additional styles
├── index.html              # Application entry point
├── .analysis/              # Documentation and analysis
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Users
- `GET /api/users` - List all users
- `PUT /api/users/{id}` - Update user
- `PUT /api/users/{id}/password` - Change password
- `DELETE /api/users/{id}` - Delete user

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

### Registrations
- `GET /api/registrations` - List all registrations
- `POST /api/registrations` - Create registration
- `PUT /api/registrations/{id}/status` - Update status
- `PUT /api/registrations/{id}/attendance` - Mark attendance
- `DELETE /api/registrations/{id}` - Delete registration

### Messages & Notifications
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification

### System (Super Admin)
- `GET /api/system/stats` - System statistics
- `POST /api/system/announce` - Send announcement

## 🎨 Features in Detail

### Event Management
- Create events with multiple sub-events (workshops, tracks)
- Set capacity limits and pricing
- Upload event images and payment QR codes
- Draft and publish workflow

### Registration System
- Students can register for multiple sub-events
- Time conflict detection
- Payment screenshot upload
- Admin approval workflow
- QR code generation for attendance

### QR Code System
- Google Lens-inspired scanner UI
- Camera-based scanning
- Gallery image scanning
- Attendance marking
- Certificate upload after attendance

### Dark Mode
- Per-user theme preferences
- Stored in database
- Persists across sessions
- Smooth transitions

## 🧪 Development

### Run in Development Mode
```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Database Migrations
```bash
# Add missing columns
python add_missing_columns.py

# Make date fields nullable
python migrate_date_nullable.py
```

### Check Database
```bash
python check_db.py
python list_users.py
```

## 🚢 Production Deployment

### Using Netlify (Recommended)
1. Configure `netlify.toml` for serverless functions
2. Deploy frontend to Netlify CDN
3. Use Netlify Functions for API endpoints

### Traditional Hosting
1. Set up PostgreSQL database
2. Configure environment variables
3. Run with production ASGI server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 Documentation

Additional documentation available in `.analysis/`:
- `architecture-analysis.md` - System architecture deep-dive
- `security-audit.md` - Security vulnerabilities and fixes
- `quick-reference.md` - Developer quick start guide
- `bug_fix_2026-02-11.md` - Recent bug fixes

## 🐛 Known Issues & Fixes

See `.analysis/bug_fix_2026-02-11.md` for recent fixes including:
- Super admin routing fix
- Backend-frontend field name transformation (snake_case ↔ camelCase)

## 🔒 Security Notes

⚠️ **Important**: This application currently has security vulnerabilities:
- Passwords stored in plain text
- No JWT authentication
- Missing input validation
- Potential XSS vulnerabilities

**Do not use in production without implementing proper security measures!**

See `.analysis/security-audit.md` for detailed security recommendations.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes.

## 📞 Support

For issues and questions, please check the documentation in `.analysis/` or create an issue in the repository.

---

**Built with ❤️ for Smart Campus Management**
