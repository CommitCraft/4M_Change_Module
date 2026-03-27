import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validators.js';
import {
  getGuidedSetupProgress,
  saveGuidedSetupProgress,
  resetGuidedSetupProgress,
} from '../controllers/guidedSetupController.js';

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/:flow_type',
  authorizePermissions('changes.read'),
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  validateRequest,
  getGuidedSetupProgress
);

router.put(
  '/:flow_type',
  authorizePermissions('changes.update'),
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  body('completed_steps').optional().isArray().withMessage('completed_steps must be an array'),
  body('current_step_index').optional().isInt({ min: 0 }).withMessage('current_step_index must be >= 0'),
  body('draft_forms').optional().isObject().withMessage('draft_forms must be an object'),
  validateRequest,
  saveGuidedSetupProgress
);

router.delete(
  '/:flow_type',
  authorizePermissions('changes.update'),
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  validateRequest,
  resetGuidedSetupProgress
);

export default router;
