import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validators.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

router.use(authMiddleware);


router.get(
  '/',
  query('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  getDepartments
);


router.post(
  '/',
  authorizePermissions('masters.department.create'),
  body('name').trim().notEmpty().isLength({ max: 150 }).withMessage('Name is required (max 150 chars)'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  createDepartment
);


router.put(
  '/:id',
  authorizePermissions('masters.department.update'),
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  body('name').trim().notEmpty().isLength({ max: 150 }).withMessage('Name is required (max 150 chars)'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  updateDepartment
);


router.delete(
  '/:id',
  authorizePermissions('masters.department.delete'),
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  validateRequest,
  deleteDepartment
);

export default router;
