# 4M Change Management User Guide

## 1. Overview

4M Change Management system is used to manage change requests across:
- Man
- Machine
- Method
- Material

The platform supports:
- Request creation and tracking
- Multi-stage approvals
- Implementation and monitoring
- Role-based access control (RBAC)
- Master data management
- Guided setup workflows

## 2. Who Uses This System

- SuperAdmin: Full access
- Admin: Management, approvals, implementation, monitoring
- Manager: Approvals and change visibility
- User and 4M users (ManUser, MachineUser, MethodUser, MaterialUser, GeneralUser): Requester and module-level operations

## 3. Quick Start (Local)

## 3.1 Backend Setup

1. Go to backend folder.
2. Install dependencies:
   - npm install
3. Create `.env` from `backend/.env.example`.
4. Configure DB and JWT values.
5. Start backend:
   - npm run dev

Default backend URL:
- http://localhost:5000

## 3.2 Frontend Setup

1. Go to frontend folder.
2. Install dependencies:
   - npm install
3. Create `.env` from `frontend/.env.example`.
4. Start frontend:
   - npm run dev

Default frontend URL:
- http://localhost:5174

## 3.2.1 Frontend Network/LAN Setup

If backend is running on another machine in same network, set frontend env values like:

- `VITE_API_BASE_URL=http://192.168.1.33:5000/api`
- `VITE_DEV_API_PROXY_TARGET=http://192.168.1.33:5000`

Then restart frontend dev server.

## 3.3 Demo Users

If `SEED_DEMO_DATA=true` in backend env, sample accounts from `backend/TEST_LOGINS.md` are created.

Example:
- superadmin@example.com / change_this_password
- admin@example.com / Password@123
- manager@example.com / Password@123
- man.user@example.com / Password@123

## 4. Login and Session

1. Open frontend login page.
2. Enter email/password.
3. On success, token is stored in localStorage.
4. Every API request sends `Authorization: Bearer <token>` automatically.
5. If token expires or is invalid, user is redirected to login.

## 5. Main Navigation and Features

## 5.1 Dashboard

Purpose:
- High-level visibility of request and status trends.

Access:
- Permission: `dashboard.view`

## 5.2 Change Requests

Pages:
- Changes list
- Create change
- Request detail

Typical flow:
1. Create request with type, title, impact, risk, and department.
2. Request appears in list and enters approval cycle.
3. Open detail page to update or review lifecycle.

Key statuses:
- Pending
- Approved
- Rejected
- Implemented
- Closed

## 5.3 Approvals

Purpose:
- Approvers decide Approved/Rejected with remarks.

Access:
- Permission: `approvals.approve`
- Role gates in frontend: Manager, Admin, SuperAdmin

## 5.4 Implementation and Monitoring

Implementation page:
- Tracks implementation details after approvals.

Monitoring page:
- Tracks post-implementation quality and monitoring period outcomes.

Typical access:
- `changes.implement`
- `changes.monitor`

## 5.5 Masters and Master Categories

Purpose:
- Manage reference data such as departments, machines, skills, risk levels, etc.

Examples:
- Departments
- Production lines
- Machines
- Operators
- Skills
- Change subtypes
- Monitoring periods
- Type requirements
- Type action templates

## 5.6 Guided Setup

Purpose:
- Flow-based setup for Man, Machine, Method, Material.

Actions:
- Save draft progress
- Continue from previous step
- Reset flow progress

## 5.7 Admin Features

Users:
- Create/update/delete users
- Update own profile via `/users/me`

Roles:
- Create and manage roles
- Maintain permission matrix

## 6. End-to-End Business Flow

1. Requester creates a change request.
2. Manager/Admin opens approvals queue.
3. Request is approved/rejected with remarks.
4. On approval, implementation is executed.
5. Monitoring is done for compliance/quality checks.
6. Request can be closed after completion.

## 7. File Upload Workflow

Supported files:
- JPEG
- PNG
- PDF
- XLS
- XLSX

Limit:
- Max 10 MB per file

Usage:
1. Open request detail.
2. Upload attachment.
3. Download/view as needed.
4. Delete when required by permission.

## 8. Permission Notes

- Backend enforces permission checks at route level.
- SuperAdmin bypasses permission checks.
- Most features are both route-protected and UI-protected.

If user sees "Insufficient permissions":
- Verify role permission mapping.
- Verify the route permission in role config.

## 9. Common Errors and Fixes

1. Login fails:
- Check email/password.
- Check user exists and role is active.

2. 401 Unauthorized:
- Token missing/expired.
- Re-login and retry.

3. 403 Insufficient permissions:
- Role lacks required permission.
- Update role permissions in Roles module.

4. File upload error:
- File type unsupported or file size too large.

5. API not reachable from frontend:
- Verify `VITE_API_BASE_URL`.
- Verify backend is running and CORS origin is correct.

## 10. Operational Tips

- Keep `SEED_DEMO_DATA=false` in production.
- Set strong `JWT_SECRET` and rotate periodically.
- Restrict CORS origin in production.
- Take DB backups before major role/masters changes.
