-- 4M Module: Complete SQL Schema and Demo Data
-- Generated to match all backend models/routes as of March 2026

CREATE DATABASE IF NOT EXISTS change_management;
USE change_management;

-- Drop tables if they exist (for clean setup)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attachments, approvals, audit_logs, change_requests, departments, guided_setup_progress, master_data, machines, operator_skill_maps, operators, machine_skill_requirements, production_lines, risk_levels, roles, role_permissions, skills, training_programs, type_action_templates, type_requirements, users, change_sub_types;
SET FOREIGN_KEY_CHECKS = 1;

-- Departments
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO departments (name, status) VALUES
  ('Production', 'Active'),
  ('Quality', 'Active'),
  ('Maintenance', 'Active'),
  ('HR', 'Active');

-- Roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO roles (name) VALUES ('SuperAdmin'), ('Admin'), ('Manager'), ('Operator');

CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL UNIQUE,
  permissions JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
INSERT INTO role_permissions (role_id, permissions) VALUES
  (1, JSON_ARRAY('ALL')),
  (2, JSON_ARRAY('CREATE','READ','UPDATE','DELETE')),
  (3, JSON_ARRAY('READ','UPDATE')),
  (4, JSON_ARRAY('READ'));

-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  department_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
INSERT INTO users (name, email, password, role_id, department_id) VALUES
  
  ('Admin User', 'admin@example.com', '$2a$10$demoHash', 2, 2),
  ('Manager User', 'manager@example.com', '$2a$10$demoHash', 3, 3),
  ('Operator User', 'operator@example.com', '$2a$10$demoHash', 4, 1);

CREATE TABLE risk_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO risk_levels (name, status) VALUES
  ('Low', 'Active'),
  ('Medium', 'Active'),
  ('High', 'Active'),
  ('Critical', 'Active');

CREATE TABLE production_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO production_lines (name, status) VALUES
  ('Line A', 'Active'),
  ('Line B', 'Active');

CREATE TABLE machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO machines (name, status) VALUES
  ('Machine 1', 'Active'),
  ('Machine 2', 'Active');

CREATE TABLE operators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO operators (name, status) VALUES
  ('Operator 1', 'Active'),
  ('Operator 2', 'Active');

CREATE TABLE skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO skills (name, status) VALUES
  ('Skill A', 'Active'),
  ('Skill B', 'Active');

CREATE TABLE operator_skill_maps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator VARCHAR(120) NOT NULL,
  skill VARCHAR(120) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO operator_skill_maps (operator, skill, status) VALUES
  ('Operator 1', 'Skill A', 'Active'),
  ('Operator 2', 'Skill B', 'Active');

CREATE TABLE machine_skill_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machine VARCHAR(120) NOT NULL,
  skill VARCHAR(120) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO machine_skill_requirements (machine, skill, status) VALUES
  ('Machine 1', 'Skill A', 'Active'),
  ('Machine 2', 'Skill B', 'Active');

CREATE TABLE training_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  skill VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO training_programs (skill, name, status) VALUES
  ('Skill A', 'TP 1', 'Active'),
  ('Skill B', 'TP 2', 'Active');

CREATE TABLE type_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO type_requirements (type, name, status) VALUES
  ('Man', 'Req 1', 'Active'),
  ('Machine', 'Req 2', 'Active');

CREATE TABLE type_action_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO type_action_templates (type, name, status) VALUES
  ('Man', 'Action 1', 'Active'),
  ('Machine', 'Action 2', 'Active');

-- Master Data
CREATE TABLE master_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('department','production_line','machine','change_subtype','risk_level','operator','skill','operator_skill_map','machine_skill_requirement','training_program','type_requirement','type_action_template') NOT NULL,
  type VARCHAR(50),
  name VARCHAR(150) NOT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_type_name (category, type, name)
);
INSERT INTO master_data (category, type, name, status) VALUES
  ('department', NULL, 'Production', 'Active'),
  ('production_line', NULL, 'Line A', 'Active'),
  ('machine', NULL, 'Machine 1', 'Active'),
  ('change_subtype', NULL, 'Subtype 1', 'Active'),
  ('risk_level', NULL, 'Low', 'Active'),
  ('operator', NULL, 'Operator 1', 'Active'),
  ('skill', NULL, 'Skill A', 'Active'),
  ('operator_skill_map', 'Operator 1', 'Skill A', 'Active'),
  ('operator_skill_map', 'Operator 2', 'Skill B', 'Active'),
  ('machine_skill_requirement', 'Machine 1', 'Skill A', 'Active'),
  ('machine_skill_requirement', 'Machine 2', 'Skill B', 'Active'),
  ('training_program', NULL, 'TP 1', 'Active'),
  ('type_requirement', NULL, 'Req 1', 'Active'),
  ('type_action_template', NULL, 'Action 1', 'Active');

