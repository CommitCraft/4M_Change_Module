import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import models from '../models/index.js';
const { User, Role, RolePermission } = models;

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return sendError(res, 401, 'No token provided');
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, include: [{ model: RolePermission, attributes: ['permissions'] }] }],
      attributes: ['id', 'name', 'email'],
    });

    if (!user) return sendError(res, 401, 'Invalid token');

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.Role.name,
      permissions: user.Role?.RolePermission?.permissions || [],
    };
    next();
  } catch (error) {
    sendError(res, 401, 'Authentication error', error.message);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Insufficient permissions');
    }

    next();
  };
};

export const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'User not authenticated');
    }

    if (req.user.role === 'SuperAdmin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAnyPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

    if (!hasAnyPermission) {
      return sendError(res, 403, 'Insufficient permissions');
    }

    next();
  };
};
