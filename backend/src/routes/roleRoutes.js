import express from 'express';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { createRole, deleteRole, getRoleById, getRoles, updateRole } from '../controllers/roleController.js';
import {
  createRoleValidation,
  idParamValidation,
  updateRoleValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermissions('roles.read'), getRoles);
router.get('/:id', authorizePermissions('roles.read'), idParamValidation, validateRequest, getRoleById);
router.post('/', authorizePermissions('roles.create'), createRoleValidation, validateRequest, createRole);
router.put('/:id', authorizePermissions('roles.update'), updateRoleValidation, validateRequest, updateRole);
router.delete('/:id', authorizePermissions('roles.delete'), idParamValidation, validateRequest, deleteRole);

export default router;
