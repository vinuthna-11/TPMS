# TPMS – Talent Portfolio Management System

A full-stack web application developed to help users create, manage, and showcase their professional portfolios in a centralized platform. TPMS enables users to maintain personal information, academic records, technical skills, projects, certifications, achievements, and career-related details while providing secure authentication and profile management features.

The system is built using React.js for the frontend and Django for the backend, providing a modern and scalable architecture for portfolio management.

---

## Overview

Talent Portfolio Management System (TPMS) allows users to build a digital portfolio that highlights their skills, projects, certifications, and achievements. The platform provides secure authentication, profile management, media uploads, and email-based OTP verification.

---

## Features

### User Authentication
- User Registration
- Secure Login and Logout
- OTP-Based Email Verification
- Session Management
- Password Recovery Support

### Portfolio Management
- Personal Profile Creation
- Profile Picture Upload
- Academic Information Management
- Skills Management
- Project Portfolio Management
- Certifications Tracking
- Achievements Management

### Dashboard
- Personalized Dashboard
- Portfolio Overview
- Profile Completion Tracking
- Quick Access to Portfolio Sections

### Media Management
- Profile Picture Upload
- Media File Storage
- Portfolio Asset Management

### Security Features
- Email OTP Verification
- Secure Authentication
- Protected User Sessions
- REST API Security

### Communication
- Automated OTP Email Delivery
- Email Templates
- Verification Notifications

---

## Technology Stack

### Frontend
- React.js
- JavaScript (ES6+)
- HTML5
- CSS3

### Backend
- Django
- Django REST Framework

### Database
- SQLite

### Additional Technologies
- REST APIs
- SMTP Email Services
- OTP Verification System
- Git
- GitHub

---

## Project Structure

```text
TPMS/
│
├── backend/
│   ├── api/
│   ├── media/
│   ├── templates/
│   ├── tpms/
│   ├── manage.py
│   ├── package.json
│   └── test.http
│
├── tpms/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── README.md
└── src.zip
```

---

## Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/vinuthna-11/TPMS.git
cd TPMS
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### macOS/Linux

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Apply Migrations

```bash
python manage.py migrate
```

### Run Backend Server

```bash
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/
```

---

## Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd tpms
```

### Install Dependencies

```bash
npm install
```

### Start Frontend

```bash
npm start
```

Frontend URL:

```text
http://localhost:3000/
```

---

## Email Configuration

To enable OTP email verification, configure email settings in:

```text
backend/tpms/settings.py
```

Example:

```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "your-email@gmail.com"
EMAIL_HOST_PASSWORD = "your-app-password"
```

---

## Application Workflow

1. User Registration
2. OTP Verification
3. User Login
4. Profile Creation
5. Portfolio Management
6. Skills and Project Updates
7. Certification Management
8. Dashboard Monitoring

---

## Screenshots

Add screenshots of the application here.

### Login Page

![Login Page](screenshots/login.png)

### Registration Page

![Registration Page](screenshots/register.png)

### OTP Verification

![OTP Verification](screenshots/otp.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Portfolio Page

![Portfolio](screenshots/portfolio.png)

---

## Future Enhancements

- Resume Builder
- Resume Download as PDF
- Portfolio Sharing Links
- AI-Based Portfolio Analysis
- Recruiter Dashboard
- Analytics and Insights
- Portfolio Templates
- Social Media Integration
- Cloud Storage Support

---

## Learning Outcomes

- Developed a full-stack web application using React.js and Django.
- Implemented secure authentication and authorization mechanisms.
- Integrated OTP-based email verification.
- Built RESTful APIs for frontend-backend communication.
- Managed media uploads and user-generated content.
- Applied version control using Git and GitHub.

---
## License

This project is developed for educational and learning purposes.
