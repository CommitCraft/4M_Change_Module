import { Role, User } from '../models/index.js';

const ALL_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'User'];

export const bootstrapRolesAndSuperAdmin = async () => {
  for (const roleName of ALL_ROLES) {
    await Role.findOrCreate({ where: { name: roleName }, defaults: { name: roleName } });
  }

  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be configured in .env');
  }

  const superAdminRole = await Role.findOne({ where: { name: 'SuperAdmin' } });
  const existingUser = await User.scope('withPassword').findOne({ where: { email: superAdminEmail } });

  if (!existingUser) {
    await User.create({
      name: 'System SuperAdmin',
      email: superAdminEmail,
      password: superAdminPassword,
      role_id: superAdminRole.id,
    });
  }
};
