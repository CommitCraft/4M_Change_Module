# 4M Change Management API

Base URL:

http://localhost:5000/api

Auth header for protected routes:

Authorization: Bearer <token>

## Authentication

### POST /auth/login

Request:

```json
{
  "email": "superadmin@example.com",
  "password": "Super@123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "System SuperAdmin",
      "email": "superadmin@example.com",
      "role": "SuperAdmin"
    },
    "token": "jwt_token"
  }
}
```

### GET /auth/profile

Response:

```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "user": {
      "id": 1,
      "name": "System SuperAdmin",
      "email": "superadmin@example.com",
      "role": "SuperAdmin"
    }
  }
}
```

## Users (RBAC)

### GET /users

Access: SuperAdmin

### POST /users

Access: SuperAdmin, Admin

Request:

```json
{
  "name": "Manager A",
  "email": "manager.a@example.com",
  "password": "Manager@123",
  "role": "Manager"
}
```

### PUT /users/:id

Access: SuperAdmin, Admin

### DELETE /users/:id

Access: SuperAdmin, Admin

## Change Requests

### POST /change

Access: All authenticated users

```json
{
  "type": "Machine",
  "title": "Upgrade Filling Line Motor",
  "description": "Frequent overheating in current motor",
  "current_state": "Line downtime 3 times/week",
  "proposed_change": "Install high-efficiency motor",
  "reason": "Reduce downtime and maintenance cost",
  "impact_analysis": "Expected 20% uptime increase",
  "risk_level": "Medium",
  "department": "Production"
}
```

### GET /change

Access: All authenticated users

Query options:

- type: Man|Machine|Method|Material
- status: Pending|Approved|Rejected|Implemented
- department: string
- risk_level: Low|Medium|High
- search: string
- page: number
- limit: number
- sortBy: created_at|title|department
- sortOrder: ASC|DESC

Notes:

- User role sees only own requests.
- Manager/Admin/SuperAdmin can see all requests.

### GET /change/:id

Access: All authenticated users

Returns request details with approvals, audit logs, and attachments.

### PUT /change/:id

Access:

- Owner can update own request fields.
- Admin/SuperAdmin can update any request.
- Only Admin/SuperAdmin can set status to Implemented.
- Implemented is allowed only when current status is Approved.

### DELETE /change/:id

Access: Admin, SuperAdmin

### GET /change/dashboard/stats

Access: All authenticated users

Response structure:

```json
{
  "success": true,
  "message": "Dashboard stats fetched",
  "data": {
    "total": 12,
    "byType": {
      "Man": 3,
      "Machine": 4,
      "Method": 2,
      "Material": 3
    },
    "byStatus": {
      "Pending": 5,
      "Approved": 4,
      "Rejected": 2,
      "Implemented": 1
    },
    "recent": []
  }
}
```

## Approval

### POST /approval

Access: Manager, Admin, SuperAdmin

Transactional update using Sequelize transaction.

```json
{
  "request_id": 10,
  "status": "Approved",
  "remarks": "Verified change impact and controls"
}
```

Behavior:

- Flow order: Supervisor -> Manager -> Admin
- Role gates per stage are enforced server-side.
- Rejection immediately sets request status to Rejected.
- Final approval sets request status to Approved.
- Every approval/rejection writes an audit log.

### GET /approval/:request_id

Access: User, Manager, Admin, SuperAdmin

## Files

### POST /files/:id/upload

Access: Authenticated users

Multipart field: file

Allowed file types:

- image/jpeg
- image/png
- application/pdf
- application/vnd.ms-excel
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

### GET /files/request/:id

List attachments for request.

### GET /files/:filename

Download attachment.

### DELETE /files/:id

Access: Manager, Admin, SuperAdmin

## Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "details": []
}
```