import { Op } from 'sequelize';
import models from '../models/index.js';
const { Role, User, Department } = models;
import { sendError, sendResponse } from '../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: Role, attributes: ['name'] },
        { model: Department, attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const visibleUsers = req.user.role === 'SuperAdmin'
      ? users
      : users.filter((entry) => entry.department_id === req.user.department_id);

    sendResponse(
      res,
      200,
      'Users fetched successfully',
      visibleUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.Role.name,
        department_id: u.department_id || null,
        department: u.Department?.name || null,
        created_at: u.created_at,
      }))
    );
  } catch (error) {
    sendError(res, 500, 'Failed to fetch users', error.message);
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department_id } = req.body;

    if (req.user.role !== 'SuperAdmin' && ['SuperAdmin', 'Admin'].includes(role)) {
      return sendError(res, 403, 'Only SuperAdmin can create Admin or SuperAdmin accounts');
    }

    const roleRecord = await Role.findOne({ where: { name: role } });

    if (!roleRecord) return sendError(res, 400, 'Invalid role');

    const normalizedDepartmentId = department_id ? Number(department_id) : null;
    if (normalizedDepartmentId) {
      const department = await Department.findByPk(normalizedDepartmentId);
      if (!department) return sendError(res, 400, 'Invalid department');
    }

    if (req.user.role !== 'SuperAdmin') {
      if (!req.user.department_id) {
        return sendError(res, 403, 'Your account is not assigned to a department');
      }
      if (normalizedDepartmentId && normalizedDepartmentId !== req.user.department_id) {
        return sendError(res, 403, 'You can only create users in your own department');
      }
    }

    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) return sendError(res, 409, 'Email already exists');

    const user = await User.create({
      name,
      email,
      password,
      role_id: roleRecord.id,
      department_id: req.user.role === 'SuperAdmin' ? normalizedDepartmentId : req.user.department_id,
    });

    sendResponse(res, 201, 'User created successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      department_id: user.department_id || null,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to create user', error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department_id } = req.body;

    // If user is updating their own profile, allow name, email, password update, but not role
    if (Number(id) === req.user.id && req.user.role !== 'SuperAdmin') {
      if (role || typeof department_id !== 'undefined') {
        return sendError(res, 403, 'You are not allowed to change your role or department');
      }
      // Only allow name, email, password update for self
    } else if (Number(id) !== req.user.id && req.user.role !== 'SuperAdmin') {
      // Only SuperAdmin can update other users
      return sendError(res, 403, 'Only SuperAdmin can update other users');
    }

    const user = await User.scope('withPassword').findByPk(id, {
      include: [{ model: Role, attributes: ['name'] }],
    });
    if (!user) return sendError(res, 404, 'User not found');

    if (req.user.role !== 'SuperAdmin' && user.Role?.name === 'SuperAdmin') {
      return sendError(res, 403, 'Only SuperAdmin can modify SuperAdmin account');
    }

    if (email && email !== user.email) {
      const duplicate = await User.scope('withPassword').findOne({
        where: {
          email,
          id: { [Op.ne]: Number(id) },
        },
      });
      if (duplicate) return sendError(res, 409, 'Email already exists');
    }

    if (role) {
      if (req.user.role !== 'SuperAdmin' && ['SuperAdmin', 'Admin'].includes(role)) {
        return sendError(res, 403, 'Only SuperAdmin can assign Admin or SuperAdmin roles');
      }

      const roleRecord = await Role.findOne({ where: { name: role } });
      if (!roleRecord) return sendError(res, 400, 'Invalid role');
      user.role_id = roleRecord.id;
    }

    if (typeof department_id !== 'undefined') {
      if (req.user.role !== 'SuperAdmin' && Number(id) !== req.user.id) {
        return sendError(res, 403, 'Only SuperAdmin can change department for other users');
      }

      const normalizedDepartmentId = department_id ? Number(department_id) : null;
      if (normalizedDepartmentId) {
        const department = await Department.findByPk(normalizedDepartmentId);
        if (!department) return sendError(res, 400, 'Invalid department');
      }

      if (req.user.role !== 'SuperAdmin' && normalizedDepartmentId && normalizedDepartmentId !== req.user.department_id) {
        return sendError(res, 403, 'You can only assign your own department');
      }

      user.department_id = req.user.role === 'SuperAdmin' ? normalizedDepartmentId : req.user.department_id;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
    sendResponse(res, 200, 'User updated successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to update user', error.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return sendError(res, 400, 'You cannot delete your own account');
    }

    const user = await User.findByPk(id, { include: [{ model: Role, attributes: ['name'] }] });
    if (!user) return sendError(res, 404, 'User not found');

    if (req.user.role !== 'SuperAdmin' && user.Role?.name === 'SuperAdmin') {
      return sendError(res, 403, 'Only SuperAdmin can delete SuperAdmin account');
    }

    await user.destroy();
    sendResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to delete user', error.message);
  }
};
