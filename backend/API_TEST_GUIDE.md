# 4M Change Management API Test Guide

This document provides example API requests for testing the backend endpoints of the 4M Change Management System. Use these examples with Postman, Insomnia, or curl.

## Authentication

### Login (obtain JWT token)
POST /api/auth/login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "Super@123"
}
```
Response:
- 200 OK: `{ user, token }`

---

## Master Data

### Get All Departments
```
GET http://localhost:5000/api/departments
Authorization: Bearer <token>
```

### Create Department
```
POST http://localhost:5000/api/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production",
  "status": "Active"
}
```

---

## Change Requests

### Create Change Request
```
POST http://localhost:5000/api/change-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Man",
  "request_no": "CR-20260329-1200",
  "request_date": "2026-03-29",
  "department": "Production",
  "production_line": "Line 1",
  "machine": "MCH-1001",
  "sub_type": "Operator Change",
  "title": "Change Operator",
  "description": "Change operator for Line 1",
  "old_value": "Operator A",
  "new_value": "Operator B",
  "reason": "Skill upgrade",
  "quality_impact": "Low",
  "cost_impact": "Low",
  "delivery_impact": "Low",
  "safety_impact": "Low",
  "risk_level": "Low"
}
```

### Get All Change Requests
```
GET http://localhost:5000/api/change-requests
Authorization: Bearer <token>
```

---

## Users

### Get All Users
```
GET http://localhost:5000/api/users
Authorization: Bearer <token>
```

---

## Health Check
```
GET http://localhost:5000/health
```

---

Replace `<token>` with the JWT token from the login response.

For more endpoints (machines, skills, roles, etc.), use the same pattern as above, changing the URL and payload as needed.
