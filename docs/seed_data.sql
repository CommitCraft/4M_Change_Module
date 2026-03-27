-- Optional sample data for local testing
-- SuperAdmin is auto-created by backend startup from .env values.

USE change_management;

INSERT IGNORE INTO roles (id, name) VALUES
(1, 'SuperAdmin'),
(2, 'Admin'),
(3, 'Manager'),
(4, 'User');

-- Password hash below is for: Password@123
INSERT INTO users (name, email, password, role_id)
SELECT 'Plant Admin', 'admin@example.com', '$2a$12$ImNf9G1Cxn5fNeWLWNE6aePwUq2Xf5nSvM2e4u6nR3.KQBT8zHh0S', 2
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

INSERT INTO users (name, email, password, role_id)
SELECT 'Line Manager', 'manager@example.com', '$2a$12$ImNf9G1Cxn5fNeWLWNE6aePwUq2Xf5nSvM2e4u6nR3.KQBT8zHh0S', 3
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@example.com');

INSERT INTO users (name, email, password, role_id)
SELECT 'Operator User', 'user@example.com', '$2a$12$ImNf9G1Cxn5fNeWLWNE6aePwUq2Xf5nSvM2e4u6nR3.KQBT8zHh0S', 4
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

INSERT INTO change_requests (
  type, title, description, current_state, proposed_change, reason,
  impact_analysis, risk_level, department, status, created_by
)
SELECT
  'Machine',
  'Conveyor Motor Upgrade',
  'Motor overheating causes frequent stoppages.',
  'Current motor fails during peak shifts.',
  'Replace with energy-efficient industrial motor.',
  'Reduce downtime and maintenance costs.',
  'Expected 18% OEE improvement.',
  'Medium',
  'Production',
  'Pending',
  (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM change_requests WHERE title = 'Conveyor Motor Upgrade');

INSERT INTO change_requests (
  type, title, description, current_state, proposed_change, reason,
  impact_analysis, risk_level, department, status, created_by
)
SELECT
  'Method',
  'Line Clearance SOP Revision',
  'Revise SOP to reduce setup variability.',
  'Manual checks vary between shifts.',
  'Introduce standardized checklist and sign-off.',
  'Improve consistency and reduce defects.',
  'Projected 12% defect reduction.',
  'Low',
  'Quality',
  'Approved',
  (SELECT id FROM users WHERE email = 'manager@example.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM change_requests WHERE title = 'Line Clearance SOP Revision');

INSERT INTO approvals (request_id, approver_id, status, remarks)
SELECT
  cr.id,
  u.id,
  'Approved',
  'Checklist and controls verified.'
FROM change_requests cr
JOIN users u ON u.email = 'admin@example.com'
WHERE cr.title = 'Line Clearance SOP Revision'
  AND NOT EXISTS (
    SELECT 1 FROM approvals a
    WHERE a.request_id = cr.id AND a.approver_id = u.id
  );

INSERT INTO audit_logs (request_id, user_id, action)
SELECT cr.id, cr.created_by, 'CREATED'
FROM change_requests cr
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs al
  WHERE al.request_id = cr.id AND al.action = 'CREATED'
);