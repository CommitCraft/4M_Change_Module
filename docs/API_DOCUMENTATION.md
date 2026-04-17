# 4M Change Management API Documentation

## 1. Base Information

Base URL:
- `http://localhost:5000/api`

Health endpoint (outside `/api`):
- `GET /health`

Response format helpers:
- Success: `{ success: true, message, data }`
- Error: `{ success: false, message, details? }`

## 2. Authentication

Most endpoints require:
- Header: `Authorization: Bearer <JWT_TOKEN>`

Auth endpoints:

1. `POST /auth/login`
- Description: Login using email and password
- Body:
```json
{
  "email": "admin@example.com",
  "password": "Password@123"
}
```

2. `GET /auth/profile`
- Description: Get logged-in user profile
- Auth required: Yes

## 3. Common Validations

- ID params: positive integer
- Status fields: mostly `Active`/`Inactive`
- Change type: `Man | Machine | Method | Material`
- Risk level: `Low | Medium | High | Critical`

## 4. Module-wise API Reference

## 4.1 Change Requests

Prefix: `/change-requests`

1. `GET /change-requests/dashboard/stats`
- Permission: `dashboard.view` OR `changes.read`
- Query: none

2. `POST /change-requests`
- Permission: `changes.create`
- Body (minimum practical payload):
```json
{
  "type": "Machine",
  "title": "Fixture replacement",
  "description": "Replace fixture for stability",
  "current_state": "Old fixture with wear",
  "proposed_change": "Install new fixture model",
  "reason": "High vibration and quality drift",
  "impact_analysis": "Improves repeatability",
  "risk_level": "Medium",
  "department": "Production"
}
```

3. `GET /change-requests`
- Permission: `changes.read` OR `changes.update`
- Query params:
  - `page`, `limit`
  - `type`, `status`, `department`
  - `search`
  - `sortBy`: `id|title|type|department|status|risk_level|created_at|updated_at`
  - `sortOrder`: `ASC|DESC`

4. `GET /change-requests/:id`
- Permission: `changes.read`

5. `PUT /change-requests/:id`
- Permission: any of `changes.update|changes.implement|changes.monitor|changes.close`
- Body supports lifecycle fields like status, risk_level, training_status, monitoring_period, monitoring_comments, etc.

6. `DELETE /change-requests/:id`
- Permission: `changes.delete`

## 4.2 Approvals

Prefix: `/approvals`

1. `POST /approvals`
- Permission: `approvals.approve`
- Body:
```json
{
  "request_id": 1,
  "status": "Approved",
  "remarks": "Looks good"
}
```

2. `PATCH /approvals/:approval_id`
- Permission: `approvals.change` OR `approvals.approve`
- Body:
```json
{
  "request_id": 1,
  "approval_id": 10,
  "status": "Rejected",
  "remarks": "Need more evidence"
}
```

3. `GET /approvals/:request_id`
- Permission: `approvals.read`

## 4.3 Users

Prefix: `/users`

1. `GET /users`
- Permission: `users.read`

2. `POST /users`
- Permission: `users.create`
- Body:
```json
{
  "name": "QA User",
  "email": "qa.user@example.com",
  "password": "Password@123",
  "role": "User",
  "department_id": 1
}
```

3. `PUT /users/me`
- Permission: authenticated user
- Body: any of `name|email|password`

4. `PUT /users/:id`
- Permission: `users.update`

5. `DELETE /users/:id`
- Permission: `users.delete`

## 4.4 Roles

Prefix: `/roles`

1. `GET /roles`
- Permission: `roles.read`

2. `GET /roles/:id`
- Permission: `roles.read`

3. `POST /roles`
- Permission: `roles.create`
- Body:
```json
{
  "name": "ShiftLead",
  "permissions": ["changes.read", "changes.update"]
}
```

4. `PUT /roles/:id`
- Permission: `roles.update`

5. `DELETE /roles/:id`
- Permission: `roles.delete`

## 4.5 Files and Attachments

Prefix: `/files`

1. `GET /files/request/:id`
- Permission: `attachments.read`

2. `POST /files/:id/upload`
- Permission: `attachments.upload`
- Form data:
  - key: `file`
  - type: file

3. `GET /files/:filename`
- Permission: `attachments.read`

4. `DELETE /files/:id`
- Permission: `attachments.delete`

## 4.6 Guided Setup

Prefix: `/guided-setup`

`flow_type` must be one of: `Man|Machine|Method|Material`

1. `GET /guided-setup/:flow_type`
- Permission: `guidedsetup.<flow>.read`

2. `PUT /guided-setup/:flow_type`
- Permission: `guidedsetup.<flow>.update`
- Body:
```json
{
  "completed_steps": [1, 2],
  "current_step_index": 2,
  "draft_forms": {
    "step1": { "name": "sample" }
  }
}
```

3. `DELETE /guided-setup/:flow_type`
- Permission: `guidedsetup.<flow>.update`

## 4.7 Generic Masters

Prefix: `/masters`

Valid categories:
- department
- production_line
- machine
- change_subtype
- risk_level
- operator
- skill
- operator_skill_map
- machine_skill_requirement
- method_skill_map
- material_skill_map
- training_program
- type_requirement
- type_action_template

1. `GET /masters`
- Query:
  - `category` (optional)
  - `type` (optional)
  - `status` (optional)

2. `POST /masters`
- Body:
```json
{
  "category": "department",
  "name": "Quality",
  "status": "Active"
}
```
- For categories like `change_subtype`, `operator_skill_map`, `machine_skill_requirement`, `training_program`, `type_requirement`, `type_action_template`, `type` is required.

3. `PUT /masters/:id`
- Similar body as create, including `category`

4. `DELETE /masters/:id`
- Note: currently permission check is `changes.update`

## 4.8 Specific Master Entity Endpoints

Each endpoint below follows CRUD (`GET`, `POST`, `PUT /:id`, `DELETE /:id`) and requires auth.

- `/departments`
- `/production-lines`
- `/machines`
- `/change-subtypes`
- `/operators`
- `/skills`
- `/operator-skill-maps`
- `/machine-skill-requirements`
- `/training-programs`
- `/type-requirements`
- `/type-action-templates`
- `/monitoring-periods`
- `/risk-levels`

Typical payloads:

Simple name/status entity:
```json
{
  "name": "Assembly Line 1",
  "status": "Active"
}
```

Type + name/status entity:
```json
{
  "type": "Machine",
  "name": "Calibration Required",
  "status": "Active"
}
```

Pair map entity:
```json
{
  "operator": "Operator A",
  "skill": "Welding",
  "status": "Active"
}
```

Machine-skill requirement:
```json
{
  "machine": "CNC-01",
  "skill": "CNC Operation",
  "status": "Active"
}
```

Training program:
```json
{
  "skill": "CNC Operation",
  "name": "CNC Advanced Training",
  "status": "Active"
}
```

## 4.9 Business Roles

Prefix: `/business-roles`

1. `GET /business-roles`
- Query:
  - `m_module`: `Man|Machine|Material|Method|User`
  - `status`: `Active|Inactive`

## 5. Error Codes

- 400: Validation failed / invalid input
- 401: Missing or invalid token
- 403: Insufficient permissions
- 404: Resource not found
- 500: Server-side exception

## 6. Postman Usage

Use collection file in docs:
- `docs/postman/4M_Change_Management.postman_collection.json`

Required variables:
- `baseUrl`
- `token`
- `changeRequestId`
- `approvalId`
- `userId`
- `roleId`
- `masterId`
- `attachmentId`
- `filename`
