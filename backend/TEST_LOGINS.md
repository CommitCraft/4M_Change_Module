# Test Logins

Use these demo accounts to test the approval workflow.

## Enable Demo Seeding
Set this in `backend/.env`:

```dotenv
SEED_DEMO_DATA=true
```

The app will still require the normal database and SuperAdmin bootstrap values.

## Login Matrix

| Role | Email | Password | What to Test |
| --- | --- | --- | --- |
| SuperAdmin | `superadmin@example.com` | `change_this_password` | Full access, can create requests and approve at the final stage only if allowed by workflow rules |
| Admin | `admin@example.com` | `Password@123` | Stage 2 approval, implementation, monitoring |
| Manager | `manager@example.com` | `Password@123` | Stage 1 approval, review visibility |
| User | `user@example.com` | `Password@123` | Create requests and view own requests |
| Admin Approver | `quality.approver@example.com` | `Password@123` | Stage 2 approval testing |
| Manager Approver | `manager.approver@example.com` | `Password@123` | Stage 1 approval testing |

## Approval Flow Test

1. Log in as `manager@example.com` or `manager.approver@example.com` and approve a pending request at Stage 1.
2. Log in as `admin@example.com` or `quality.approver@example.com` and confirm the same request becomes available for Stage 2.
3. Verify that Stage 2 does not show before Stage 1 is approved.
4. Use `user@example.com` to create a request and confirm self-approval is blocked.

## Notes

- The demo accounts are created by `backend/src/config/bootstrap.js` when `SEED_DEMO_DATA=true`.
- If the database is reset, rerun the backend so seeding runs again.
