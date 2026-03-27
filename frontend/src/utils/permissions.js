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
];

export const ADMIN_MANDATORY_PERMISSIONS = ['dashboard.view', 'changes.read', 'approvals.read'];

export const PERMISSION_GROUPS = {
  Dashboard: ['dashboard.view'],
  Changes: ['changes.read', 'changes.create', 'changes.update', 'changes.delete'],
  Approvals: ['approvals.read', 'approvals.approve'],
  Users: ['users.read', 'users.create', 'users.update', 'users.delete'],
  Roles: ['roles.read', 'roles.create', 'roles.update', 'roles.delete'],
  Attachments: ['attachments.read', 'attachments.upload', 'attachments.delete'],
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
