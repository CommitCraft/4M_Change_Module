# Test Login Accounts

These accounts are seeded only when `SEED_DEMO_DATA=true`.

## Core Approval Accounts

- `superadmin@example.com` / `change_this_password` (from env) - Role: `SuperAdmin`
- `admin@example.com` / `Password@123` - Role: `Admin`
- `manager@example.com` / `Password@123` - Role: `Manager`
- `quality.approver@example.com` / `Password@123` - Role: `Admin`
- `manager.approver@example.com` / `Password@123` - Role: `Manager`
- `user@example.com` / `Password@123` - Role: `User`

## 4M Role-Based Users

- `man.user@example.com` / `Password@123` - Role: `ManUser`
- `machine.user@example.com` / `Password@123` - Role: `MachineUser`
- `method.user@example.com` / `Password@123` - Role: `MethodUser`
- `material.user@example.com` / `Password@123` - Role: `MaterialUser`
- `general.user@example.com` / `Password@123` - Role: `GeneralUser`

## Notes

- 4M auth roles use requester-level permissions (create/read/update changes, attachments, masters read).
- Approval flow remains role-gated to `Manager` (Stage 1) and `Admin/SuperAdmin` (Stage 2).
