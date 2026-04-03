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
  'method_skill_map',
  'material_skill_map',
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

const CATEGORY_PERMISSIONS = {
  department: 'masters.department',
  production_line: 'masters.productionline',
  machine: 'masters.machine',
  change_subtype: 'masters.change_subtype',
  risk_level: 'masters.risk_level',
  operator: 'masters.operator',
  skill: 'masters.skill',
  operator_skill_map: 'masters.operator_skill_map',
  machine_skill_requirement: 'masters.machine_skill_requirement',
  method_skill_map: 'masters.method_skill_map',
  material_skill_map: 'masters.material_skill_map',
  training_program: 'masters.training_program',
  type_requirement: 'masters.type_requirement',
  type_action_template: 'masters.type_action_template',
};

const getCategoryPermission = (category, action) => {
  const moduleName = CATEGORY_PERMISSIONS[category];
  if (!moduleName) return null;
  return `${moduleName}.${action}`;
};

router.use(authMiddleware);

router.get(
  '/',
  (req, res, next) => {
    const category = req.query.category;
    if (category) {
      const permission = getCategoryPermission(category, 'read');
      if (!permission) return res.status(400).json({ message: 'Invalid category' });
      return authorizePermissions(permission)(req, res, next);
    }
    return authorizePermissions('changes.read')(req, res, next);
  },
  query('category')
    .optional()
    .isIn([
      'department',
      'production_line',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'method_skill_map',
      'material_skill_map',
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
  (req, res, next) => {
    const permission = getCategoryPermission(req.body?.category, 'create');
    if (!permission) return res.status(400).json({ message: 'Invalid category' });
    return authorizePermissions(permission)(req, res, next);
  },
  body('category')
    .isIn([
      'department',
      'production_line',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'method_skill_map',
      'material_skill_map',
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
  (req, res, next) => {
    const permission = getCategoryPermission(req.body?.category, 'update');
    if (!permission) return res.status(400).json({ message: 'Invalid category' });
    return authorizePermissions(permission)(req, res, next);
  },
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  body('category')
    .isIn([
      'department',
      'production_line',
      'machine',
      'change_subtype',
      'risk_level',
      'operator',
      'skill',
      'operator_skill_map',
      'machine_skill_requirement',
      'method_skill_map',
      'material_skill_map',
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
