# Smart Campus Events - Quick Reference Guide

## 🚀 Quick Start

### Running the Application

**Frontend (Static):**
```bash
# Option 1: Direct open
# Just open index.html in browser

# Option 2: Local server
python -m http.server 8000
# Then visit: http://localhost:8000
```

**Backend Option 1 (Node.js):**
```bash
cd backend
npm install
npm start
# Server runs on: http://localhost:3000
```

**Backend Option 2 (Python):**
```bash
cd backend_python
pip install -r requirements.txt
python main.py
# Server runs on: http://127.0.0.1:8000
```

---

## 📁 Project Structure

```
smart-campus-events/
│
├── 🎨 FRONTEND
│   ├── index.html                 # Entry point (30 lines)
│   ├── css/
│   │   ├── styles.css             # Main styles (1233 lines, 24KB)
│   │   └── ott-styles.css         # Theme extensions
│   ├── js/
│   │   ├── app.js                 # ⚠️ Core app (5237 lines, 351KB!)
│   │   └── data.js                # API layer (222 lines)
│   └── assets/                    # Images, icons
│
├── 🔧 BACKEND (Option 1: Node.js)
│   └── backend/
│       ├── server.js              # Express API (286 lines)
│       ├── db.js                  # Sequelize config
│       ├── models/                # 5 Sequelize models
│       └── package.json
│
├── 🐍 BACKEND (Option 2: Python)
│   ├── backend_python/
│   │   ├── main.py                # FastAPI (282 lines)
│   │   ├── models.py              # SQLAlchemy (128 lines)
│   │   ├── schemas.py             # Pydantic validation
│   │   └── requirements.txt
│   │
│   └── functions/                 # Netlify serverless
│       └── main.py                # Lambda handler
│
├── 📚 DOCUMENTATION
│   ├── README.md                  # Basic project info
│   ├── DARK_MODE_IMPLEMENTATION.md
│   └── .analysis/
│       ├── architecture-analysis.md   # 📊 Full analysis
│       └── quick-reference.md         # 📋 This file
│
└── ⚙️ CONFIGURATION
    ├── netlify.toml               # Deployment config
    ├── .env.example               # Environment template
    └── test.db                    # SQLite for testing
```

---

## 🔑 Default Credentials

### Super Admin
- **Email:** `super@smartcampus.edu`
- **Password:** `super123`
- **Access:** User management, system settings, all features

### Admin
- **Email:** `admin@smartcampus.edu`
- **Password:** `admin123`
- **Access:** Event management, registrations, chat with students

### Student
- **Email:** `john@student.edu`
- **Password:** `user`
- **Access:** Browse events, register, chat with admin

---

## 🛣️ API Endpoints

### Authentication
```
POST   /api/login              # Login user
POST   /api/register           # Create new user
```

### Users
```
GET    /api/users              # Get all users (admin only)
PUT    /api/users/:id          # Update user profile
PUT    /api/users/:id/password # Change password
DELETE /api/users/:id          # Delete user (super admin)
```

### Events
```
GET    /api/events             # Get all events
POST   /api/events             # Create event (admin)
PUT    /api/events/:id         # Update event (admin)
DELETE /api/events/:id         # Delete event (admin)
```

### Registrations
```
POST   /api/registrations      # Register for event
GET    /api/registrations      # Get all registrations
GET    /api/registrations/user/:userId  # User's registrations
PUT    /api/registrations/:id/status    # Approve/reject
PUT    /api/registrations/:id/attendance # Mark attendance
DELETE /api/registrations/:id  # Cancel registration
```

### Messages
```
GET    /api/messages           # Get all messages
POST   /api/messages           # Send message
```

### Notifications
```
GET    /api/notifications      # Get notifications
POST   /api/notifications      # Create notification
PUT    /api/notifications/read # Mark as read
DELETE /api/notifications      # Clear notifications
```

### System (Super Admin)
```
GET    /api/system/stats       # System statistics
POST   /api/system/announce    # Send announcement
```

---

## 🗄️ Database Schema (Quick View)

### Tables
```
users
  ├── id, name, email, password (⚠️ plain text!)
  ├── role (student/admin/super)
  ├── department, year, college
  ├── theme (light/dark)
  └── profile_pic, is_active

events
  ├── id, title, description
  ├── date, time, venue, capacity
  ├── type, image, status
  └── admin_id → users.id

sub_events
  ├── id, event_id → events.id
  ├── name, start_time, end_time
  ├── venue, capacity
  ├── is_paid, amount
  └── department

registrations
  ├── id, user_id → users.id
  ├── event_id → events.id
  ├── sub_event_id → sub_events.id
  ├── status (pending/approved/rejected)
  ├── payment_screenshot
  ├── attendance, certificate_url
  └── timestamp

messages
  ├── id, sender_id → users.id
  ├── receiver_id → users.id
  ├── text, attachment
  └── timestamp

notifications
  ├── id, text, type
  ├── role (student/admin/all)
  ├── sender_name, is_read
  └── timestamp
```

---

## 🎨 Key Features

### ✅ Event Management
- Create main events with multiple sub-events
- Draft and published states
- Event types: Academic, Cultural, Technical, Sports
- Capacity management
- Time conflict detection

### ✅ Registration System
- Multi-event registration
- Payment screenshot upload
- QR code generation per registration
- Admin approval workflow
- Attendance tracking

### ✅ QR Code System
- **Scanner:** Google Lens-inspired UI
- **Generation:** Automatic for each registration
- **Use Case:** Attendance marking
- **Libraries:** html5-qrcode, qrcode.js

### ✅ Campus Chat
- Direct messaging (Admin ↔ Student)
- Attachment support
- Message history
- Real-time-style updates

