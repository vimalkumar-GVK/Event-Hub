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
- **React (v19)** with **Vite** & **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router Dom** for routing
- **Framer Motion** for animations
- **Lucide React** for icons
- **html5-qrcode** for attendance tracking

### Backend
- **Python 3.8+**
- **Flask** with **flask-cors** & **flask-sock**
- **PyMongo** & **mongomock** (in-memory MongoDB fallback)
- **Pydantic** for validation
- **python-jose** & **passlib** for JWT auth & password hashing

## 📋 Prerequisites

- **Python 3.8 or higher**
- **Bun** (recommended) or Node.js (for frontend)
- **MongoDB** (optional, defaults to mongomock in-memory database)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
cd smart-campus-events
```

### 2. Set Up Python Backend

#### Install Dependencies & Run Backend
Using your python interpreter:
```bash
cd backend
pip install -r requirements.txt
python -m app.main
```
The backend server runs at `http://localhost:8000`.

### 3. Set Up React Frontend

#### Install Dependencies & Run Frontend
Using Bun (preferred) or npm:
```bash
cd frontend
bun install
bun run dev
```
The frontend dev server runs at `http://localhost:5173`.

The backend automatically proxies requests under `/api` and `/ws` to port 8000.

## 🔐 Default Credentials (Auto-Seeded)

### Super Admin
- **Email**: `super@smartcampus.edu`
- **Password**: `super123`

### Admin (Rathinam College)
- **Email**: `admin1@rathinam.edu`
- **Password**: `admin123`

### Sub Admin (Rathinam College)
- **Email**: `sub1@rathinam.edu`
- **Password**: `sub123`

### Student 1 (Verified)
- **Email**: `student1@rathinam.edu`
- **Password**: `user123`

### Student 2 (Unverified)
- **Email**: `student2@rathinam.edu`
- **Password**: `user123`

> **Note**: Change these credentials in production!

## 📁 Project Structure

```
smart-campus-events/
├── backend/          # Python Flask backend
│   ├── app/
│   │   ├── main.py             # Flask application entry point
│   │   ├── database.py         # MongoDB connection & fallback setup
│   │   ├── auth.py             # JWT & Password helper functions
│   │   ├── websocket_manager.py # Flask socket/websocket manager
│   │   ├── schemas.py          # Pydantic validation schemas
│   ├── requirements.txt    # Python dependencies
│   └── seed_admin.py       # Admin seeding script
├── frontend/         # React Single Page Application (SPA)
│   ├── src/                # React components & pages
│   ├── package.json        # Frontend Node/Bun dependencies
│   └── vite.config.ts      # Vite configuration with proxy API
├── .analysis/        # Documentation and analysis
└── README.md         # This file
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

## 🚢 Deployment

The project is split into independently deployable units. Each service has its own `docker-compose.yml`.

### Local Development (all-in-one)
Starts backend, frontend, PostgreSQL, and Redis together:
```bash
docker compose -f docker-compose.dev.yml up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

### Deploy Backend Independently

```bash
cd backend/

# 1. Configure environment
cp .env.example .env
# Edit .env — set SECRET_KEY, MONGO_URI, ALLOWED_ORIGINS, etc.

# 2. Build & start
docker compose up -d --build
```
The API is available at `http://<host>:8000`.

---

### Deploy Frontend Independently

```bash
cd frontend/

# 1. Configure environment
cp .env.example .env
# Edit .env — set NGINX_BACKEND_URL to point at your backend

# 2. Build & start
docker compose up -d --build
```
The app is available at `http://<host>:3000`.

The nginx container proxies `/api` and `/ws` requests to `NGINX_BACKEND_URL`
(set in `frontend/.env`). No CORS changes are needed on the backend with this approach.

#### Key environment variables

| Variable | Where | Description |
|---|---|---|
| `NGINX_BACKEND_URL` | `frontend/.env` | Backend URL nginx proxies to (e.g. `http://api.example.com:8000`) |
| `VITE_API_URL` | `frontend/.env` | *Optional* — only needed if calling backend directly from browser |
| `ALLOWED_ORIGINS` | `backend/.env` | Comma-separated list of allowed frontend origins |
| `SECRET_KEY` | `backend/.env` | JWT signing secret (use a long random string) |


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
