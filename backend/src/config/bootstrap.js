import mysql from 'mysql2/promise';
import { DataTypes } from 'sequelize';
import sequelize, { connectDatabase } from './database.js';
import models from '../models/index.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions.js';

const { Role, RolePermission, User, ChangeRequest, AuditLog, MasterData, Department, BusinessRole } = models;

const ALL_ROLES = [
  'SuperAdmin',
  'Admin',
  'Manager',
  'User',
  'ManUser',
  'MachineUser',
  'MethodUser',
  'MaterialUser',
  'GeneralUser',
];

const DEFAULT_DEPARTMENTS = [
  { name: 'Production Department', four_m_link: 'Man,Method' },
  { name: 'Quality Department (QA/QC)', four_m_link: 'Material,Method' },
  { name: 'Maintenance Department', four_m_link: 'Machine' },
  { name: 'Store / Inventory Department', four_m_link: 'Material' },
  { name: 'Purchase / Procurement Department', four_m_link: 'Material' },
  { name: 'R&D / Design Department', four_m_link: 'Method' },
  { name: 'Process / Industrial Engineering (IE)', four_m_link: 'Method' },
  { name: 'HR (Human Resource)', four_m_link: 'Man' },
  { name: 'Finance / Accounts', four_m_link: '' },
  { name: 'Logistics / Supply Chain', four_m_link: '' },
  { name: 'EHS (Environment, Health & Safety)', four_m_link: '' },
  { name: 'Continuous Improvement (CI / Lean Team)', four_m_link: '' },
];

const LEGACY_DEPARTMENTS_TO_INACTIVATE = ['Production', 'Quality', 'Maintenance', 'HR'];

const DEFAULT_MASTER_DATA = [
  { category: 'department', name: 'Production Department' },
  { category: 'department', name: 'Quality Department (QA/QC)' },
  { category: 'department', name: 'Maintenance Department' },
  { category: 'department', name: 'Store / Inventory Department' },
  { category: 'department', name: 'Purchase / Procurement Department' },
  { category: 'department', name: 'R&D / Design Department' },
  { category: 'department', name: 'Process / Industrial Engineering (IE)' },
  { category: 'department', name: 'HR (Human Resource)' },
  { category: 'department', name: 'Finance / Accounts' },
  { category: 'department', name: 'Logistics / Supply Chain' },
  { category: 'department', name: 'EHS (Environment, Health & Safety)' },
  { category: 'department', name: 'Continuous Improvement (CI / Lean Team)' },
  { category: 'machine', name: 'MCH-1001' },
  { category: 'machine', name: 'MCH-1002' },
  { category: 'risk_level', name: 'Low' },
  { category: 'risk_level', name: 'Medium' },
  { category: 'risk_level', name: 'High' },
  { category: 'risk_level', name: 'Critical' },
  { category: 'change_subtype', type: 'Man', name: 'Operator Change' },
  { category: 'change_subtype', type: 'Man', name: 'Supervisor Change' },
  { category: 'change_subtype', type: 'Man', name: 'Skill/Training Change' },
  { category: 'change_subtype', type: 'Man', name: 'Shift Manpower Change' },
  { category: 'change_subtype', type: 'Machine', name: 'Machine Replacement' },
  { category: 'change_subtype', type: 'Machine', name: 'Maintenance' },
  { category: 'change_subtype', type: 'Machine', name: 'Tooling/Mold/Die Change' },
  { category: 'change_subtype', type: 'Machine', name: 'Machine Parameter Update' },
  { category: 'change_subtype', type: 'Method', name: 'SOP Update' },
  { category: 'change_subtype', type: 'Method', name: 'Process Flow Update' },
  { category: 'change_subtype', type: 'Method', name: 'Inspection Method Update' },
  { category: 'change_subtype', type: 'Method', name: 'Cycle Time Change' },
  { category: 'change_subtype', type: 'Material', name: 'Raw Material Change' },
  { category: 'change_subtype', type: 'Material', name: 'Vendor Change' },
  { category: 'change_subtype', type: 'Material', name: 'Grade/Specification Change' },
  { category: 'change_subtype', type: 'Material', name: 'Packaging Material Change' },
  { category: 'operator', name: 'Operator A' },
  { category: 'operator', name: 'Operator B' },
  { category: 'operator', name: 'Operator C' },
  { category: 'skill', name: 'CNC Operation' },
  { category: 'skill', name: 'Hydraulic Press Handling' },
  { category: 'skill', name: 'SOP Compliance' },
  { category: 'operator_skill_map', type: 'Operator A', name: 'CNC Operation' },
  { category: 'operator_skill_map', type: 'Operator A', name: 'SOP Compliance' },
  { category: 'operator_skill_map', type: 'Operator B', name: 'Hydraulic Press Handling' },
  { category: 'operator_skill_map', type: 'Operator C', name: 'SOP Compliance' },
  { category: 'machine_skill_requirement', type: 'MCH-1001', name: 'CNC Operation' },
  { category: 'machine_skill_requirement', type: 'MCH-1001', name: 'SOP Compliance' },
  { category: 'machine_skill_requirement', type: 'MCH-1002', name: 'Hydraulic Press Handling' },
  { category: 'training_program', type: 'CNC Operation', name: 'CNC Operation Level-1 Training' },
  { category: 'training_program', type: 'Hydraulic Press Handling', name: 'Hydraulic Safety & Handling Training' },
  { category: 'training_program', type: 'SOP Compliance', name: 'SOP Refresher Training' },
  { category: 'type_requirement', type: 'Machine', name: 'Machine capability verification' },
  { category: 'type_requirement', type: 'Machine', name: 'Safety interlock validation' },
  { category: 'type_requirement', type: 'Method', name: 'SOP revision approval' },
  { category: 'type_requirement', type: 'Method', name: 'Trial run and process audit' },
  { category: 'type_requirement', type: 'Material', name: 'Incoming quality validation' },
  { category: 'type_requirement', type: 'Material', name: 'Vendor CoA verification' },
  { category: 'type_action_template', type: 'Machine', name: 'Schedule machine trial and calibration' },
  { category: 'type_action_template', type: 'Method', name: 'Train team on revised SOP' },
  { category: 'type_action_template', type: 'Material', name: 'Run pilot lot and monitor defects' },
];

