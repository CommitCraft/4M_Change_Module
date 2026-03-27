# RBAC Testing & Verification Guide

## Overview
This document provides step-by-step testing instructions to validate the comprehensive RBAC hardening applied to the 4M Change Management System.

---

## Test Environment Setup

### Prerequisites
- Node.js v22.15.1
- MySQL 8.0+ with database initialized via bootstrap
- Fresh Postman collection or cURL commands

### Initial Data
```
# Default SuperAdmin (created via bootstrap)
Email: superadmin@example.com
Password: Super@123

# Test Users (optional - create via /users endpoint)
Admin User: admin@example.com / Pass@123
Manager User: manager@example.com / Pass@123
User: user@example.com / Pass@123
```

---

## API Endpoint Testing Matrix

### 1. Change Request Creation (`POST /api/change`)

#### Test 1.1: All Authenticated Users Can Create
```bash
# Login as any user (User/Manager/Admin/SuperAdmin)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass@123"}'

# Extract token and create change request
curl -X POST http://localhost:5000/api/change \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"Man",
    "title":"Test Change",
    "description":"Test Description",
    "current_state":"Current",
    "proposed_change":"Proposed",
    "reason":"Reason",
    "impact_analysis":"Impact",
    "risk_level":"Low",
    "department":"IT"
  }'
```

**Expected**: ✓ 201 Created (all roles)

---

### 2. Change Request Retrieval (`GET /api/change`)

#### Test 2.1: Users See Only Own Requests
```bash
# Login as User role
curl -X GET http://localhost:5000/api/change \
  -H "Authorization: Bearer {user_token}"
```

**Expected**: ✓ Only requests with `created_by === user.id`

#### Test 2.2: Manager/Admin See All Requests
```bash
# Login as Admin role
curl -X GET http://localhost:5000/api/change \
  -H "Authorization: Bearer {admin_token}"
```

**Expected**: ✓ All requests returned (no owner filter)

---

### 3. Change Request Details View (`GET /api/change/{id}`)

#### Test 3.1: User Can View Own Request
```bash
# User viewing their own request
curl -X GET http://localhost:5000/api/change/5 \
  -H "Authorization: Bearer {user_token}"
  # Assuming user created request ID 5
```

**Expected**: ✓ 200 OK - Request returned with approvals, attachments, audit logs

#### Test 3.2: User Cannot View Others' Requests
```bash
# User viewing request created by someone else
curl -X GET http://localhost:5000/api/change/3 \
  -H "Authorization: Bearer {user_token}"
  # Assuming request ID 3 was created by another user
```

**Expected**: ✗ 403 Forbidden - "You are not authorized to view this request"

#### Test 3.3: Manager Can View Any Request
```bash
curl -X GET http://localhost:5000/api/change/3 \
  -H "Authorization: Bearer {manager_token}"
```

**Expected**: ✓ 200 OK - Request returned

---

### 4. Change Request Update (`PUT /api/change/{id}`)

#### Test 4.1: User Cannot Update After Approval Started
```bash
# Create request as User
curl -X POST http://localhost:5000/api/change ...
  # Store request ID = X

# Login as Manager and approve
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {manager_token}" \
  -d '{"request_id": X, "status":"Approved", "remarks":"OK"}'

# User tries to update request
curl -X PUT http://localhost:5000/api/change/X \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{"description":"New description"}'
```

**Expected**: ✗ 403 Forbidden - "Cannot modify request after approval process has started"

#### Test 4.2: Only Admin/SuperAdmin Can Mark as Implemented
```bash
# Request is Approved (via approvals)
# Only Admin/SuperAdmin can update to Implemented

# Try as Manager
curl -X PUT http://localhost:5000/api/change/X \
  -H "Authorization: Bearer {manager_token}" \
  -d '{"status":"Implemented"}'
```

**Expected**: ✗ 403 Forbidden - "Only Admin or SuperAdmin can mark as Implemented"

