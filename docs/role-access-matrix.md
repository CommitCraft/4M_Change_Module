# Role Access Matrix (UI + Route Guards)

This matrix reflects current frontend route guards and default seeded permissions.

## Guard Rules Source

- Route guards: frontend/src/App.jsx
- Sidebar visibility: frontend/src/components/Sidebar.jsx
- Permission check logic: frontend/src/context/AuthContext.jsx
- Seeded permissions: backend/src/utils/permissions.js

## Core Rule Notes

- `SuperAdmin` bypasses all permission checks in UI.
- `/approvals` and `/reviews` require BOTH:
  - permission: `approvals.approve`
  - role in: `Manager`, `Admin`, `SuperAdmin`
- 4M roles (`ManUser`, `MachineUser`, `MethodUser`, `MaterialUser`, `GeneralUser`) currently have requester-level permissions and are NOT in approver allowed roles.

## Route Access Matrix

| Route | Required Permission | Allowed Roles Constraint | SuperAdmin | Admin | Manager | User | ManUser | MachineUser | MethodUser | MaterialUser | GeneralUser |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /dashboard | dashboard.view | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /create | changes.create | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /changes | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /changes/:id | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /master-categories | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /masters | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /guided-setup | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /reports | changes.read | None | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| /approvals | approvals.approve | Manager/Admin/SuperAdmin | Yes | Yes | Yes | No | No | No | No | No | No |
| /reviews | approvals.approve | Manager/Admin/SuperAdmin | Yes | Yes | Yes | No | No | No | No | No | No |
| /implementation | changes.update | Admin/SuperAdmin | Yes | Yes | No | No | No | No | No | No | No |
| /monitoring | changes.update | Admin/SuperAdmin | Yes | Yes | No | No | No | No | No | No | No |
| /users | users.read | None | Yes | Yes | No | No | No | No | No | No | No |
| /roles | roles.read | None | Yes | Yes | No | No | No | No | No | No | No |
| /roles/create | roles.create | None | Yes | Yes | No | No | No | No | No | No | No |
| /roles/:id | roles.read | None | Yes | Yes | No | No | No | No | No | No | No |
| /roles/:id/edit | roles.update | None | Yes | Yes | No | No | No | No | No | No | No |
| /roles/permissions | roles.update | None | Yes | Yes | No | No | No | No | No | No | No |

## Sidebar Visibility Highlights

- `Approvals` and `Reviews` are intentionally removed from sidebar menu.
- Admin/SuperAdmin only sidebar links:
  - Implementation
  - Monitoring
- Users and 4M roles can still access allowed routes directly by URL if guard passes.

## Testing Checklist

1. Login as each 4M account and verify `/create`, `/changes`, `/masters`, `/guided-setup` open.
2. Verify 4M accounts are redirected from `/approvals` to `/dashboard`.
3. Login as `manager.approver@example.com` and confirm `/approvals` and `/reviews` open.
4. Login as `admin@example.com` and confirm `/implementation` and `/monitoring` open.
