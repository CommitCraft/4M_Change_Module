import models from '../models/index.js';
const { User, Role, RolePermission } = models;
import { generateToken } from '../utils/jwt.js';
import { sendResponse, sendError } from '../utils/response.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({
      where: { email },
      include: [{ model: Role, include: [{ model: RolePermission, attributes: ['permissions'] }] }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user);

    sendResponse(res, 200, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role.name,
        permissions: user.Role?.RolePermission?.permissions || [],
      },
      token,
    });
  } catch (error) {
    sendError(res, 500, 'Login error', error.message);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, include: [{ model: RolePermission, attributes: ['permissions'] }] }],
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendResponse(res, 200, 'Profile fetched', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role.name,
        permissions: user.Role?.RolePermission?.permissions || [],
      },
    });
  } catch (error) {
    sendError(res, 500, 'Error fetching profile', error.message);
  }
};
