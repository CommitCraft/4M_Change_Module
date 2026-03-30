export const ALL_PERMISSIONS = [
  'dashboard.view',
  'changes.read',
  'changes.create',
  'changes.update',
  'changes.delete',
  'approvals.read',
  'approvals.approve',
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'attachments.read',
  'attachments.upload',
  'attachments.delete',
  // Masters Page section permissions
  'masters.department.read',
  'masters.department.create',
  'masters.department.update',
  'masters.department.delete',
  'masters.machine.read',
  'masters.machine.create',
  'masters.machine.update',
  'masters.machine.delete',
  'masters.productionline.read',
  'masters.productionline.create',
  'masters.productionline.update',
  'masters.productionline.delete',
  'masters.skill.read',
  'masters.skill.create',
  'masters.skill.update',
  'masters.skill.delete',
  // 4M Guided Setup section permissions
  'guidedsetup.man.read',
  'guidedsetup.man.update',
  'guidedsetup.machine.read',
  'guidedsetup.machine.update',
  'guidedsetup.method.read',
  'guidedsetup.method.update',
  'guidedsetup.material.read',
  'guidedsetup.material.update',
];

export const ADMIN_MANDATORY_PERMISSIONS = ['dashboard.view', 'changes.read', 'approvals.read'];

export const PERMISSION_GROUPS = {
  Dashboard: ['dashboard.view'],
  Changes: ['changes.read', 'changes.create', 'changes.update', 'changes.delete'],
  Approvals: ['approvals.read', 'approvals.approve'],
  Users: ['users.read', 'users.create', 'users.update', 'users.delete'],
  Roles: ['roles.read', 'roles.create', 'roles.update', 'roles.delete'],
  Attachments: ['attachments.read', 'attachments.upload', 'attachments.delete'],
  // Masters Page
  'Masters - Department': [
    'masters.department.read',
    'masters.department.create',
    'masters.department.update',
    'masters.department.delete',
  ],
  'Masters - Production Line': [
    'masters.productionline.read',
    'masters.productionline.create',
    'masters.productionline.update',
    'masters.productionline.delete',
  ],
  'Masters - Machine': [
    'masters.machine.read',
    'masters.machine.create',
    'masters.machine.update',
    'masters.machine.delete',
  ],
  'Masters - Change Subtype': [
    'masters.change_subtype.read',
    'masters.change_subtype.create',
    'masters.change_subtype.update',
    'masters.change_subtype.delete',
  ],
  'Masters - Risk Level': [
    'masters.risk_level.read',
    'masters.risk_level.create',
    'masters.risk_level.update',
    'masters.risk_level.delete',
  ],
  'Masters - Operator': [
    'masters.operator.read',
    'masters.operator.create',
    'masters.operator.update',
    'masters.operator.delete',
  ],
  'Masters - Skill': [
    'masters.skill.read',
    'masters.skill.create',
    'masters.skill.update',
    'masters.skill.delete',
  ],
  'Masters - Operator Skill Map': [
    'masters.operator_skill_map.read',
    'masters.operator_skill_map.create',
    'masters.operator_skill_map.update',
    'masters.operator_skill_map.delete',
  ],
  'Masters - Machine Skill Requirement': [
    'masters.machine_skill_requirement.read',
    'masters.machine_skill_requirement.create',
    'masters.machine_skill_requirement.update',
    'masters.machine_skill_requirement.delete',
  ],
  'Masters - Method Skill Map': [
    'masters.method_skill_map.read',
    'masters.method_skill_map.create',
    'masters.method_skill_map.update',
    'masters.method_skill_map.delete',
  ],
  'Masters - Material Skill Map': [
    'masters.material_skill_map.read',
    'masters.material_skill_map.create',
    'masters.material_skill_map.update',
    'masters.material_skill_map.delete',
  ],
  'Masters - Training Program': [
    'masters.training_program.read',
    'masters.training_program.create',
    'masters.training_program.update',
    'masters.training_program.delete',
  ],
  'Masters - Type Requirement': [
    'masters.type_requirement.read',
    'masters.type_requirement.create',
    'masters.type_requirement.update',
    'masters.type_requirement.delete',
  ],
  'Masters - Type Action Template': [
    'masters.type_action_template.read',
    'masters.type_action_template.create',
    'masters.type_action_template.update',
    'masters.type_action_template.delete',
  ],
  // 4M Guided Setup
  '4M Guided Setup - Man': [
    'guidedsetup.man.read',
    'guidedsetup.man.update',
  ],
  '4M Guided Setup - Machine': [
    'guidedsetup.machine.read',
    'guidedsetup.machine.update',
  ],
  '4M Guided Setup - Method': [
    'guidedsetup.method.read',
    'guidedsetup.method.update',
  ],
  '4M Guided Setup - Material': [
    'guidedsetup.material.read',
    'guidedsetup.material.update',
  ],
};

const ACTION_LABELS = {
  view: 'View',
  read: 'Read',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
  upload: 'Upload',
};

const toTitleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export const formatPermissionLabel = (permission) => {
  if (!permission || typeof permission !== 'string') return '';

  const [moduleName = '', action = ''] = permission.split('.');
  const moduleLabel = toTitleCase(moduleName);
  const actionLabel = ACTION_LABELS[action] || toTitleCase(action);

  if (!action) return moduleLabel;
  return `${moduleLabel} - ${actionLabel}`;
};
