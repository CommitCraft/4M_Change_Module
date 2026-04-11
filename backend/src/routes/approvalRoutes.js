import express from 'express';
import { approveRequest, getApprovalsByRequest, changeApproval } from '../controllers/approvalController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { approveValidation, validateRequest } from '../middleware/validators.js';
import { param } from 'express-validator';

const router = express.Router();

router.use(authMiddleware);
router.post('/', authorizePermissions('approvals.approve'), approveValidation, validateRequest, approveRequest);
router.patch('/:approval_id', authorizePermissions('approvals.approve'), approveValidation, validateRequest, changeApproval);
router.get(
  '/:request_id',
  authorizePermissions('approvals.read'),
  [param('request_id').isInt({ min: 1 }).withMessage('Invalid request id')],
  validateRequest,
  getApprovalsByRequest
);

export default router;