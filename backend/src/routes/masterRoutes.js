import express from 'express';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validators.js';
import { createMaster, deleteMaster, getMasters, updateMaster } from '../controllers/masterController.js';

const router = express.Router();

const categoriesWithRequiredType = new Set([
  'change_subtype',
  'operator_skill_map',
  'machine_skill_requirement',
  'training_program',
  'type_requirement',
  'type_action_template',
]);

const validateTypeByCategory = (value, { req }) => {
  const category = req.body?.category;
  const cleanedType = typeof value === 'string' ? value.trim() : value;

  if (categoriesWithRequiredType.has(category) && !cleanedType) {
    throw new Error('type is required for this category');
  }

  if (cleanedType == null || cleanedType === '') return true;

  if (typeof cleanedType !== 'string' || cleanedType.length > 50) {
    throw new Error('Invalid type');
  }

  return true;
};

router.use(authMiddleware);

router.get(
  '/',
  authorizePermissions('changes.read'),
  query('category')
    .optional()
    .isIn([
      'department',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'training_program',
      'type_requirement',
      'type_action_template',
    ])
    .withMessage('Invalid category'),
  query('type').optional({ nullable: true }).isString().isLength({ max: 50 }).withMessage('Invalid type'),
  query('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  getMasters
);

router.post(
  '/',
  authorizePermissions('changes.update'),
  body('category')
    .isIn([
      'department',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'training_program',
      'type_requirement',
      'type_action_template',
    ])
    .withMessage('Invalid category'),
  body('type').custom(validateTypeByCategory),
  body('name').trim().notEmpty().isLength({ max: 150 }).withMessage('name is required (max 150 chars)'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  createMaster
);

router.put(
  '/:id',
  authorizePermissions('changes.update'),
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  body('category')
    .isIn([
      'department',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'training_program',
      'type_requirement',
      'type_action_template',
    ])
    .withMessage('Invalid category'),
  body('type').custom(validateTypeByCategory),
  body('name').trim().notEmpty().isLength({ max: 150 }).withMessage('name is required (max 150 chars)'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  validateRequest,
  updateMaster
);

router.delete(
  '/:id',
  authorizePermissions('changes.update'),
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  validateRequest,
  deleteMaster
);

export default router;
