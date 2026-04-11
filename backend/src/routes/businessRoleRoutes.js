import express from 'express';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { query } from 'express-validator';
import { validateRequest } from '../middleware/validators.js';
import { getBusinessRoles } from '../controllers/businessRoleController.js';

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/',
  query('m_module').optional().isIn(['Man', 'Machine', 'Material', 'Method', 'User']).withMessage('Invalid module'),
  query('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  getBusinessRoles
);

export default router;
