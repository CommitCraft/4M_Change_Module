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
  'Masters - Machine': [
    'masters.machine.read',
    'masters.machine.create',
    'masters.machine.update',
    'masters.machine.delete',
  ],
  'Masters - Production Line': [
    'masters.productionline.read',
    'masters.productionline.create',
    'masters.productionline.update',
    'masters.productionline.delete',
  ],
  'Masters - Skill': [
    'masters.skill.read',
    'masters.skill.create',
    'masters.skill.update',
    'masters.skill.delete',
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
