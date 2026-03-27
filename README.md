# 4M Change Management System

Complete full-stack 4M change workflow platform for manufacturing operations.

## 1. What This Project Does

- Manage 4M change requests: Man, Machine, Method, Material
- Role-based workflow: SuperAdmin, Admin, Manager, User
- Approval lifecycle with audit trail
- Dashboard for monitoring and actions
- Master data management with skill mappings
- Guided setup for master data

## 2. Tech Stack

- Frontend: React + Vite + Tailwind + Axios
- Backend: Node.js + Express + Sequelize + MySQL
- Auth: JWT
- Uploads: Multer

## 3. Prerequisites (From Scratch)

- Node.js 18+ (recommended)
- npm 9+
- MySQL 8+ (or compatible)
- Git

Check versions:

```bash
node -v
npm -v
mysql --version
```

## 4. Clone and Open Project

```bash
git clone <your-repo-url>
cd 4M_Module
```

## 5. Create Environment Files

Do not commit real secrets. Use examples below:

- backend/.env.example
- frontend/.env.example

Create local working env files:

Windows (PowerShell):

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Mac/Linux/Git Bash:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then update values inside backend/.env (DB user/password, JWT secret, etc.).

## 6. Database Setup

Create DB:

```sql
CREATE DATABASE IF NOT EXISTS change_management;
```

Optional: run provided SQL docs manually if needed:

- docs/schema.sql
- docs/seed_data.sql

Note: backend bootstrap also creates required tables and default master records.

## 7. Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

## 8. Run the Application

Start backend (Terminal 1):

```bash
cd backend
npm run dev
```

Start frontend (Terminal 2):

```bash
cd frontend
npm run dev
```

Default URLs:

- Frontend: http://localhost:5174
- Backend: http://localhost:5000
- Health check: http://localhost:5000/health

## 9. First Login (Step by Step)

1. Open frontend URL.
2. Login using SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD from backend/.env.
3. Go to Masters page and validate basic master data.
4. Create a change request.
5. Review/approve based on role permissions.
6. Track in Dashboard.

## 10. Core Functional Flow (User Guideline)

1. Authentication:
- Login from Login page.

2. Masters Setup:
- Add departments, machines, operators, skills.
- Add mapping tabs (Machine Skill Matrix, Operator Skills, Method/Material Skill Matrix).

3. Guided Setup:
- Use guided page to configure mapping and requirements quickly.

4. Create Change Request:
- Fill 4M details, impact, risk, and submit.

5. Approval Workflow:
- Approvers review and approve/reject.

6. Implementation + Monitoring:
- Update implementation state and monitor results.

7. Reports and Audit:
- Use dashboard/reports and audit logs for traceability.

## 11. API Summary

- Auth: /api/auth/*
- Users: /api/users/*
- Roles: /api/roles/*
- Changes: /api/change/*
- Approvals: /api/approval/*
- Files: /api/files/*
- Masters: /api/masters/*
- Guided Setup: /api/guided-setup/*

For full request/response examples see docs/API_DOCUMENTATION.md.

## 12. Troubleshooting

1. Frontend not connecting to backend:
- Check frontend/.env VITE_API_BASE_URL.
- Check backend running on correct port.

2. CORS error:
- Check backend/.env CORS_ORIGIN matches frontend URL.

3. DB connection error:
- Verify DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT.

4. Unauthorized or redirects to login:
- Token may be expired/invalid; login again.
- Verify role permissions.

## 13. Security Notes

- Never commit real .env files.
- Rotate JWT_SECRET for production.
- Use strong SUPERADMIN_PASSWORD.
- Set NODE_ENV=production and proper secure DB configuration in production.

## 14. Repository Files You Should Commit

- README.md
- backend/.env.example
- frontend/.env.example

Do not commit:

- backend/.env
- frontend/.env
- node_modules
- runtime logs