### ✅ Notifications
- Role-based targeting
- Event alerts
- Registration updates
- System announcements

### ✅ Dark Mode
- Per-user preference
- Stored in database
- Independent for each role
- Live preview in settings

### ✅ User Management (Super Admin)
- Add/delete users
- View all system users
- Assign roles
- System-wide announcements

---

## 🔒 Security Checklist

### 🔴 Critical Issues (FIX IMMEDIATELY)
- [ ] Hash passwords (currently plain text!)
- [ ] Implement JWT authentication
- [ ] Add input validation
- [ ] Sanitize HTML (prevent XSS)
- [ ] Use HTTPS in production

### 🟡 Important Issues
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Restrict CORS origins
- [ ] Add session timeout
- [ ] Validate file uploads

### 🟢 Nice to Have
- [ ] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Audit logging

---

## 📊 Performance Tips

### Frontend Optimization
```javascript
// 1. Code splitting (current: monolithic app.js)
// Split into modules:
- auth.js
- student-dashboard.js
- admin-dashboard.js
- qr-scanner.js

// 2. Lazy loading
const module = await import('./modules/admin.js');

// 3. Image optimization
// Use CDN instead of base64 encoding

// 4. Pagination
const events = await Data.getEvents({ page: 1, limit: 20 });
```

### Backend Optimization
```javascript
// 1. Add pagination to all list endpoints
GET /api/events?page=1&limit=20

// 2. Add database indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_date ON events(date);

// 3. Use Redis for caching
// Cache frequently accessed data

// 4. Optimize queries
// Add .lean() for Mongoose
// Use select() to limit fields
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
```bash
# Check environment variables
cat backend/.env

# Expected:
DB_NAME=smartcampus
DB_USER=postgres
DB_PASS=yourpassword
DB_HOST=localhost
```

### Issue: "API calls failing (404)"
```bash
# Frontend expects API at /api/*
# Ensure backend is running on correct port
# Or update API_BASE in js/data.js
```

### Issue: "CORS error in browser"
```javascript
// Backend must allow frontend origin
// In server.js or main.py:
app.use(cors({
    origin: 'http://localhost:8000'
}));
```

### Issue: "QR scanner not working"
```javascript
// 1. Ensure HTTPS (camera requires secure context)
// 2. Grant camera permissions in browser
// 3. Check console for errors
```

---

## 🧪 Testing Commands

### Manual Testing Workflow
```bash
# 1. Test Authentication
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartcampus.edu","password":"admin123"}'

# 2. Test Event Creation
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Fest 2026",
    "description": "Annual technology festival",
    "date": "2026-03-15",
    "venue": "Main Auditorium",
    "capacity": 500,
    "type": "Technical"
  }'

# 3. Test Registration
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "event_id": 1,
    "sub_event_id": null
  }'
```

### Future: Automated Tests
```bash
# Install testing frameworks
npm install --save-dev jest supertest
pip install pytest httpx

# Run tests
npm test           # Frontend + Backend (Node.js)
pytest             # Backend (Python)
```

---

## 📦 Deployment

### Netlify Deployment
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
netlify init

# 4. Deploy
netlify deploy --prod

# Automatic deployment on git push
# - Frontend: Served from CDN
# - Backend: AWS Lambda via Netlify Functions
# - API: Proxied via /api/* → /.netlify/functions/main
```

### Traditional Deployment
```bash
# Frontend: Any static hosting (Vercel, GitHub Pages, S3)
# Backend: VPS (DigitalOcean, Linode, AWS EC2)
# Database: Managed PostgreSQL (Heroku, AWS RDS, Supabase)

# Example: Deploy to Heroku
heroku create smart-campus-api
git push heroku main
heroku config:set DB_NAME=xxx DB_USER=xxx DB_PASS=xxx
```

---

## 🎯 Next Steps for Development

### Week 1 (Critical)
1. **🔴 Security**: Hash passwords (bcrypt/argon2)
2. **🔴 Security**: Implement JWT authentication
3. **🔴 Testing**: Add basic unit tests

### Month 1 (Important)
4. **🟡 Refactor**: Split app.js into modules
5. **🟡 Performance**: Add pagination to API
6. **🟡 Features**: Add password reset flow

### Quarter 1 (Enhancement)
7. **🟢 Scale**: Add Redis caching
8. **🟢 Real-time**: WebSocket for chat/notifications
9. **🟢 Analytics**: Add usage analytics dashboard

---

## 📚 Resources

### Documentation
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Express Docs:** https://expressjs.com
- **Sequelize Docs:** https://sequelize.org
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org

### Libraries Used
- **QR Code Generation:** https://github.com/soldair/node-qrcode
- **QR Code Scanning:** https://github.com/mebjas/html5-qrcode
- **Font Awesome:** https://fontawesome.com
- **Google Fonts:** https://fonts.google.com

### Security Resources
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **JWT Best Practices:** https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- **Password Hashing:** https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## 💡 Pro Tips

### Development
```bash
# Use nodemon for auto-restart
npm install -g nodemon
nodemon backend/server.js

# Use browser auto-reload
# Browser: Live Server extension (VS Code)
```

### Database
```bash
# Backup database
pg_dump smartcampus > backup.sql

# Restore database
psql smartcampus < backup.sql

# View database
psql smartcampus
\dt          # List tables
\d users     # Describe users table
```

### Debugging
```javascript
// Enable SQL logging (Sequelize)
logging: console.log

// Enable detailed errors (FastAPI)
app = FastAPI(debug=True)

// Browser DevTools
// Check Network tab for API calls
// Check Console for JS errors
```

---

**Last Updated:** February 10, 2026  
**Project Status:** Active Development 🚀  
**Next Review:** March 1, 2026