const DEFAULT_BUSINESS_ROLES = [
  // Man
  { m_module: 'Man', role_name: 'Operator / Technician', focus_area: 'Skill, training, discipline, safety' },
  { m_module: 'Man', role_name: 'Supervisor', focus_area: 'Skill, training, discipline, safety' },
  { m_module: 'Man', role_name: 'Production Engineer', focus_area: 'Skill, training, discipline, safety' },
  { m_module: 'Man', role_name: 'Quality Inspector / QA Engineer', focus_area: 'Skill, training, discipline, safety' },
  { m_module: 'Man', role_name: 'Training & Skill Development Team', focus_area: 'Skill, training, discipline, safety' },

  // Machine
  { m_module: 'Machine', role_name: 'Maintenance Engineer', focus_area: 'Machine condition, breakdown, calibration' },
  { m_module: 'Machine', role_name: 'Tool Room Engineer', focus_area: 'Machine condition, breakdown, calibration' },
  { m_module: 'Machine', role_name: 'Automation Engineer', focus_area: 'Machine condition, breakdown, calibration' },
  { m_module: 'Machine', role_name: 'Equipment Owner / Machine In-charge', focus_area: 'Machine condition, breakdown, calibration' },

  // Material
  { m_module: 'Material', role_name: 'Store / Inventory Manager', focus_area: 'Raw material quality, availability, traceability' },
  { m_module: 'Material', role_name: 'Procurement / Purchase Team', focus_area: 'Raw material quality, availability, traceability' },
  { m_module: 'Material', role_name: 'Quality Control (Incoming Inspection)', focus_area: 'Raw material quality, availability, traceability' },
  { m_module: 'Material', role_name: 'Supplier Quality Engineer', focus_area: 'Raw material quality, availability, traceability' },

  // Method
  { m_module: 'Method', role_name: 'Process Engineer', focus_area: 'Process flow, SOPs, cycle time, standardization' },
  { m_module: 'Method', role_name: 'Industrial Engineer', focus_area: 'Process flow, SOPs, cycle time, standardization' },
  { m_module: 'Method', role_name: 'Continuous Improvement (CI) Team', focus_area: 'Process flow, SOPs, cycle time, standardization' },
  { m_module: 'Method', role_name: 'Documentation / SOP Owner', focus_area: 'Process flow, SOPs, cycle time, standardization' },

  // User (general)
  { m_module: 'User', role_name: 'General User / Requester', focus_area: 'Create requests, track status, collaboration' },
];

const validateDbName = (dbName) => {
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error('Invalid DB_NAME. Use only letters, numbers, and underscore.');
  }
};

export const ensureDatabaseExists = async () => {
  const dbName = process.env.DB_NAME;
  validateDbName(dbName);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    port: Number(process.env.DB_PORT || 3306),
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();
};

