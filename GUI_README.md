# GUI Frontend User Guide (Step by Step)

Yeh guide frontend ke har important page ka practical usage batati hai: page me kya hota hai aur use kaise karna hai.

## 1. App Start Karna

1. Backend run karein.
2. Frontend run karein.
3. Browser me http://localhost:5174 open karein.

## 2. Login Page (/login)

### Page me kya hai
1. Email input
2. Password input
3. Login button

### Kaise use karein
1. Valid email aur password enter karein.
2. Login click karein.
3. Success par app Dashboard par redirect karega.
4. Error aaye to credentials, backend status, aur API URL verify karein.

## 3. Dashboard (/dashboard)

### Page me kya hai
1. KPI cards: total, pending, implemented, rejected
2. Recent changes list/table
3. Quick actions: New Change Request, View All Requests

### Kaise use karein
1. Top summary se system health check karein.
2. Recent rows se latest requests open karein.
3. New request banani ho to New Change Request click karein.
4. Puri list dekhni ho to View All Requests click karein.

## 4. Create Change Request Page (/create)

### Page me kya hai
1. 4M type selection
2. Core fields: title, description, department, risk
3. Current vs proposed change fields
4. Type-specific business fields
5. Submit action

### Kaise use karein
1. Pehle 4M type choose karein.
2. Mandatory fields fill karein.
3. Impact/reason aur supporting details add karein.
4. Submit karein aur success toast verify karein.

## 5. Change List Page (/changes)

### Page me kya hai
1. Search and filters (status, type, department, etc.)
2. Sorted/paginated request list
3. Row actions for open/view/edit (permission based)

### Kaise use karein
1. Filters lagake relevant requests shortlist karein.
2. Request row open karke details dekhein.
3. Permission ho to update actions use karein.

## 6. Request Detail Page (/changes/:id)

### Page me kya hai
1. Full request details
2. Approval history/status
3. Attachments and audit context

### Kaise use karein
1. Request list se detail page open karein.
2. Data verify karein.
3. Attachments dekh kar implementation/approval decision support lein.

## 7. Approvals Page (/approvals)

### Page me kya hai
1. Pending approval requests
2. Approval decision actions

### Kaise use karein
1. Pending item select karein.
2. Request context check karein.
3. Approve ya Reject with remarks karein.
4. Updated status dashboard/change list me confirm karein.

## 8. Review Page (/reviews)

### Page me kya hai
1. Review queue for approver roles
2. Quick drill-down and decision flow

### Kaise use karein
1. Review list me highest priority item open karein.
2. Impact/requirement/reason verify karein.
3. Approval decision complete karein.

## 9. Implementation Page (/implementation)

### Page me kya hai
1. Approved requests for execution
2. Implementation status update actions

### Kaise use karein
1. Approved request choose karein.
2. Implementation details fill/update karein.
3. Status ko implemented direction me move karein.

## 10. Monitoring Page (/monitoring)

### Page me kya hai
1. Post-implementation tracking data
2. Outcome/observation fields

### Kaise use karein
1. Implemented request select karein.
2. Monitoring observations and metrics update karein.
3. Quality/cost/safety impact trend verify karein.

## 11. Reports Page (/reports)

### Page me kya hai
1. Analytical summaries
2. Status/type level reporting views

### Kaise use karein
1. Required filter range choose karein.
2. Report output review karein.
3. Decision support ke liye export/share workflow follow karein (if available).

## 12. Masters Page (/masters)

### Page me kya hai
1. Master Navigator tabs
2. Add/Edit/Delete entries
3. Status activation/deactivation
4. Search, status filter, type filter
5. Bulk select and bulk status update
6. Mapped skills visibility (machine/operator/subtype rows)

### Kaise use karein (step by step)
1. Left navigator se tab select karein.
2. Agar tab me type required hai to type choose karein.
3. Name field me single ya comma/newline separated multiple values daalein.
4. Add Entry click karein.
5. Table me search/filter lagakar entry validate karein.
6. Zarurat par Edit, Activate/Deactivate, Delete use karein.
7. Bulk operation ke liye rows select karke Activate Selected ya Deactivate Selected karein.
8. Machine/Operator/Change Subtypes tabs me Mapped Skills column se mapping quickly validate karein.

## 13. Guided Setup Page (/guided-setup)

### Page me kya hai
1. Type-wise guided mapping flow
2. Step data save and progress tracking
3. Preview modal + final submit

### Kaise use karein
1. 4M type select karein.
2. Step fields fill karein (mapping + skill selection).
3. Go To Preview click karein.
4. Modal me data verify karein.
5. Edit karna ho to modal close karein aur fields update karein.
6. Final Submit karein.
7. Submit ke baad flow reset state verify karein.

## 14. Master Categories Page (/master-categories)

### Page me kya hai
1. 4M category reference listing
2. Dropdown preview by selected 4M type

### Kaise use karein
1. Main category type switch karein.
2. Subcategory options preview karein.
3. Isse Create/Guided forms ke expected category structure verify karein.

## 15. Users Page (/users)

### Page me kya hai
1. User list
2. Create/update/delete user actions
3. Role assignment controls

### Kaise use karein
1. New user create karein with role.
2. Existing user details update karein.
3. Unauthorized or inactive user cleanup karein.

## 16. Roles Pages

### 16.1 Roles List (/roles)
1. Existing roles list dekhein.
2. Role detail open karein.
3. Naya role create flow start karein.

### 16.2 Role Create (/roles/create)
1. Role name enter karein.
2. Permissions select karein.
3. Save karein.

### 16.3 Role View (/roles/:id)
1. Role info and permissions inspect karein.
2. Edit route par move karein if needed.

### 16.4 Role Edit (/roles/:id/edit)
1. Permissions update karein.
2. Save and validate access changes.

## 17. Permission Matrix Page (/roles/permissions)

### Page me kya hai
1. Permissions grid by role
2. Centralized permission management view

### Kaise use karein
1. Role row select karein.
2. Required permissions enable/disable karein.
3. Save karein aur affected user se login karke verify karein.

## 18. Navbar and Sidebar Usage

1. Sidebar se modules me quickly switch karein.
2. Navbar se session actions (including logout) perform karein.
3. Access-controlled routes role ke hisab se show/hide ho sakte hain.

## 19. Logout

1. Navbar se logout karein.
2. Token clear ho jata hai.
3. App login page par redirect hoti hai.

## 20. Permission Reference (High Level)

1. Dashboard: dashboard.view
2. Change list/details: changes.read
3. Create request: changes.create
4. Update implementation/monitoring: changes.update
5. Approvals: approvals.approve
6. Users: users.read and related user permissions
7. Roles: roles.read/roles.create/roles.update

## 21. Common GUI Issues and Fix

1. Dashboard me data nahi aa raha: backend up hai ya nahi check karein.
2. Dashboard me data nahi aa raha: frontend env me API URL check karein.
3. Dashboard me data nahi aa raha: permission mismatch check karein.
4. Login ke baad wapas login page aata hai: token invalid/expired ho sakta hai, re-login karein.
5. Masters me list blank: category/type/status filters clear karein.
6. Masters me list blank: role permission verify karein.
7. CORS error: backend .env me CORS_ORIGIN ko frontend URL se match karein.

## 22. Recommended End-to-End User Journey

1. Login karein.
2. Dashboard se current system state samjhein.
3. Masters me required base data prepare karein.
4. Guided Setup se mapping quickly complete karein.
5. New change request create karein.
6. Review and approval cycle complete karein.
7. Implementation and monitoring update karein.
8. Reports se final analysis check karein.
