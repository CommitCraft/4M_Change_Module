# QA Confirmation Smoke Sheet

Project: 4M Module
Date: __________
Tester: __________
Environment: __________
Build/Commit: __________

## Execution Notes
- Login role used: SuperAdmin
- Browser: __________
- API base URL: __________
- Any blockers before start: __________

## Result Legend
- PASS: Behavior matches expected result.
- FAIL: Behavior differs from expected result.
- NA: Not applicable in current environment.

## A) Change Request Flows
| ID | Area | Action | Expected Confirmation Text | Expected Result on Cancel | Expected Result on OK | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|---|---|---|
| CR-01 | Create Change | Submit new request | Create this change request? | No new request created; no error toast | Request created successfully |  |  |
| CR-02 | Change List | Delete request | Delete this change request? | Request remains visible | Request deleted from list |  |  |
| CR-03 | Dashboard | Update request from edit flow | Update this change request? | No update applied | Update saved successfully |  |  |
| CR-04 | Implementation | Update implementation status/details | Update this change request? | No update applied | Update saved successfully |  |  |
| CR-05 | Monitoring | Update monitoring status/details | Update this change request? | No update applied | Update saved successfully |  |  |
| CR-06 | Review | Send back/review update action | Update this change request? | No change in status | Status update applied |  |  |

## B) User Management
| ID | Area | Action | Expected Confirmation Text | Expected Result on Cancel | Expected Result on OK | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|---|---|---|
| USR-01 | Users | Create user | Create this user? | User not created | User created |  |  |
| USR-02 | Users | Update user | Update this user? | User unchanged | User updated |  |  |
| USR-03 | Users | Delete user | Delete this user? | User remains | User deleted |  |  |

## C) Role Management
| ID | Area | Action | Expected Confirmation Text | Expected Result on Cancel | Expected Result on OK | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|---|---|---|
| RL-01 | Roles | Create role | Create this role? | Role not created | Role created |  |  |
| RL-02 | Role Edit | Update role | Update this role? | Role unchanged | Role updated |  |  |
| RL-03 | Roles/Role View | Delete role | Delete this role? | Role remains | Role deleted |  |  |

## D) Masters + Guided Setup
| ID | Area | Action | Expected Confirmation Text | Expected Result on Cancel | Expected Result on OK | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|---|---|---|
| MST-01 | Masters | Add entry | Create master entry? | Entry not created | Entry created |  |  |
| MST-02 | Masters | Edit entry | Update master entry? | Entry unchanged | Entry updated |  |  |
| MST-03 | Masters | Delete entry | Delete master entry? | Entry remains | Entry deleted |  |  |
| MST-04 | Masters | Bulk activate/deactivate | Update master entry? | No status change | Selected rows updated |  |  |
| GUD-01 | Guided Setup | Save step data | Create master entry? | No data persisted for that step | Step data created |  |  |
| GUD-02 | Guided Setup | Save guided progress | Save guided setup progress? | Progress index unchanged | Progress saved and sync state updates |  |  |
| GUD-03 | Guided Setup | Reset guided flow | Reset guided setup progress? | Progress not reset | Guided flow reset to step 1 |  |  |
| GUD-04 | Guided Setup UI | Sidebar + lock behavior | N/A | N/A | Left step sidebar visible, future steps locked until previous complete |  |  |

## E) Global Cancel Behavior
| ID | Check | Expected Result | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|
| GLB-01 | Cancel on any confirmation | No write API request sent |  |  |
| GLB-02 | Cancel on any confirmation | No "Action cancelled by user" toast shown |  |  |
| GLB-03 | Cancel on any confirmation | UI state remains unchanged |  |  |

## F) Regression Sanity
| ID | Check | Expected Result | Status (PASS/FAIL/NA) | Evidence/Notes |
|---|---|---|---|---|
| REG-01 | Frontend build | Build completes successfully |  |  |
| REG-02 | Console errors | No new critical errors during tested actions |  |  |
| REG-03 | Network errors | No unexpected 4xx/5xx on confirmed successful actions |  |  |

## Defect Log
| Bug ID | Area | Steps to Reproduce | Expected | Actual | Severity | Screenshot/Video |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## Sign-off
- Total cases executed: ______
- PASS: ______
- FAIL: ______
- NA: ______
- Final QA verdict: PASS / FAIL
- Tester signature: ____________________
