<div align="center">
  <img src="frontend/public/favicon.svg" alt="Event Hub Logo" width="100"/>

  # 🎉 Event Hub

  **The All-In-One Smart Campus Event Management Platform**

  [![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg)](https://vitejs.dev/)
  [![Python](https://img.shields.io/badge/Python-Flask-blue.svg)](https://flask.palletsprojects.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-green.svg)](https://www.mongodb.com/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-teal.svg)](https://tailwindcss.com/)
</div>

<br />

### 🔗 **Live Demo:** [Placeholder for Live Link]

---

## 📖 Overview

**Event Hub** is a comprehensive, multi-tenant smart campus platform designed to digitize and simplify event management for educational institutions. 

Whether it's a technical symposium, a cultural fest, or an internal department workshop, Event Hub brings Students, Organizers (Sub-Admins), Administrators, and SuperAdmins under one unified ecosystem. It solves the pain points of manual registrations, attendance tracking (via QR codes), and certificate distribution by automating the entire lifecycle of an event.

---

## 🎯 Features by Role

### 👑 SuperAdmin (Platform Owner)
* **Global Dashboard:** View system-wide statistics (Total institutions, users, events, registrations).
* **Institution Management:** Onboard new colleges and universities onto the platform.
* **System Announcements:** Broadcast messages globally across the platform.

### 🛡️ Admin (Institution Level)
* **Institution Dashboard:** View college-specific metrics and activities.
* **User Management:** Approve/Reject pending student accounts to ensure only valid students enter the platform.
* **Role Delegation:** Create and manage **Sub-Admins** (Event Organizers / Faculty).
* **Event Approval Workflow:** Review, approve, or reject events proposed by Sub-Admins.

### 📋 Sub-Admin / Organizer
* **Event Creation:** Propose new events (Free/Paid, Team/Individual) with posters, capacities, and rules.
* **Registration Management:** View who registered for their events.
* **QR Check-in System:** Use the built-in QR Scanner to scan student tickets and mark attendance instantly.
* **Certificate Studio:** Use the drag-and-drop Template Designer to create custom certificates.
* **Bulk Certificate Issuance:** Generate and distribute verifiable PDF certificates to attendees in one click.

### 🎓 Student / Attendee
* **Explore Events:** Browse public and institution-specific events in a modern feed.
* **Stories & Posts:** View campus updates through Instagram-like stories and social posts.
* **Seamless Registration:** Register for events, form teams, and upload payment proof via UPI.
* **Digital Tickets:** Access dynamic QR code tickets for check-ins.
* **My Certificates:** Download and verify participation/winner certificates directly from the dashboard.
* **Real-time Chat:** Communicate with organizers or peers via built-in WebSockets chat.

---

## 💻 Tech Stack

### Frontend
* **Core:** React 19, TypeScript, Vite
* **Styling & UI:** Tailwind CSS v3, Framer Motion (Animations), Lucide React (Icons)
* **State Management:** Zustand, React Query (@tanstack/react-query)
* **Forms & Validation:** React Hook Form, Zod
* **Utilities:** Axios, HTML5-QRCode (for scanning), QRCode.React (for generating tickets)

### Backend
* **Core:** Python, Flask 
* **Database:** MongoDB (PyMongo)
* **Authentication:** JWT (python-jose), bcrypt (Passlib)
* **Real-Time:** Flask-Sock (WebSockets for chat)
* **Data Validation:** Pydantic
* **Utilities:** ReportLab (PDF Generation for certificates), Twilio (SMS/Notifications - if configured)

---

## 📂 Folder Structure

```text
Event-Hub/
├── backend/
│   ├── app.py                   # Main Flask Application Entry
│   ├── config/                  # Environment & App Configurations
│   ├── controllers/             # Business Logic & Request Handling
│   ├── database/                # MongoDB Connection & Migrations
│   ├── middleware/              # JWT Auth & Security Middleware
│   ├── models/                  # Pydantic Schemas (Validation)
│   ├── routes/                  # API Endpoints Definitions
│   ├── services/                # Core functionalities (Auth, Email, Certs)
│   ├── static/ & uploads/       # Media, Certificates, Profile Pics
│   └── utils/                   # Helpers (WebSockets, JWT encoders)
└── frontend/
    ├── index.html               # Main HTML Template
    ├── src/
    │   ├── assets/              # Static Images & SVGs
    │   ├── components/          # Reusable UI (Modals, Auth, QR Scanner)
    │   ├── context/             # Zustand Stores (AuthStore, ChatStore)
    │   ├── hooks/               # Custom React Hooks
    │   ├── pages/               # Route Pages (Admin, Student, Shared)
    │   ├── services/            # Axios API Client Configurations
    │   └── types/               # TypeScript Interfaces
    └── tailwind.config.js       # UI Theme configuration
```

---

## 🚀 Installation & Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.10+ recommended)
* **MongoDB** (Local instance running on `27017` or MongoDB Atlas URI)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/Event-Hub.git
cd Event-Hub
```

### Step 2: Setup Backend
```bash
cd backend
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```
*The backend will run on `http://localhost:8000`*

### Step 3: Setup Frontend
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## ⚙️ Environment Variables

Create a `.env` file in both the `frontend` and `backend` directories using the provided `.env.example` templates.

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | A long, random string used to sign JWT authentication tokens. |
| `MONGO_URI` | Your MongoDB Connection String. (e.g., `mongodb://localhost:27017/smartcampus`) |
| `POSTGRES_DB` / `USER` / `PASSWORD` | PostgreSQL credentials (if using SQL features). |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed for CORS (e.g., `http://localhost:5173`). |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | The public URL of your backend server (e.g., `http://localhost:8000`). Leave empty if proxying via NGINX. |
| `NGINX_BACKEND_URL` | Used for production docker setups to point to the backend container. |

---

## 🔌 API Endpoints Table

Here is a high-level overview of the major API endpoints driving the application:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/api/login` | Authenticate user & return JWT token | No |
| **POST** | `/api/register` | Register a new student/user account | No |
| **GET** | `/api/users/profile` | Get current logged-in user details | Yes |
| **POST** | `/api/institutions` | Create a new institution (SuperAdmin) | Yes |
| **GET** | `/api/events` | Fetch all events (feed) | Yes |
| **POST** | `/api/events` | Create a new event proposal | Yes (Sub-Admin) |
| **PUT** | `/api/events/<id>/approve`| Approve a pending event | Yes (Admin) |
| **POST** | `/api/registrations` | Register a user for an event (Ticket booking) | Yes |
| **POST** | `/api/events/scan` | Scan QR code & validate ticket | Yes (Organizer) |
| **POST** | `/api/events/<id>/attendance`| Mark attendance for a scanned ticket | Yes (Organizer) |
| **POST** | `/api/certificates/generate` | Bulk generate certificates for attendees | Yes (Organizer) |
| **GET** | `/api/chat/conversations` | Get user's direct messages & groups | Yes |

---

## 🗄️ Database Schema Overview

The system uses MongoDB documents. Here are the core schemas:
* **Users:** Stores credentials, role (`student`, `subadmin`, `admin`, `superadmin`), profile details, and institution linking.
* **Institutions:** Details of the colleges using the platform (name, code, logo).
* **Events & SubEvents:** Contains event details, rules, dates, capacities, approval status, and sub-activities (e.g., specific competitions inside a main fest).
* **Registrations:** Maps a User to an Event. Contains payment proof images, payment status, attendance status (`Absent`/`Present`), and linked certificates.
* **Certificates & Templates:** Stores JSON layouts for custom certificates (X/Y coordinates for text) and cryptographic hashes for verification.
* **Stories & Posts:** Media shared by organizers to promote events (Instagram-style).
* **Messages:** Real-time chat histories between users.

---

## 📚 Complete User Guide

### 1. How to Signup (Student)
1. Navigate to the **Register** page.
2. Fill in your details (Name, Email, College, Student ID, Password).
3. Upon submission, your account is created in a **Pending** state.
4. Your Institution Admin will review and **Approve** your account.
5. Once approved, you can log in.

### 2. How to Create an Event (Sub-Admin)
1. Log in as a Sub-Admin and navigate to your **Dashboard**.
2. Click **Create Event**. 
3. Fill out the form: Title, description, date, visibility, and add specific **Sub-Events** (e.g., Coding Hackathon, Quiz).
4. Upload a poster and submit. The event goes to the Admin for approval.
5. Once the Admin approves it, it becomes visible to students.

### 3. How to Book a Ticket (Student)
1. Go to the **Explore/Dashboard** feed and click on an Event.
2. Click **Register**. Select the specific sub-events you want to attend.
3. If it's a paid event, scan the provided Organizer UPI QR code, pay the fee, and upload the screenshot.
4. Your registration moves to `Pending`. The Organizer verifies the payment and approves your ticket.
5. You instantly receive a unique **QR Code Ticket** in your dashboard.

### 4. How to Check-In with QR (Organizer)
1. Open the Event Dashboard from your Sub-Admin panel.
2. Go to the **Attendance** tab and click **Scan QR**.
3. Point your camera at the Student's QR Ticket.
4. The system validates the ticket in real-time and marks the student as **Present**.

### 5. Certificate Generation (Organizer)
1. After the event, go to the **Template Designer** and upload a blank certificate image.
2. Drag and drop dynamic fields (like `Student Name`, `Event Name`) onto the image.
3. Go to the **Certificates** tab, select the template, and hit **Generate**.
4. PDF Certificates are dynamically created and pushed directly to the students' profiles!

---

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your application)*

| Landing Page | Student Dashboard |
|--------------|-------------------|
| ![Landing Page Placeholder](#) | ![Student Dashboard Placeholder](#) |

| QR Scanner Check-in | Certificate Template Designer |
|---------------------|-------------------------------|
| ![QR Scanner Placeholder](#) | ![Template Designer Placeholder](#) |

---

## 🔮 Future Scope
* **Payment Gateway Integration:** Direct integration with Stripe/Razorpay to replace manual UPI screenshot verification.
* **AI Event Recommendations:** Suggest events to students based on their past participation.
* **Mobile App:** Wrap the responsive PWA into native iOS/Android apps using React Native.
* **Gamification:** Award campus points and badges to active students on a global leaderboard.

---
*Generated meticulously by your Technical Documentation Expert.*
