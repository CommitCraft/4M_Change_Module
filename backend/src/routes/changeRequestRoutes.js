import express from 'express';
import {
  createChangeRequest,
  getChangeRequests,
  getChangeRequestById,
  updateChangeRequest,
  deleteChangeRequest,
  getDashboardStats,
} from '../controllers/changeRequestController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import {
  createChangeValidation,
  idParamValidation,
  queryValidation,
  updateChangeValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard/stats', authorizePermissions('dashboard.view', 'changes.read'), getDashboardStats);
router.post('/', authorizePermissions('changes.create'), createChangeValidation, validateRequest, createChangeRequest);
router.get('/', authorizePermissions('changes.read', 'changes.update'), queryValidation, validateRequest, getChangeRequests);
router.get('/:id', authorizePermissions('changes.read'), idParamValidation, validateRequest, getChangeRequestById);
router.put('/:id', authorizePermissions('changes.update'), updateChangeValidation, validateRequest, updateChangeRequest);
router.delete('/:id', authorizePermissions('changes.delete'), idParamValidation, validateRequest, deleteChangeRequest);

export default router;