-- Change SubTypes
CREATE TABLE change_sub_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO change_sub_types (type, name, status) VALUES
  ('Man', 'SubType 1', 'Active'),
  ('Machine', 'SubType 2', 'Active'),
  ('Method', 'SubType 3', 'Active'),
  ('Material', 'SubType 4', 'Active'),
  ('Machine', 'SubType 5', 'Inactive'),
  ('Man', 'SubType 6', 'Active');

-- Guided Setup Progress
CREATE TABLE guided_setup_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  flow_type ENUM('Man','Machine','Method','Material') NOT NULL,
  completed_steps JSON NOT NULL DEFAULT (JSON_ARRAY()),
  current_step_index INT NOT NULL DEFAULT 0,
  draft_forms JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_flow (user_id, flow_type),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO guided_setup_progress (user_id, flow_type, completed_steps, current_step_index, draft_forms) VALUES
  (1, 'Man', JSON_ARRAY('step1'), 1, JSON_OBJECT('form1','data1'));

-- Change Requests
CREATE TABLE change_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('Man','Machine','Method','Material') NOT NULL,
  request_no VARCHAR(50),
  request_date DATE,
  production_line VARCHAR(120),
  machine VARCHAR(120),
  sub_type VARCHAR(120),
  current_operator VARCHAR(120),
  proposed_operator VARCHAR(120),
  required_skills TEXT,
  proposed_operator_skill_status ENUM('Matched','Gap'),
  training_required BOOLEAN NOT NULL DEFAULT 0,
  training_status ENUM('Not Required','Pending','Scheduled','Completed') DEFAULT 'Not Required',
  training_notes TEXT,
  compliance_requirements TEXT,
  action_plan_required BOOLEAN NOT NULL DEFAULT 0,
  action_plan_notes TEXT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  current_state TEXT NOT NULL,
  proposed_change TEXT NOT NULL,
  reason TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  impact_analysis TEXT NOT NULL,
  quality_impact ENUM('Low','Medium','High'),
  cost_impact ENUM('Low','Medium','High'),
  delivery_impact ENUM('Low','Medium','High'),
  safety_impact ENUM('Low','Medium','High'),
  monitoring_period VARCHAR(120),
  quality_result VARCHAR(200),
  defect_rate VARCHAR(50),
  monitoring_comments TEXT,
  risk_level ENUM('Low','Medium','High','Critical') NOT NULL,
  department VARCHAR(120) NOT NULL,
  status ENUM('Pending','Approved','Rejected','Implemented','Closed') NOT NULL DEFAULT 'Pending',
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO change_requests (type, title, description, current_state, proposed_change, reason, impact_analysis, risk_level, department, status, created_by) VALUES
  ('Man', 'Change 1', 'Desc 1', 'State 1', 'Change 1', 'Reason 1', 'Impact 1', 'Low', 'Production', 'Pending', 1);

-- Approvals
CREATE TABLE approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES change_requests(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);
INSERT INTO approvals (request_id, approver_id, status, remarks) VALUES
  (1, 2, 'Pending', 'Initial approval');

-- Attachments
CREATE TABLE if not exists attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES change_requests(id)
);
INSERT INTO attachments (request_id, file_path) VALUES
  (1, '/uploads/demo.pdf');

-- Audit Logs
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  user_id INT NOT NULL,
  action ENUM('CREATED','UPDATED','APPROVED','REJECTED','IMPLEMENTED') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES change_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO audit_logs (request_id, user_id, action) VALUES
  (1, 1, 'CREATED');

-- All tables and demo data created as per backend models/routes.
