import mysql from 'mysql2/promise';
import { DataTypes } from 'sequelize';
import sequelize, { connectDatabase } from './database.js';
import { Role, RolePermission, User, ChangeRequest, AuditLog, MasterData } from '../models/index.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions.js';

const ALL_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'User'];
const REQUIRED_TABLES = [
  'roles',
  'role_permissions',
  'users',
  'change_requests',
  'approvals',
  'audit_logs',
  'attachments',
  'master_data',
  'guided_setup_progress',
];

const DEFAULT_MASTER_DATA = [
  { category: 'department', name: 'Production' },
  { category: 'department', name: 'Quality' },
  { category: 'department', name: 'Maintenance' },
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

const validateDbName = (dbName) => {
  // Prevent SQL injection in identifier context.
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
    await RolePermission.findOrCreate({
      where: { role_id: role.id },
      defaults: {
        role_id: role.id,
        permissions: defaultPermissions,
      },
    });
  }

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
    await User.create({
      name: 'System SuperAdmin',
      email: superAdminEmail,
      password: superAdminPassword,
      role_id: superAdminRole.id,
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
};

export const ensureTablesFromConfig = async () => {
  try {
    await sequelize.query('ALTER TABLE roles MODIFY COLUMN name VARCHAR(100) NOT NULL UNIQUE');
  } catch (error) {
    // Ignore when table does not exist yet; sync will create it with the latest model definition.
  }

  try {
    await sequelize.query(
      "ALTER TABLE change_requests MODIFY COLUMN risk_level ENUM('Low','Medium','High','Critical') NOT NULL"
    );
  } catch (error) {
    // Ignore when table does not exist yet.
  }

  try {
    await sequelize.query(
      "ALTER TABLE change_requests MODIFY COLUMN status ENUM('Pending','Approved','Rejected','Implemented','Closed') NOT NULL DEFAULT 'Pending'"
    );
  } catch (error) {
    // Ignore when table does not exist yet.
  }

  try {
    await sequelize.query(
      "ALTER TABLE master_data MODIFY COLUMN category ENUM('department','machine','change_subtype','risk_level','operator','skill','operator_skill_map','machine_skill_requirement','training_program','type_requirement','type_action_template') NOT NULL"
    );
  } catch (error) {
    // Ignore when table does not exist yet.
  }

  try {
    await sequelize.query("ALTER TABLE master_data MODIFY COLUMN status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'");
  } catch (error) {
    // Ignore when table does not exist yet.
  }

  // All table creation is driven from Sequelize model configuration.
  await sequelize.sync();

  const queryInterface = sequelize.getQueryInterface();

  // Backfill legacy databases that were created before 4M schema expansion.
  const changeRequestColumns = await queryInterface.describeTable('change_requests');
  const legacyColumnAdds = [
    ['request_no', { type: DataTypes.STRING(50), allowNull: true }],
    ['request_date', { type: DataTypes.DATEONLY, allowNull: true }],
    ['production_line', { type: DataTypes.STRING(120), allowNull: true }],
    ['machine', { type: DataTypes.STRING(120), allowNull: true }],
    ['sub_type', { type: DataTypes.STRING(120), allowNull: true }],
    ['old_value', { type: DataTypes.TEXT, allowNull: true }],
    ['new_value', { type: DataTypes.TEXT, allowNull: true }],
    ['quality_impact', { type: DataTypes.ENUM('Low', 'Medium', 'High'), allowNull: true }],
    ['cost_impact', { type: DataTypes.ENUM('Low', 'Medium', 'High'), allowNull: true }],
    ['delivery_impact', { type: DataTypes.ENUM('Low', 'Medium', 'High'), allowNull: true }],
    ['safety_impact', { type: DataTypes.ENUM('Low', 'Medium', 'High'), allowNull: true }],
    ['monitoring_period', { type: DataTypes.STRING(120), allowNull: true }],
    ['quality_result', { type: DataTypes.STRING(200), allowNull: true }],
    ['defect_rate', { type: DataTypes.STRING(50), allowNull: true }],
    ['monitoring_comments', { type: DataTypes.TEXT, allowNull: true }],
    ['current_operator', { type: DataTypes.STRING(120), allowNull: true }],
    ['proposed_operator', { type: DataTypes.STRING(120), allowNull: true }],
    ['required_skills', { type: DataTypes.TEXT, allowNull: true }],
    ['proposed_operator_skill_status', { type: DataTypes.ENUM('Matched', 'Gap'), allowNull: true }],
    ['training_required', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }],
    [
      'training_status',
      {
        type: DataTypes.ENUM('Not Required', 'Pending', 'Scheduled', 'Completed'),
        allowNull: true,
        defaultValue: 'Not Required',
      },
    ],
    ['training_notes', { type: DataTypes.TEXT, allowNull: true }],
      ['compliance_requirements', { type: DataTypes.TEXT, allowNull: true }],
      ['action_plan_required', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }],
      ['action_plan_notes', { type: DataTypes.TEXT, allowNull: true }],
  ];

  for (const [columnName, columnConfig] of legacyColumnAdds) {
    if (!changeRequestColumns[columnName]) {
      await queryInterface.addColumn('change_requests', columnName, columnConfig);
    }
  }

    const guidedProgressColumns = await queryInterface.describeTable('guided_setup_progress');
    if (!guidedProgressColumns.draft_forms) {
      await queryInterface.addColumn('guided_setup_progress', 'draft_forms', {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      });
    }

  const masterDataColumns = await queryInterface.describeTable('master_data');
  if (!masterDataColumns.status) {
    await queryInterface.addColumn('master_data', 'status', {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    });
  }

  const tables = await queryInterface.showAllTables();
  const normalized = new Set(tables.map((table) => (typeof table === 'string' ? table : table.tableName)));

  const missingTables = REQUIRED_TABLES.filter((tableName) => !normalized.has(tableName));
  if (missingTables.length > 0) {
    // Retry once in case some tables were pending due to order/association timing.
    await sequelize.sync();

    const tablesAfterRetry = await queryInterface.showAllTables();
    const normalizedAfterRetry = new Set(
      tablesAfterRetry.map((table) => (typeof table === 'string' ? table : table.tableName))
    );

    const stillMissing = REQUIRED_TABLES.filter((tableName) => !normalizedAfterRetry.has(tableName));
    if (stillMissing.length > 0) {
      throw new Error(`Table creation failed for: ${stillMissing.join(', ')}`);
    }
  }
};

export const seedDemoDataIfNeeded = async () => {
  const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true';
  if (!shouldSeedDemo) return;

  const adminRole = await Role.findOne({ where: { name: 'Admin' } });
  const managerRole = await Role.findOne({ where: { name: 'Manager' } });
  const userRole = await Role.findOne({ where: { name: 'User' } });

  const [[adminUser]] = await Promise.all([
    User.scope('withPassword').findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        name: 'Plant Admin',
        email: 'admin@example.com',
        password: 'Password@123',
        role_id: adminRole.id,
      },
    }),
    User.scope('withPassword').findOrCreate({
      where: { email: 'manager@example.com' },
      defaults: {
        name: 'Line Manager',
        email: 'manager@example.com',
        password: 'Password@123',
        role_id: managerRole.id,
      },
    }),
    User.scope('withPassword').findOrCreate({
      where: { email: 'user@example.com' },
      defaults: {
        name: 'Operator User',
        email: 'user@example.com',
        password: 'Password@123',
        role_id: userRole.id,
      },
    }),
  ]);

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
