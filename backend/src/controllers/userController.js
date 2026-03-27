import { Op } from 'sequelize';
import { Role, User } from '../models/index.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });

    sendResponse(
      res,
      200,
      'Users fetched successfully',
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.Role.name,
        created_at: u.created_at,
      }))
    );
  } catch (error) {
    sendError(res, 500, 'Failed to fetch users', error.message);
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (req.user.role !== 'SuperAdmin' && ['SuperAdmin', 'Admin'].includes(role)) {
      return sendError(res, 403, 'Only SuperAdmin can create Admin or SuperAdmin accounts');
    }

    const roleRecord = await Role.findOne({ where: { name: role } });

    if (!roleRecord) return sendError(res, 400, 'Invalid role');

    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) return sendError(res, 409, 'Email already exists');

    const user = await User.create({
      name,
      email,
      password,
      role_id: roleRecord.id,
    });

    sendResponse(res, 201, 'User created successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to create user', error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // If user is updating their own profile, allow name, email, password update, but not role
    if (Number(id) === req.user.id && req.user.role !== 'SuperAdmin') {
      if (role) {
        return sendError(res, 403, 'You are not allowed to change your role');
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
