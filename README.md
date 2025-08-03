# Corporate Ride Scheduling System

A MERN stack application for corporate ride booking, management, and admin approval workflows.

## Features

- User registration, login, profile update, password reset
- Book, view, filter, and cancel rides
- Admin panel: view/filter/approve/reject rides, analytics
- Audit logging, soft delete, JWT authentication
- Responsive, modern UI

## Tech Stack

- MongoDB, Express, React, Node.js

## Getting Started

### 1. Clone the repo

```sh
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
```

### 2. Backend Setup

```sh
cd backend
npm install
# Create a .env file with:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret
# PORT=5000
npm run dev
```

### 3. Frontend Setup

```sh
cd ../frontend
npm install
npm start
```

## API Documentation

### User APIs

- `POST /api/users/register` — Register
- `POST /api/users/login` — Login
- `GET /api/users/me` — Get profile (auth)
- `PUT /api/users/me` — Update profile (auth)
- `POST /api/users/forgot-password` — Request password reset
- `POST /api/users/reset-password` — Reset password
- `DELETE /api/users/me` — Deactivate user

### Ride APIs

- `POST /api/rides` — Book ride (auth)
- `GET /api/rides` — List user rides (auth, filter/sort)
- `GET /api/rides/:id` — Ride details (auth)
- `DELETE /api/rides/:id` — Cancel ride (auth)

### Admin APIs

- `GET /api/admin/rides` — List all rides (admin, filter/sort)
- `POST /api/admin/rides/:id/approve` — Approve ride (admin)
- `POST /api/admin/rides/:id/reject` — Reject ride (admin)
- `GET /api/admin/analytics` — Ride analytics (admin)

## Environment Variables

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for JWT
- `PORT` — Backend port (default 5000)

🎯** Features Implemented**

🔐 Secure user registration and JWT-based login

🎭 Role-based routing (admin vs. user)

🧑‍💼 Admin dashboard with ride approval/rejection

📊 Analytics of daily rides

📌 Smart ride booking with pickup/drop info

📁 AdminAction logs linked to rides

🚨 Email/password reset (in progress or planned)

🧾 Mongoose schema with virtuals, indexes, and validations

🧪 Tech Stack
Backend: Node.js, Express.js, MongoDB, Mongoose, JWT

Frontend: React.js (with React Router), Axios, TailwindCSS

Others: Toast notifications, protected routes, secure password hashing (bcrypt)