export const seedCoreData = async () => {
  for (const roleName of ALL_ROLES) {
    const [role] = await Role.findOrCreate({
      where: { name: roleName },
      defaults: { name: roleName },
    });

    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
    const [rolePermission, created] = await RolePermission.findOrCreate({
      where: { role_id: role.id },
      defaults: {
        role_id: role.id,
        permissions: defaultPermissions,
      },
    });

    if (!created) {
      const currentPermissions = Array.isArray(rolePermission.permissions) ? rolePermission.permissions : [];
      const mergedPermissions = Array.from(new Set([...currentPermissions, ...defaultPermissions]));
      if (mergedPermissions.length !== currentPermissions.length) {
        await rolePermission.update({ permissions: mergedPermissions });
      }
    }
  }

  for (const department of DEFAULT_DEPARTMENTS) {
    await Department.findOrCreate({
      where: { name: department.name },
      defaults: {
        name: department.name,
        status: 'Active',
      },
    });
  }

  await Department.update(
    { status: 'Inactive' },
    {
      where: {
        name: LEGACY_DEPARTMENTS_TO_INACTIVATE,
      },
    }
  );

  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be configured in .env');
  }

  const superAdminRole = await Role.findOne({ where: { name: 'SuperAdmin' } });
  const existingSuperAdmin = await User.scope('withPassword').findOne({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    let departmentId = null;
    try {
      const [firstDept] = await sequelize.query('SELECT id FROM departments ORDER BY id ASC LIMIT 1', { type: sequelize.QueryTypes.SELECT });
      if (firstDept && firstDept.id) departmentId = firstDept.id;
    } catch (error) {
      // If departments table does not exist or is empty, leave departmentId null.
    }

    await User.create({
      name: 'System SuperAdmin',
      email: superAdminEmail,
      password: superAdminPassword,
      role_id: superAdminRole.id,
      department_id: departmentId,
    });
  }

  for (const item of DEFAULT_MASTER_DATA) {
    await MasterData.findOrCreate({
      where: {
        category: item.category,
        type: item.type || null,
        name: item.name,
      },
      defaults: {
        category: item.category,
        type: item.type || null,
        name: item.name,
      },
    });
  }

  for (const role of DEFAULT_BUSINESS_ROLES) {
    await BusinessRole.findOrCreate({
      where: {
        m_module: role.m_module,
        role_name: role.role_name,
      },
      defaults: {
        m_module: role.m_module,
        role_name: role.role_name,
        focus_area: role.focus_area,
        status: 'Active',
      },
    });
  }
};

export const ensureTablesFromConfig = async () => {
  // Keep startup sync non-destructive to avoid index/key explosion on MySQL.
  await sequelize.sync({ alter: false });

  // Targeted schema patch: ensure approvals.step_number exists.
  const queryInterface = sequelize.getQueryInterface();
  const approvalsTable = await queryInterface.describeTable('approvals');

  if (!approvalsTable.step_number) {
    await queryInterface.addColumn('approvals', 'step_number', {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Workflow step number (1, 2, etc.) for sequential tracking',
    });
  }
};

