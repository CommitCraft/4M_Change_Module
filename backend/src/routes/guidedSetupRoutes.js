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
  (req, res, next) => {
    const flow = req.params.flow_type;
    let perm = null;
    if (flow === 'Man') perm = 'guidedsetup.man.read';
    else if (flow === 'Machine') perm = 'guidedsetup.machine.read';
    else if (flow === 'Method') perm = 'guidedsetup.method.read';
    else if (flow === 'Material') perm = 'guidedsetup.material.read';
    if (!perm) return res.status(400).json({ message: 'Invalid flow type' });
    return authorizePermissions(perm)(req, res, next);
  },
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  validateRequest,
  getGuidedSetupProgress
);


router.put(
  '/:flow_type',
  (req, res, next) => {
    const flow = req.params.flow_type;
    let perm = null;
    if (flow === 'Man') perm = 'guidedsetup.man.update';
    else if (flow === 'Machine') perm = 'guidedsetup.machine.update';
    else if (flow === 'Method') perm = 'guidedsetup.method.update';
    else if (flow === 'Material') perm = 'guidedsetup.material.update';
    if (!perm) return res.status(400).json({ message: 'Invalid flow type' });
    return authorizePermissions(perm)(req, res, next);
  },
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  body('completed_steps').optional().isArray().withMessage('completed_steps must be an array'),
  body('current_step_index').optional().isInt({ min: 0 }).withMessage('current_step_index must be >= 0'),
  body('draft_forms').optional().isObject().withMessage('draft_forms must be an object'),
  validateRequest,
  saveGuidedSetupProgress
);


router.delete(
  '/:flow_type',
  (req, res, next) => {
    const flow = req.params.flow_type;
    let perm = null;
    if (flow === 'Man') perm = 'guidedsetup.man.update';
    else if (flow === 'Machine') perm = 'guidedsetup.machine.update';
    else if (flow === 'Method') perm = 'guidedsetup.method.update';
    else if (flow === 'Material') perm = 'guidedsetup.material.update';
    if (!perm) return res.status(400).json({ message: 'Invalid flow type' });
    return authorizePermissions(perm)(req, res, next);
  },
  param('flow_type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid flow type'),
  validateRequest,
  resetGuidedSetupProgress
);

export default router;
