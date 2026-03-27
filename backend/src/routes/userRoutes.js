import express from 'express';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { createUser, deleteUser, getUsers, updateUser } from '../controllers/userController.js';
import {
  createUserValidation,
  idParamValidation,
  updateUserValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermissions('users.read'), getUsers);
router.post('/', authorizePermissions('users.create'), createUserValidation, validateRequest, createUser);
router.put('/:id', authorizePermissions('users.update'), updateUserValidation, validateRequest, updateUser);
router.delete('/:id', authorizePermissions('users.delete'), idParamValidation, validateRequest, deleteUser);

export default router;
