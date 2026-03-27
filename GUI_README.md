# GUI Frontend User Guide

This guide explains how to use the frontend application step by step, starting from login.

## 1. Open the Frontend

1. Start backend server.
2. Start frontend server.
3. Open browser at: http://localhost:5174

## 2. Login Flow

1. Login page appears first.
2. Enter email and password.
3. Click Login.
4. On successful login, you are redirected to Dashboard.

If login fails:
1. Verify backend server is running.
2. Verify credentials.
3. Check backend CORS and frontend API URL settings.

## 3. Dashboard Usage

Dashboard is the entry page for monitoring and quick actions.

You can:
1. View total change requests.
2. View pending review and pending approval counts.
3. View implemented and rejected summary.
4. Open recent change requests table.
5. Use quick buttons:
   - New Change Request
   - View All Requests

## 4. Create New Change Request

1. Click New Change Request from Dashboard or sidebar.
2. Fill mandatory fields:
   - 4M type
   - Title
   - Description
   - Department
   - Risk level
   - Current state and proposed change
3. Add extra details based on selected type.
4. Submit request.

## 5. Change List Page

1. Open Change List from sidebar or View All Requests.
2. Use filters for status, type, and search.
3. Open any request to view full details.
4. Depending on permission, you can edit request details.

## 6. Approvals Flow

1. Open Approvals page.
2. Review pending requests.
3. Open a request detail.
4. Approve or Reject with remarks.
5. Status updates appear in dashboard and list pages.

## 7. Masters Page

Use Masters page to maintain all dropdown and matrix data.

Main usage:
1. Select tab from Master Navigator.
2. Add entry using Name, Type (if required), and Status.
3. Edit, Activate/Deactivate, or Delete entries.
4. Use bulk select and bulk activate/deactivate.
5. For machine/operator/subtype tabs, mapped skills are visible in table.

## 8. Guided Setup Page

1. Open Guided Setup from Masters page.
2. Choose one 4M type.
3. Fill step form using mapping fields.
4. Click Go To Preview.
5. Verify all data in preview modal.
6. Click Final Submit.
7. Form resets for next entry.

## 9. Users and Roles

Available to authorized roles only.

1. Manage users from Users page.
2. Manage roles and permissions from Roles page.
3. Ensure dashboard and change permissions are assigned properly.

## 10. Reports and Monitoring

1. Open reports/monitoring pages from sidebar.
2. Track progress, status distribution, and audit behavior.

## 11. Logout

1. Use logout action from navbar/user menu.
2. Session token is cleared and user returns to login page.

## 12. Permission Notes

Feature access depends on role permissions:
1. SuperAdmin has full access.
2. Other roles require explicit permissions like:
   - dashboard.view
   - changes.read/create/update/delete
   - approvals.approve
   - users and roles permissions

If a page is not opening, ask admin to update role permissions.

## 13. Quick Troubleshooting for GUI

1. Blank or no data on dashboard:
   - Check backend running on port 5000.
   - Verify frontend API URL.
   - Check role permission for dashboard and changes.
2. Login redirect loop:
   - Token expired or invalid. Login again.
3. CORS issue:
   - Verify backend CORS_ORIGIN matches frontend URL.
4. Master data not visible:
   - Refresh page and verify category/type filters.

## 14. Recommended First-Time User Path

1. Login
2. Open Dashboard
3. Open Masters and verify required master data
4. Run Guided Setup for mapping
5. Create first change request
6. Complete approval cycle
7. Track updates in Dashboard