export const seedDemoDataIfNeeded = async () => {
  const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true';
  if (!shouldSeedDemo) return;

  const findDepartmentByNames = async (names = []) => {
    for (const name of names) {
      const department = await Department.findOne({ where: { name } });
      if (department) return department;
    }
    return null;
  };

  const qualityDept = await findDepartmentByNames(['Quality Department (QA/QC)', 'Quality']);
  const productionDept = await findDepartmentByNames(['Production Department', 'Production']);
  const maintenanceDept = await findDepartmentByNames(['Maintenance Department', 'Maintenance']);

  const adminRole = await Role.findOne({ where: { name: 'Admin' } });
  const managerRole = await Role.findOne({ where: { name: 'Manager' } });
  const userRole = await Role.findOne({ where: { name: 'User' } });
  const manUserRole = await Role.findOne({ where: { name: 'ManUser' } });
  const machineUserRole = await Role.findOne({ where: { name: 'MachineUser' } });
  const methodUserRole = await Role.findOne({ where: { name: 'MethodUser' } });
  const materialUserRole = await Role.findOne({ where: { name: 'MaterialUser' } });
  const generalUserRole = await Role.findOne({ where: { name: 'GeneralUser' } });

  const [adminUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'admin@example.com' },
    defaults: {
      name: 'Plant Admin',
      email: 'admin@example.com',
      password: 'Password@123',
      role_id: adminRole.id,
      department_id: qualityDept?.id || null,
    },
  });

  if (!adminUser.department_id && qualityDept?.id) {
    await adminUser.update({ department_id: qualityDept.id });
  }

  const [managerUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'manager@example.com' },
    defaults: {
      name: 'Line Manager',
      email: 'manager@example.com',
      password: 'Password@123',
      role_id: managerRole.id,
      department_id: productionDept?.id || null,
    },
  });

  if (!managerUser.department_id && productionDept?.id) {
    await managerUser.update({ department_id: productionDept.id });
  }

  const [operatorUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'user@example.com' },
    defaults: {
      name: 'Operator User',
      email: 'user@example.com',
      password: 'Password@123',
      role_id: userRole.id,
      department_id: maintenanceDept?.id || null,
    },
  });

  if (!operatorUser.department_id && maintenanceDept?.id) {
    await operatorUser.update({ department_id: maintenanceDept.id });
  }

  const [qualityApprover] = await User.scope('withPassword').findOrCreate({
    where: { email: 'quality.approver@example.com' },
    defaults: {
      name: 'Quality Approver',
      email: 'quality.approver@example.com',
      password: 'Password@123',
      role_id: adminRole.id,
      department_id: qualityDept?.id || null,
    },
  });

  if (!qualityApprover.department_id && qualityDept?.id) {
    await qualityApprover.update({ department_id: qualityDept.id });
  }

  const [managerApprover] = await User.scope('withPassword').findOrCreate({
    where: { email: 'manager.approver@example.com' },
    defaults: {
      name: 'Manager Approver',
      email: 'manager.approver@example.com',
      password: 'Password@123',
      role_id: managerRole.id,
      department_id: productionDept?.id || null,
    },
  });

  if (!managerApprover.department_id && productionDept?.id) {
    await managerApprover.update({ department_id: productionDept.id });
  }

  const [manUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'man.user@example.com' },
    defaults: {
      name: '4M Man User',
      email: 'man.user@example.com',
      password: 'Password@123',
      role_id: manUserRole?.id || userRole.id,
      department_id: productionDept?.id || null,
    },
  });

  if (!manUser.department_id && productionDept?.id) {
    await manUser.update({ department_id: productionDept.id });
  }

  const [machineUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'machine.user@example.com' },
    defaults: {
      name: '4M Machine User',
      email: 'machine.user@example.com',
      password: 'Password@123',
      role_id: machineUserRole?.id || userRole.id,
      department_id: maintenanceDept?.id || null,
    },
  });

  if (!machineUser.department_id && maintenanceDept?.id) {
    await machineUser.update({ department_id: maintenanceDept.id });
  }

  const [methodUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'method.user@example.com' },
    defaults: {
      name: '4M Method User',
      email: 'method.user@example.com',
      password: 'Password@123',
      role_id: methodUserRole?.id || userRole.id,
      department_id: qualityDept?.id || null,
    },
  });

  if (!methodUser.department_id && qualityDept?.id) {
    await methodUser.update({ department_id: qualityDept.id });
  }

  const [materialUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'material.user@example.com' },
    defaults: {
      name: '4M Material User',
      email: 'material.user@example.com',
      password: 'Password@123',
      role_id: materialUserRole?.id || userRole.id,
      department_id: qualityDept?.id || null,
    },
  });

  if (!materialUser.department_id && qualityDept?.id) {
    await materialUser.update({ department_id: qualityDept.id });
  }

  const [generalUser] = await User.scope('withPassword').findOrCreate({
    where: { email: 'general.user@example.com' },
    defaults: {
      name: '4M General User',
      email: 'general.user@example.com',
      password: 'Password@123',
      role_id: generalUserRole?.id || userRole.id,
      department_id: productionDept?.id || null,
    },
  });

  if (!generalUser.department_id && productionDept?.id) {
    await generalUser.update({ department_id: productionDept.id });
  }

  const [sampleRequest] = await ChangeRequest.findOrCreate({
    where: { title: 'Conveyor Motor Upgrade' },
    defaults: {
      type: 'Machine',
      title: 'Conveyor Motor Upgrade',
      description: 'Motor overheating causes frequent stoppages.',
      current_state: 'Current motor fails during peak shifts.',
      proposed_change: 'Replace with energy-efficient industrial motor.',
      reason: 'Reduce downtime and maintenance costs.',
      impact_analysis: 'Expected 18% OEE improvement.',
      risk_level: 'Medium',
      department: 'Production',
      status: 'Pending',
      created_by: adminUser.id,
    },
  });

  await AuditLog.findOrCreate({
    where: {
      request_id: sampleRequest.id,
      user_id: sampleRequest.created_by,
      action: 'CREATED',
    },
    defaults: {
      request_id: sampleRequest.id,
      user_id: sampleRequest.created_by,
      action: 'CREATED',
    },
  });
};

export const bootstrapDatabase = async () => {
  await ensureDatabaseExists();
  await connectDatabase();
  await ensureTablesFromConfig();
  await seedCoreData();
  await seedDemoDataIfNeeded();
};