#### Test 4.3: Only Admin/SuperAdmin Can Mark Implemented If Not Approved
```bash
curl -X PUT http://localhost:5000/api/change/X \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"status":"Implemented"}'
```

**Expected**: ✗ 400 Bad Request - "Only approved requests can be marked as implemented"

---

### 5. Change Request Deletion (`DELETE /api/change/{id}`)

#### Test 5.1: Only Admin/SuperAdmin Can Delete
```bash
# User tries to delete their own request
curl -X DELETE http://localhost:5000/api/change/X \
  -H "Authorization: Bearer {user_token}"
```

**Expected**: ✗ 403 Forbidden

#### Test 5.2: Admin Can Delete Any Request
```bash
curl -X DELETE http://localhost:5000/api/change/X \
  -H "Authorization: Bearer {admin_token}"
```

**Expected**: ✓ 200 OK - "Change request deleted"

---

### 6. Approval Recording (`POST /api/approval`)

#### Test 6.1: Only Manager/Admin/SuperAdmin Can Approve
```bash
# User tries to approve (should fail)
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": 5,
    "status": "Approved",
    "remarks": "Looks good"
  }'
```

**Expected**: ✗ 403 Forbidden - "Current step is Supervisor/Manager Review. Your role cannot approve at this stage."

#### Test 6.2: Self-Approval Block
```bash
# User creates request, then logs in as Manager
# Create request as User (ID = X)
# Manager approves it
# Request creator (User) tries to approve their own request while in Manager role
# (This requires user with dual roles - skip if not testing)
```

**Expected**: ✗ 400 Bad Request - "You cannot approve your own request"

#### Test 6.3: Duplicate Approval Prevention
```bash
# Manager approves request
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {manager_token}" \
  -d '{...}'  # Approve

# Same Manager tries to approve again
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {manager_token}" \
  -d '{...}'  # Approve again
```

**Expected**: ✗ 400 Bad Request - "You have already submitted an approval decision for this request"

#### Test 6.4: Step-Based Approval Enforcement
```bash
# Request with 0 approvals: Manager can approve (step 1) ✓
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {manager_token}" \
  -d '{"request_id": X, ...}'
```

**Expected**: ✓ 200 OK - Approval recorded, approvedCount now = 1

```bash
# Request with 1 approval: Now requires Admin (step 2)
# Manager tries to approve again (at step 2)
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {different_manager_token}" \
  -d '{"request_id": X, ...}'
```

**Expected**: ✗ 400 Bad Request - "Your role (Manager) cannot approve at step 2. Required: Admin or higher"

```bash
# Admin approves (step 2)
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"request_id": X, ...}'
```

**Expected**: ✓ 200 OK - Approval recorded

```bash
# Request with 2 approvals: Now requires SuperAdmin (step 3)
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {superadmin_token}" \
  -d '{"request_id": X, ...}'
```

**Expected**: ✓ 200 OK - Approval recorded, request status → "Approved"

#### Test 6.5: Approval Only for Pending Requests
```bash
# Request with status "Approved" or "Rejected" should not accept new approvals
curl -X POST http://localhost:5000/api/approval \
  -H "Authorization: Bearer {manager_token}" \
  -d '{"request_id": X, ...}'
```

**Expected**: ✗ 400 Bad Request - "Only pending requests can be approved or rejected"

---

### 7. Approval History Retrieval (`GET /api/approval/{request_id}`)

#### Test 7.1: User Can View Approvals for Own Request
```bash
curl -X GET http://localhost:5000/api/approval/5 \
  -H "Authorization: Bearer {user_token}"
  # User who created request ID 5
```

**Expected**: ✓ 200 OK - Array of approval records

#### Test 7.2: User Cannot View Approvals for Others' Requests
```bash
curl -X GET http://localhost:5000/api/approval/3 \
  -H "Authorization: Bearer {user_token}"
  # User didn't create request ID 3
```

