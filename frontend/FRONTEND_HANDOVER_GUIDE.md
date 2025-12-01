# Face Recognition Attendance System - Frontend Handover Guide

## Executive Summary

This document provides a complete overview of the **Face Recognition Attendance System** frontend application. It is designed to help the backend team (Flask/Python) understand the frontend architecture, data requirements, API integration points, and what functionality needs to be implemented on the backend.

**Status:** Production-ready for backend integration
**Last Updated:** November 18, 2025

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [User Roles & Features](#user-roles--features)
5. [API Requirements](#api-requirements)
6. [Data Models & Schema](#data-models--schema)
7. [Component Architecture](#component-architecture)
8. [Integration Points](#integration-points)
9. [Authentication Flow](#authentication-flow)
10. [File Upload Requirements](#file-upload-requirements)
11. [Deployment & Setup](#deployment--setup)
12. [Testing Checklist](#testing-checklist)

---

## 1. Project Overview

### What is This System?

This is a **web-based Face Recognition Attendance System** that uses facial recognition technology to automatically mark attendance for employees. Instead of manual attendance or ID cards, users register their face once, and the system recognizes them automatically when they enter an area.

### Key Features

- **User Authentication**: Secure login/registration with role-based access
- **Face Registration**: Users can capture multiple face images (minimum 5, maximum 7) for accurate recognition
-- **Attendance Marking**: Employees can mark attendance through face recognition
- **Admin Dashboard**: Admins can view attendance statistics, manage users, and access reports
- **Attendance Records**: View personal attendance history with filtering and export options
- **User Management**: Admin can add, edit, delete users, and manage roles/departments
- **Settings & Preferences**: Users can update profiles, change passwords, and configure system preferences

---

## 2. Technology Stack

### Frontend Framework
- **React 18.3.1**: Client-side UI framework
- **Vite 6.3.5**: Build tool and dev server (ultra-fast)
- **JavaScript/JSX**: No TypeScript; plain JavaScript files

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React 0.487.0**: 300+ icons library

### State Management
- **React Hooks (useState, useEffect)**: Local component state only
- **No Redux or Context API**: Components use prop drilling
- **localStorage**: For storing authentication tokens

### Additional Libraries
- **React Hook Form 7.55.0**: Form state management
- **Motion/Framer Motion**: Animation library
- **Recharts 2.15.2**: Data visualization (charts)
- **Sonner 2.0.3**: Toast notifications
- **React Day Picker 8.10.1**: Date picker component
- **Embla Carousel 8.6.0**: Image carousel

### Backend Integration
- **Fetch API**: For HTTP requests to Flask backend
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Content-Type**: application/json (except file uploads which use multipart/form-data)
- **Authentication**: Bearer token in Authorization header

---

## 3. Folder Structure

```
frontend/
├── public/                          # Static assets (if any)
├── src/
│   ├── App.jsx                      # Main application component with routing
│   ├── main.jsx                     # React app entry point
│   ├── index.css                    # Global styles
│   ├── components/
│   │   ├── LandingPage.jsx          # Marketing/info page
│   │   ├── LoginPage.jsx            # Login & registration (ENTRY POINT)
│   │   ├── Dashboard.jsx            # Employee dashboard
│   │   ├── AdminDashboard.jsx       # Admin overview & analytics
│   │   ├── RegisterFace.jsx         # User face registration interface
│   │   ├── AdminRegisterFace.jsx    # Admin manages user face registrations
│   │   ├── AttendancePage.jsx       # Employee marks attendance & history
│   │   ├── AdminAttendanceRecords.jsx   # Admin views all attendance records
│   │   ├── AdminUserManagement.jsx  # Admin manages users (CRUD)
│   │   ├── AdminPanel.jsx           # Legacy admin panel (can be deprecated)
│   │   ├── SettingsPage.jsx         # User profile & preferences
│   │   ├── Navbar.jsx               # Top navigation bar
│   │   ├── Sidebar.jsx              # Left sidebar (employee)
│   │   ├── AdminSidebar.jsx         # Left sidebar (admin)
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── select.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   └── ... (30+ other UI components)
│   │   └── figma/
│   │       └── ImageWithFallback.jsx # Custom image fallback component
│   ├── styles/
│   │   └── globals.css              # Global Tailwind CSS setup
│   └── guidelines/
│       └── Guidelines.md            # Design guidelines
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Vite build configuration
├── index.html                       # HTML entry point
└── README.md                        # Quick start guide
```

---

## 4. User Roles & Features

### 4.1 Employee Role

**Access:**
- Dashboard (personal statistics)
- Register Face (capture face images once)
- Attendance Page (mark attendance, view personal history)
- Settings (update profile, change password)

**Features:**
- View attendance statistics (present/absent counts, attendance rate)
- See recent attendance records
- Capture and register face images (5-7 images minimum)
- Mark attendance via face recognition
- Filter attendance history by date
- Export attendance records (CSV/PDF)
- Update personal profile information
- Change password
- Configure system preferences

### 4.2 Admin Role

**Access:**
- Admin Dashboard (system-wide statistics & analytics)
- Admin User Management (manage all users)
- Admin Attendance Records (view all users' attendance)
- Admin Register Face (manage face registrations for all users)
- Settings (admin preferences)

**Features:**
- View overall attendance statistics (total users, present/absent, rate)
- See weekly attendance trends and top-performing departments
- View recent activity logs with timestamps and locations
- Create, edit, delete user accounts
- Assign roles and departments to users
- View all users' attendance records
- Filter records by date, month, year, department
- Export attendance reports (CSV/PDF)
- Manage user face registrations (view, delete)
- Bulk operations on user records

---

## 5. API Requirements

### 5.1 Authentication Endpoints

#### POST /api/auth/login
**Purpose:** User login
**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123",
  "role": "employee"  // "admin" or "employee"
}
```
**Response (Success - 200):**
```json
{
  "id": "EMP001",
  "name": "John Doe",
  "email": "user@company.com",
  "role": "employee",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "department": "Engineering"
}
```
**Response (Error - 401):**
```json
{
  "message": "Invalid email or password"
}
```

#### POST /api/auth/register
**Purpose:** New user registration
**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password123",
  "role": "employee"
}
```
**Response (Success - 201):**
```json
{
  "id": "EMP002",
  "name": "Jane Smith",
  "email": "jane@company.com",
  "role": "employee",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "User registered successfully"
}
```

#### POST /api/auth/oauth/google
**Purpose:** Google OAuth login (optional)
**Request:**
```json
{
  "authCode": "google_oauth_code"
}
```
**Response (Success - 200):**
```json
{
  "id": "EMP003",
  "name": "Google User",
  "email": "user@gmail.com",
  "role": "employee",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/logout
**Purpose:** User logout (invalidate token)
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 5.2 User Management Endpoints

#### GET /api/users
**Purpose:** Get all users (admin only)
**Headers:**
```
Authorization: Bearer {token}
```
**Query Parameters (optional):**
- `role`: filter by role ("employee", "admin")
- `department`: filter by department
- `status`: filter by status ("Active", "Inactive")
**Response:**
```json
{
  "users": [
    {
      "id": "EMP001",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "employee",
      "department": "Engineering",
      "status": "Active",
      "phone": "+1 555-123-4567",
      "address": "123 Main St",
      "joinDate": "2024-01-15",
      "avatar": "https://..."
    },
    ...
  ]
}
```

#### GET /api/users/:id
**Purpose:** Get single user profile
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "id": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "role": "employee",
  "department": "Engineering",
  "status": "Active",
  "phone": "+1 555-123-4567",
  "address": "123 Main St",
  "joinDate": "2024-01-15",
  "avatar": "https://..."
}
```

#### POST /api/users
**Purpose:** Create new user (admin only)
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "name": "New User",
  "email": "newuser@company.com",
  "password": "tempPassword123",
  "role": "employee",
  "department": "Engineering",
  "phone": "+1 555-987-6543",
  "address": "456 Oak Ave"
}
```
**Response:**
```json
{
  "id": "EMP051",
  "message": "User created successfully",
  "user": { /* user object */ }
}
```

#### PUT /api/users/:id
**Purpose:** Update user information (admin or own profile)
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "name": "Updated Name",
  "phone": "+1 555-111-2222",
  "department": "Sales",
  "status": "Active",
  "address": "789 Elm St"
}
```
**Response:**
```json
{
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

#### DELETE /api/users/:id
**Purpose:** Delete user (admin only)
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

### 5.3 Face Registration Endpoints

#### POST /api/faces/register
**Purpose:** Register user's face with multiple images
**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Form Data:**
- `userId`: User ID (string)
- `images`: Multiple image files (binary, JPEG/PNG)

**Backend Should:**
1. Extract face from each image using face_recognition library
2. Generate face encoding (128-dimensional vector)
3. Store encodings in database
4. Store original images in local folder
5. Validate at least 5 images provided
6. Validate face quality/clarity

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Face registered successfully",
  "encodingId": "FACE_ENC_001",
  "imagesProcessed": 6,
  "imageUrls": [
    "http://backend/storage/faces/user_EMP001_1.jpg",
    "http://backend/storage/faces/user_EMP001_2.jpg",
    ...
  ]
}
```

#### GET /api/faces/:userId
**Purpose:** Get registered faces for a user
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "userId": "EMP001",
  "registeredFaces": [
    {
      "faceId": "FACE_ENC_001",
      "imageUrl": "http://backend/storage/faces/user_EMP001_1.jpg",
      "capturedAt": "2024-11-14T09:15:00Z",
      "status": "verified"
    },
    ...
  ],
  "totalFaces": 6,
  "registered": true
}
```

#### DELETE /api/faces/:faceId
**Purpose:** Delete a specific face encoding/image
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "message": "Face deleted successfully"
}
```

---

### 5.4 Attendance Endpoints

#### POST /api/attendance/mark
**Purpose:** Mark attendance via face recognition
**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Form Data:**
- `image`: Image file containing user's face (binary)
- `userId`: User ID (optional; can be auto-detected via face match)

**Backend Should:**
1. Extract face from image using face_recognition
2. Compare with stored face encodings in database
3. Find best match (use similarity threshold, e.g., 0.6)
4. If match found, mark attendance with confidence score
5. Store image proof with attendance record
6. If multiple matches, return confidence scores

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "userId": "EMP001",
  "userName": "John Doe",
  "timestamp": "2024-11-14T09:15:30Z",
  "status": "Present",
  "confidence": 0.95,
  "imageProofUrl": "http://backend/storage/proofs/att_20241114_091530.jpg"
}
```

**Response (No Match - 404):**
```json
{
  "success": false,
  "message": "Face not recognized",
  "matches": [
    {
      "userId": "EMP002",
      "confidence": 0.52
    }
  ]
}
```

#### GET /api/attendance/records
**Purpose:** Get attendance records with filtering
**Headers:**
```
Authorization: Bearer {token}
```
**Query Parameters:**
- `userId`: Filter by user ID (for employee view)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `month`: Filter by month (1-12)
- `year`: Filter by year
- `department`: Filter by department (admin view)
- `status`: Filter by status (Present/Absent)

**Response:**
```json
{
  "records": [
    {
      "id": "ATT001",
      "userId": "EMP001",
      "userName": "John Doe",
      "department": "Engineering",
      "timestamp": "2024-11-14T09:15:30Z",
      "status": "Present",
      "recognitionConfidence": 0.95,
      "location": "Main Office",
      "imageProofUrl": "http://backend/storage/proofs/..."
    },
    ...
  ],
  "total": 50,
  "present": 42,
  "absent": 8,
  "attendanceRate": "84%"
}
```

#### GET /api/attendance/export
**Purpose:** Export attendance records as CSV or PDF
**Headers:**
```
Authorization: Bearer {token}
```
**Query Parameters:**
- `format`: "csv" or "pdf"
- `startDate`: Start date
- `endDate`: End date
- `department`: (optional, admin only)

**Response:** File download (binary data)

---

### 5.5 Statistics Endpoints

#### GET /api/statistics/dashboard
**Purpose:** Get dashboard statistics for logged-in user
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "totalUsers": 248,
  "presentToday": 186,
  "absentToday": 62,
  "attendanceRate": "75%",
  "recentRecords": [
    {
      "id": 1,
      "name": "John Doe",
      "time": "09:15 AM",
      "status": "Present",
      "department": "Engineering"
    },
    ...
  ]
}
```

#### GET /api/statistics/weekly
**Purpose:** Get weekly attendance trend data
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "weekData": [
    { "day": "Monday", "attendance": 85 },
    { "day": "Tuesday", "attendance": 78 },
    ...
  ]
}
```

#### GET /api/statistics/departments
**Purpose:** Get department-wise attendance statistics
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "departments": [
    {
      "name": "Engineering",
      "present": 95,
      "total": 100,
      "rate": "95%"
    },
    ...
  ]
}
```

#### GET /api/activity/recent
**Purpose:** Get recent activity log (admin only)
**Headers:**
```
Authorization: Bearer {token}
```
**Response:**
```json
{
  "activities": [
    {
      "user": "John Doe",
      "action": "Marked Present",
      "timestamp": "2 mins ago",
      "location": "New York, USA"
    },
    ...
  ]
}
```

---

### 5.6 Settings Endpoints

#### PUT /api/settings/profile
**Purpose:** Update user profile
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "name": "Updated Name",
  "email": "newemail@company.com",
  "phone": "+1 555-111-2222"
}
```
**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user */ }
}
```

#### POST /api/settings/password
**Purpose:** Change password
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```
**Response:**
```json
{
  "message": "Password changed successfully"
}
```

#### POST /api/settings/preferences
**Purpose:** Save system preferences
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "cameraAccess": true,
  "notificationsEnabled": true,
  "exportFormat": "csv"
}
```
**Response:**
```json
{
  "message": "Preferences saved successfully"
}
```

#### POST /api/settings/api-keys
**Purpose:** Save LMS/HRM API keys
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
**Request:**
```json
{
  "lmsApiKey": "encrypted_key",
  "hrmApiKey": "encrypted_key"
}
```
**Response:**
```json
{
  "message": "API keys saved successfully"
}
```

---

## 6. Data Models & Schema

### 6.1 Users Table
```
users
├── id (VARCHAR 20, PRIMARY KEY) - e.g., "EMP001", "ADM001"
├── name (VARCHAR 100)
├── email (VARCHAR 100, UNIQUE)
├── password_hash (VARCHAR 255)
├── role (ENUM: 'admin', 'employee')
├── department (VARCHAR 50)
├── phone (VARCHAR 20)
├── address (TEXT)
├── status (ENUM: 'Active', 'Inactive')
├── join_date (DATE)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP, NULL for active users)
```

### 6.2 Face Encodings Table
```
face_encodings
├── id (VARCHAR 50, PRIMARY KEY)
├── user_id (VARCHAR 20, FOREIGN KEY → users.id)
├── encoding_vector (LONGBLOB) - 128-D numpy array as binary
├── image_url (VARCHAR 255) - path to stored image
├── captured_at (TIMESTAMP)
├── quality_score (FLOAT 0-1) - optional quality metric
├── status (ENUM: 'pending', 'verified', 'rejected')
├── created_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)
```

### 6.3 Attendance Records Table
```
attendance_records
├── id (INT, PRIMARY KEY, AUTO_INCREMENT)
├── user_id (VARCHAR 20, FOREIGN KEY → users.id)
├── timestamp (DATETIME)
├── status (ENUM: 'Present', 'Absent', 'Late')
├── recognition_confidence (FLOAT 0-1) - match confidence score
├── location (VARCHAR 100) - optional location info
├── image_proof_url (VARCHAR 255) - proof image path
├── created_at (TIMESTAMP)
└── notes (TEXT, optional)
```

### 6.4 Settings Table
```
user_settings
├── user_id (VARCHAR 20, PRIMARY KEY, FOREIGN KEY → users.id)
├── camera_access (BOOLEAN)
├── notifications_enabled (BOOLEAN)
├── export_format (ENUM: 'csv', 'pdf', 'excel')
├── lms_api_key (VARCHAR 255, encrypted)
├── hrm_api_key (VARCHAR 255, encrypted)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 6.5 Activity Log Table (Optional)
```
activity_log
├── id (INT, PRIMARY KEY, AUTO_INCREMENT)
├── user_id (VARCHAR 20, FOREIGN KEY → users.id)
├── action (VARCHAR 100)
├── details (JSON)
├── location (VARCHAR 100)
├── ip_address (VARCHAR 45)
├── created_at (TIMESTAMP)
└── device_info (JSON)
```

---

## 7. Component Architecture

### 7.1 Data Flow Diagram

```
LoginPage (Entry)
    ↓
    ├→ [POST /api/auth/login] → Backend
    └→ localStorage.setItem('authToken', token)
    ↓
App.jsx (Routes)
    ├→ Dashboard (Employee)
    │   ├→ [GET /api/statistics/dashboard]
    │   └→ [GET /api/attendance/records?userId=...]
    │
    ├→ AdminDashboard (Admin)
    │   ├→ [GET /api/statistics/dashboard]
    │   ├→ [GET /api/statistics/weekly]
    │   ├→ [GET /api/statistics/departments]
    │   └→ [GET /api/activity/recent]
    │
    ├→ RegisterFace
    │   └→ [POST /api/faces/register] (multipart form-data)
    │
    ├→ AttendancePage
    │   ├→ [POST /api/attendance/mark] (with image)
    │   └→ [GET /api/attendance/records?userId=...]
    │
    └→ AdminUserManagement
        ├→ [GET /api/users]
        ├→ [POST /api/users]
        ├→ [PUT /api/users/:id]
        └→ [DELETE /api/users/:id]
```

### 7.2 Component Hierarchy

```
App.jsx
├── LandingPage
├── LoginPage
├── Dashboard
│   ├── Sidebar
│   ├── Navbar
│   └── [Stats Cards & Tables]
├── AdminDashboard
│   ├── AdminSidebar
│   ├── Navbar
│   └── [Charts & Analytics]
├── RegisterFace
│   ├── Sidebar
│   ├── Navbar
│   └── [Camera & Image Gallery]
├── AttendancePage
│   ├── Sidebar
│   ├── Navbar
│   └── [Recognition & Records]
├── AdminUserManagement
│   ├── AdminSidebar
│   ├── Navbar
│   └── [User Cards & Dialogs]
└── SettingsPage
    ├── Sidebar/AdminSidebar
    ├── Navbar
    └── [Settings Forms]
```

---

## 8. Integration Points

### 8.1 How to Connect to Flask Backend

1. **Update API Base URL** in environment configuration:
   - Create a `.env` file in the frontend root:
     ```
     VITE_API_BASE_URL=http://localhost:5000
     ```
   - Or hardcode in a config file: `src/config/api.js`

2. **Fetch Example:**
   ```javascript
   const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

   // Login request
   const response = await fetch(`${API_URL}/api/auth/login`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password, role })
   });
   const data = await response.json();
   if (response.ok) {
     localStorage.setItem('authToken', data.token);
     // Navigate to dashboard
   }
   ```

3. **Protected API Calls:**
   ```javascript
   const response = await fetch(`${API_URL}/api/statistics/dashboard`, {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('authToken')}`
     }
   });
   ```

### 8.2 Error Handling

The frontend expects backend to return appropriate HTTP status codes:
- **200**: Success
- **201**: Resource created
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (no permission)
- **404**: Not found
- **500**: Server error

Error response format:
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { /* optional detailed info */ }
}
```

---

## 9. Authentication Flow

### 9.1 Initial Setup

1. User opens app → sees `LandingPage`
2. User clicks "Login" → redirects to `LoginPage`
3. `LoginPage` has two tabs: **Login** and **Register**

### 9.2 Login Flow

```
User fills email, password, role
    ↓
Clicks "Login" button
    ↓
Frontend: POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Backend returns user data + JWT token
    ↓
Frontend saves token in localStorage
    ↓
App renders Dashboard (based on user role)
```

### 9.3 Registration Flow

```
New user fills name, email, password, role
    ↓
Clicks "Register" button
    ↓
Frontend: POST /api/auth/register
    ↓
Backend creates user in database
    ↓
Backend returns user data + JWT token
    ↓
Frontend saves token + redirects to Dashboard
```

### 9.4 Token Management

- **Storage**: `localStorage.setItem('authToken', token)`
- **Retrieval**: `localStorage.getItem('authToken')`
- **Usage**: All API calls include header: `Authorization: Bearer {token}`
- **Logout**: Clear token from localStorage and redirect to LoginPage

### 9.5 Role-Based Access Control

After login, the app checks `user.role`:
- **'admin'**: Routes to Admin Dashboard, Admin Sidebar
- **'employee'**: Routes to Employee Dashboard, Regular Sidebar

This is currently checked client-side; backend should also validate permissions.

---

## 10. File Upload Requirements

### 10.1 Face Image Upload

**Endpoint:** POST /api/faces/register

**Requirements:**
- **Format:** JPEG, PNG (common image formats)
- **Size:** Less than 5MB per image
- **Dimensions:** At least 320x240 pixels (recommend 640x480+)
- **Multiple files:** 5-7 images in single request
- **Content-Type:** multipart/form-data

**Frontend sends:**
```javascript
const formData = new FormData();
formData.append('userId', user.id);
capturedImages.forEach((img, idx) => {
  formData.append('images', img.blob); // Browser Blob object
});

await fetch(`${API_URL}/api/faces/register`, {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    // DO NOT set Content-Type; browser will auto-set with boundary
  }
});
```

**Backend should:**
1. Validate file types (JPEG, PNG)
2. Validate file sizes
3. Save original images to disk (e.g., `storage/faces/user_EMP001_1.jpg`)
4. Use `face_recognition` or `dlib` to extract face encoding
5. Store encoding in database (face_encodings table)
6. Return URLs where images are stored

### 10.2 Attendance Proof Image

**Endpoint:** POST /api/attendance/mark

**Similar requirements as face registration:**
- Single image file
- JPEG/PNG format
- Less than 5MB
- Frontend extracts face and sends for recognition

---

## 11. Deployment & Setup

### 11.1 Frontend Setup (Development)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Output: Local: http://localhost:3000/
```

