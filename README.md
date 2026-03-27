# 4M Change Management System - Setup Guide

## System Requirements

- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- npm or yarn
# 4M Change Management System

Production-ready full-stack 4M change workflow platform for manufacturing environments.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Axios, React Router, Chart.js
- Backend: Node.js, Express, Sequelize ORM (MySQL), JWT, RBAC, Multer

## Core Capabilities

- JWT authentication with protected routes
- RBAC roles: SuperAdmin, Admin, Manager, User
- Idempotent SuperAdmin auto-bootstrap on server start
- Change lifecycle: Create -> Approve -> Implement -> Audit
- 4M categories: Man, Machine, Method, Material
- Transactional approval flow with audit logs
- File attachments served from /uploads
- Dashboard analytics and recent activity
- Search, filters, pagination, sort, role-based listing
- Dark mode and toast notifications

## Project Structure

```
4M_Module/
    backend/
        src/
            config/
            controllers/
            middleware/
            models/
            routes/
            utils/
            server.js
    frontend/
        src/
            components/
            context/
            pages/
            services/
            utils/
            App.jsx
    docs/
        API_DOCUMENTATION.md
        schema.sql
        seed_data.sql
        POSTMAN_COLLECTION.json
```

## Environment

Backend env file: backend/.env

```
SUPERADMIN_EMAIL=superadmin@example.com
SUPERADMIN_PASSWORD=Super@123

JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=change_management
DB_PORT=3306

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## Setup

1. Create database in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS change_management;
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Start backend:

```bash
npm run dev
```

4. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

5. Start frontend:

```bash
npm run dev
```

## Startup Behavior

On backend startup, Sequelize syncs all models and then:

1. Ensures all roles exist
2. Ensures SuperAdmin from env exists
3. Hashes SuperAdmin password via bcrypt hooks

The process is idempotent and safe to run repeatedly.

## API Summary

- Auth: POST /api/auth/login, GET /api/auth/profile
- Users: GET/POST/PUT/DELETE /api/users
- Change Requests: POST/GET/GET:id/PUT:id/DELETE:id /api/change
- Approval: POST /api/approval, GET /api/approval/:request_id
- Files: POST /api/files/:id/upload, GET /api/files/request/:id, GET /api/files/:filename, DELETE /api/files/:id

See docs/API_DOCUMENTATION.md for complete payload and response examples.

## Build Status

- Frontend production build: successful
- Backend is configured and uses Sequelize sync; runtime requires valid MySQL credentials in backend/.env
- Email: `manager@example.com`