**Expected**: ✗ 403 Forbidden - "You are not authorized to view these approvals"

#### Test 7.3: Manager/Admin Can View Any Approvals
```bash
curl -X GET http://localhost:5000/api/approval/3 \
  -H "Authorization: Bearer {manager_token}"
```

**Expected**: ✓ 200 OK - Approval history returned

---

### 8. Dashboard Statistics (`GET /api/change/dashboard/stats`)

#### Test 8.1: User Sees Only Own Stats
```bash
# User views dashboard
curl -X GET http://localhost:5000/api/change/dashboard/stats \
  -H "Authorization: Bearer {user_token}"
```

**Expected**: ✓ 200 OK - Returns stats for only this user's requests:
```json
{
  "total": 2,           // Only this user's 2 requests
  "byType": {...},
  "byStatus": {...},
  "recent": [...]       // Only their requests
}
```

#### Test 8.2: Manager Sees All Stats
```bash
curl -X GET http://localhost:5000/api/change/dashboard/stats \
  -H "Authorization: Bearer {manager_token}"
```

**Expected**: ✓ 200 OK - Returns aggregated stats for all requests across all users

---

## Frontend Route Testing

### Test 9: Route Protection via `ProtectedRoute`

| Route | Accessible By | Should Show |
|-------|---|---|
| `/login` | All | Login form |
| `/dashboard` | All authenticated | Dashboard |
| `/changes` | All authenticated | Change list |
| `/create` | All authenticated | Create form |
| `/approvals` | Manager/Admin/SuperAdmin | Approval list |
| `/users` | Admin/SuperAdmin | User management |

#### Test 9.1: Unauthorized User Redirected
```
1. Open http://localhost:5173/approvals
2. Click login, login as User role
3. Try to access /approvals manually
```

**Expected**: Redirected to /dashboard

#### Test 9.2: Authorized User Access
```
1. Login as Manager
2. Access /approvals
```

**Expected**: ✓ Approvals page loads

---

### Test 10: Approvals Page RBAC Features

#### Test 10.1: User-Specific Approval Filtering
```
1. Login as Manager
2. Go to /approvals
3. See only pending requests where:
   - User is NOT the creator
   - User's role >= current step requirement
```

**Expected**: Shows approvable requests with step indicator

#### Test 10.2: Approval Step Visualization
```
1. Find a request at step 1 (Manager approval)
2. View approval progress indicator
3. See checkmarks for completed steps
```

**Expected**: Visual step tracker shows progress (✓ ✓ ⏳)

#### Test 10.3: "Not Your Step" Button
```
1. Login as Manager
2. View request at step 2 (Admin approval needed)
3. Click "Review & Approve"
```

**Expected**: Button disabled, labeled "Not Your Step"

---

### Test 11: Change List Approvals Column

#### Test 11.1: Approval Count Display
```
1. Go to /changes
2. View table, look for "Approvals" column
3. Requests should show "0/3", "1/3", "2/3", or "3/3"
```

**Expected**: Shows completed approvals of 3 total required

---

### Test 12: Change Details Modal

#### Test 12.1: Approval History in Modal
```
1. In /changes, click "View" on any request
2. Scroll down in modal
3. See "Approval History" section
```

**Expected**: Shows all approvals with:
- Approver name and role
- Status (Approved/Rejected) with colored badge
- Remarks if any
- Timestamp

---

## User Management RBAC Testing

### Test 13: User Creation Restrictions (`POST /api/users`)

#### Test 13.1: SuperAdmin Can Create All Roles
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer {superadmin_token}" \
  -d '{"name":"Test","email":"test@ex.com","password":"Pass@123","role_id":1}'
  # role_id = 1 (SuperAdmin)
```

**Expected**: ✓ 201 Created

#### Test 13.2: Admin Cannot Create SuperAdmin
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"name":"Test","email":"test2@ex.com","password":"Pass@123","role_id":1}'
  # role_id = 1 (SuperAdmin)
```