### 11.2 Frontend Build (Production)

```bash
# Build optimized version
npm run build

# Output: build/ folder with optimized files
# Deploy `build/` contents to web server
```

### 11.3 Environment Configuration

Create `.env` file in `frontend/` root:
```
VITE_API_BASE_URL=http://your-backend-url:5000
VITE_APP_NAME=Face Recognition Attendance System
VITE_ENABLE_GOOGLE_OAUTH=false  # Set to true when OAuth is implemented
```

### 11.4 CORS Configuration (Backend)

The frontend will make HTTP requests from a different origin. Backend should enable CORS:

**Flask example:**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:3000", "https://yourdomain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}})
```

### 11.5 Storage Folders (Backend)

Create these folders on your server:
```
backend/storage/
├── faces/           # Store original face images
│   ├── user_EMP001_1.jpg
│   ├── user_EMP001_2.jpg
│   └── ...
├── proofs/          # Store attendance proof images
│   ├── att_20241114_091530.jpg
│   └── ...
└── exports/         # Store exported CSV/PDF files
    ├── attendance_report_20241114.csv
    └── ...
```

---

## 12. Testing Checklist

Before handing over to production, backend team should test:

### 12.1 Authentication
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent email
- [ ] User can register new account
- [ ] Registration prevents duplicate emails
- [ ] Logout clears token from localStorage
- [ ] Token expires after configured time
- [ ] Expired token redirects to login

### 12.2 User Management (Admin)
- [ ] Admin can view all users
- [ ] Admin can filter users by role/department
- [ ] Admin can create new user
- [ ] Admin can edit user information
- [ ] Admin can delete user
- [ ] Non-admins cannot access user management
- [ ] Deleted users don't appear in lists

### 12.3 Face Registration
- [ ] User can upload 5-7 face images
- [ ] Images are stored in backend
- [ ] Face encodings are generated and stored
- [ ] User cannot register without minimum 5 images
- [ ] Image file size/type validation works
- [ ] Same user can re-register faces (updates encodings)

### 12.4 Attendance Marking
- [ ] User can mark attendance with face image
- [ ] Face recognition matches correct user
- [ ] Confidence score is calculated
- [ ] Attendance record is created with timestamp
- [ ] Duplicate attendance on same day is handled
- [ ] Attendance records are filterable by date

### 12.5 Dashboards
- [ ] Dashboard loads statistics without errors
- [ ] Statistics are calculated correctly
- [ ] Charts render with correct data
- [ ] Pagination works for large datasets
- [ ] Export to CSV/PDF works
- [ ] Responsive design works on mobile

### 12.6 API Response Format
- [ ] All endpoints return consistent JSON format
- [ ] Error messages are clear and helpful
- [ ] Pagination info is included in list responses
- [ ] Timestamps are in ISO 8601 format
- [ ] Null values are handled gracefully

### 12.7 Security
- [ ] All endpoints require authentication
- [ ] Passwords are hashed (never stored plain-text)
- [ ] Sensitive data is not returned unnecessarily
- [ ] Admin-only endpoints enforce authorization
- [ ] File uploads are validated
- [ ] SQL injection is prevented
- [ ] CORS headers are correctly set

### 12.8 Performance
- [ ] API responses are under 1 second (for typical queries)
- [ ] Large file uploads don't timeout
- [ ] Database queries are optimized
- [ ] Images are stored efficiently (consider compression)

---

## 13. Common Issues & Solutions

### Issue: "CORS Error" when frontend calls backend
**Solution:**
- Ensure backend has CORS enabled
- Check that origin URLs match (http vs https, localhost vs domain)
- Verify backend is running on correct port

### Issue: "Token expired" after login
**Solution:**
- Backend should return longer token expiry time (e.g., 7 days)
- Implement token refresh endpoint to get new token
- Frontend should handle 401 errors and prompt to login again

### Issue: Face recognition always fails
**Solution:**
- Verify face images have clear, front-facing faces
- Ensure images are properly stored and retrievable
- Check that face_recognition library is correctly installed on backend
- Adjust confidence threshold if too strict (try 0.6 instead of 0.9)

### Issue: File uploads fail
**Solution:**
- Check file size limits on backend
- Ensure storage directory is writable
- Verify multipart form-data is correctly parsed
- Check that file path is accessible

---

## 14. Next Steps for Backend Team

1. **Database Setup:**
   - Create MySQL database with tables from Section 6
   - Set up indexes on frequently queried columns (user_id, timestamp, etc.)

2. **API Implementation:**
   - Implement all endpoints from Section 5 in Flask
   - Add input validation and error handling
   - Set up JWT authentication middleware

3. **Face Recognition Setup:**
   - Install face_recognition, dlib, and opencv-python libraries
   - Test face encoding generation
   - Set up storage directories for images

4. **Testing:**
   - Run through testing checklist in Section 12
   - Test with frontend application
   - Load test with multiple concurrent users

5. **Integration:**
   - Deploy frontend and backend to same server/cloud
   - Configure CORS and environment variables
   - Set up SSL/HTTPS for production

---

## 15. Support & Documentation

### Frontend Technologies
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com

### Backend Technologies (ML)
- **face_recognition:** https://github.com/ageitgey/face_recognition
- **dlib:** http://dlib.net
- **OpenCV:** https://opencv.org
- **Flask:** https://flask.palletsprojects.com

---

## Conclusion

This frontend application is **production-ready** and fully prepared for backend integration. All components are cleaned of mock data, and API integration points are clearly marked with TODO comments in the code.

The backend team should:
1. Implement all API endpoints as specified
2. Set up database schema as defined
3. Integrate face recognition ML libraries
4. Test thoroughly with this frontend
5. Deploy and monitor in production

**Questions?** Refer to component TODO comments in the code or the specific API section above.

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Status:** Production Ready for Backend Integration

