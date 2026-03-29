import models from '../models/index.js';
const { Role, RolePermission, User } = models;
import { sendError, sendResponse } from '../utils/response.js';
import { ADMIN_MANDATORY_PERMISSIONS, ALL_PERMISSIONS } from '../utils/permissions.js';

const withMandatoryPermissions = (basePermissions = [], mandatoryPermissions = []) => {
  return Array.from(new Set([...(basePermissions || []), ...(mandatoryPermissions || [])]));
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{ model: RolePermission, attributes: ['permissions'] }],
      order: [['id', 'ASC']],
    });

    const mapped = await Promise.all(
      roles.map(async (role) => {
        const usersCount = await User.count({ where: { role_id: role.id } });
        return {
          id: role.id,
          name: role.name,
          users_count: usersCount,
          permissions: role.RolePermission?.permissions || [],
        };
      })
    );

    sendResponse(res, 200, 'Roles fetched successfully', mapped);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch roles', error.message);
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{ model: RolePermission, attributes: ['permissions'] }],
    });
    if (!role) return sendError(res, 404, 'Role not found');

    const users = await User.findAll({
      where: { role_id: role.id },
      attributes: ['id', 'name', 'email', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    sendResponse(res, 200, 'Role fetched successfully', {
      id: role.id,
      name: role.name,
      users_count: users.length,
      permissions: role.RolePermission?.permissions || [],
      users,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch role', error.message);
  }
};

export const createRole = async (req, res) => {
  try {
    const { permissions = [] } = req.body;
    const name = req.body.name?.trim();

    const existing = await Role.findOne({ where: { name } });
    if (existing) return sendError(res, 409, 'Role already exists');

    const finalPermissions = name === 'Admin' ? withMandatoryPermissions(permissions, ADMIN_MANDATORY_PERMISSIONS) : permissions;

    const role = await Role.create({ name });
    await RolePermission.create({
      role_id: role.id,
      permissions: finalPermissions,
    });

    sendResponse(res, 201, 'Role created successfully', {
      id: role.id,
      name: role.name,
      users_count: 0,
      permissions: finalPermissions,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to create role', error.message);
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) return sendError(res, 404, 'Role not found');

    if (req.user.role !== 'SuperAdmin' && role.name === req.user.role) {
      return sendError(res, 403, 'You cannot update your own role');
    }

    if (name) {
      const normalizedName = name.trim();

      if (role.name === 'SuperAdmin' && normalizedName !== 'SuperAdmin') {
        return sendError(res, 403, 'SuperAdmin role cannot be renamed');
      }

      if (role.name !== normalizedName) {
        const duplicate = await Role.findOne({ where: { name: normalizedName } });
        if (duplicate) return sendError(res, 409, 'Role already exists');
      }

      role.name = normalizedName;
      await role.save();
    }

    if (permissions) {
      const [permissionRow] = await RolePermission.findOrCreate({
        where: { role_id: role.id },
        defaults: { role_id: role.id, permissions: [] },
      });

      // Keep SuperAdmin permanently at full access to avoid privilege lockout.
      if (role.name === 'SuperAdmin') {
        permissionRow.permissions = [...ALL_PERMISSIONS];
      } else if (role.name === 'Admin') {
        permissionRow.permissions = withMandatoryPermissions(permissions, ADMIN_MANDATORY_PERMISSIONS);
      } else {
        permissionRow.permissions = permissions;
      }
      await permissionRow.save();
    }

    if (role.name === 'Admin' && !permissions) {
      const [permissionRow] = await RolePermission.findOrCreate({
        where: { role_id: role.id },
        defaults: { role_id: role.id, permissions: [] },
      });
      permissionRow.permissions = withMandatoryPermissions(permissionRow.permissions, ADMIN_MANDATORY_PERMISSIONS);
      await permissionRow.save();
    }

    sendResponse(res, 200, 'Role updated successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to update role', error.message);
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) return sendError(res, 404, 'Role not found');

    if (req.user.role !== 'SuperAdmin' && role.name === req.user.role) {
      return sendError(res, 403, 'You cannot delete your own role');
    }

    if (role.name === 'SuperAdmin') {
      return sendError(res, 403, 'SuperAdmin role cannot be deleted');
    }

    const assignedUsers = await User.count({ where: { role_id: role.id } });
    if (assignedUsers > 0) {
      return sendError(res, 400, 'Cannot delete role assigned to users');
    }

    await role.destroy();
    sendResponse(res, 200, 'Role deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to delete role', error.message);
  }
};