**Expected**: ✗ 403 Forbidden - "Admin cannot create users with SuperAdmin or Admin roles"

#### Test 13.3: Admin Can Create Manager/User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"name":"Test","email":"test3@ex.com","password":"Pass@123","role_id":3}'
  # role_id = 3 (Manager)
```

**Expected**: ✓ 201 Created

#### Test 13.4: Frontend User Management - Role Dropdown
```
1. Login as SuperAdmin
2. Go to /users
3. Create user form - dropdown shows all 4 roles
4. Login as Admin
5. Go to /users
6. Create user form - dropdown shows Manager/User only
```

**Expected**: Role options match backend restrictions

---

## File Upload/Download RBAC Testing

### Test 14: File Access Control

#### Test 14.1: User Can Upload to Own Request
```bash
curl -X POST http://localhost:5000/api/files/5/upload \
  -H "Authorization: Bearer {user_token}" \
  -F "file=@test.pdf"
  # Request 5 owned by this user
```

**Expected**: ✓ 200 OK - File uploaded

#### Test 14.2: User Cannot Upload to Others' Requests
```bash
curl -X POST http://localhost:5000/api/files/3/upload \
  -H "Authorization: Bearer {user_token}" \
  -F "file=@test.pdf"
  # Request 3 owned by another user
```

**Expected**: ✗ 403 Forbidden - "Cannot access this request"

#### Test 14.3: Manager Can Download Any File
```bash
curl -X GET http://localhost:5000/api/files/{filename} \
  -H "Authorization: Bearer {manager_token}" \
  -o downloaded_file.pdf
```

**Expected**: ✓ File downloaded (binary content)

---

## Summary & Validation Checklist

### High Priority Validations
- [ ] ✓ Users cannot view other users' change requests
- [ ] ✓ Users cannot modify requests after approval starts
- [ ] ✓ Users cannot approve their own requests
- [ ] ✓ Step-based approval enforces role hierarchy (Manager → Admin → SuperAdmin)
- [ ] ✓ Admin cannot create SuperAdmin accounts
- [ ] ✓ Users cannot bypass route guards on frontend

### Medium Priority Validations
- [ ] ✓ Approval progress visible in UI
- [ ] ✓ Change list shows approval count
- [ ] ✓ Frontend role restrictions match backend
- [ ] ✓ File uploads/downloads respect ownership

### Low Priority Validations
- [ ] ✓ Audit logs created for all actions
- [ ] ✓ Timestamps accurate on all records
- [ ] ✓ Dark mode works on all protected pages

---

## Troubleshooting

### Issue: `Cannot read property 'approvals' undefined`
**Cause**: Approvals not included in getChangeRequests response
**Fix**: Ensure Approval model is in include array (FIXED ✓)

### Issue: User sees "Not Your Step" on first approval
**Cause**: Step logic index miscalculation
**Fix**: Verify roleHierarchy matches step requirements (FIXED ✓)

### Issue: Frontend button states don't update after approval
**Cause**: Page doesn't reload after submitApproval
**Fix**: Call fetchPendingChanges() after success (FIXED ✓)

### Issue: `/approvals` shows requests from own change request
**Cause**: Filter not excluding request creator
**Fix**: Added `change.created_by === user?.id` check (FIXED ✓)

---

## Performance Notes

- Approval fetches include role data (2 extra DB queries per change)
- Use pagination on /changes endpoint for large datasets
- Consider caching dashboard stats for 5-minute intervals
- Monitor approval step logic for O(n) operations

---

## Security Audit Notes

✓ **Passed**:
- Self-approval prevention
- Duplicate approval prevention
- Step-based role enforcement
- Ownership-based access control
- Pending-status-only enforcement
- Post-approval lock on changes

⚠ **Recommendations**:
- Implement rate limiting on approval endpoints
- Add IP whitelisting for admin operations
- Rotate JWT secrets monthly
- Monitor for repeated failed approvals (possible attacks)
