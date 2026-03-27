# Quick Start (Windows)

## Prerequisites

- Node.js 18+
- MySQL 8+
- npm

## 1. Create Database

```sql
CREATE DATABASE IF NOT EXISTS change_management;
```

## 2. Backend

```bash
cd C:\Users\DELL\Downloads\4M_Module\backend
copy .env.example .env
npm install
npm run dev
```

Backend runs at http://localhost:5000

Set these values in backend/.env before running:

- SUPERADMIN_EMAIL=superadmin@example.com
- SUPERADMIN_PASSWORD=Super@123
- DB_HOST=localhost
- DB_USER=root
- DB_PASS=your_mysql_password
- DB_NAME=change_management
- JWT_SECRET=your_secret_key

## 3. Frontend

Open a second terminal:

```bash
cd C:\Users\DELL\Downloads\4M_Module\frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## 4. First Login

Use the SuperAdmin credentials from backend/.env:

- Email: SUPERADMIN_EMAIL
- Password: SUPERADMIN_PASSWORD

The backend auto-creates this account on startup.

## 5. Smoke Checks

Health check:

```bash
curl http://localhost:5000/health
```

Login check:

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"superadmin@example.com\",\"password\":\"Super@123\"}"
```

## 6. Test Flow

1. Login
2. Create a change request
3. Open approvals (Manager/Admin/SuperAdmin)
4. Approve/reject request
5. Mark approved request as implemented (Admin/SuperAdmin)
6. Verify dashboard updates

## Troubleshooting

- DB auth failed: verify DB_USER/DB_PASS and database exists.
- 401 on APIs: token missing/expired; login again.
- CORS issues: ensure CORS_ORIGIN matches frontend URL.
- Port conflict: change PORT in backend/.env or Vite port.
