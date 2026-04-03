import express from 'express';
import {
  getChangeSubTypes,
  createChangeSubType,
  updateChangeSubType,
  deleteChangeSubType
} from '../controllers/changeSubTypeController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all change subtypes
router.get('/', authorizePermissions('masters.change_subtype.read'), getChangeSubTypes);

// POST create a new change subtype
router.post('/', authorizePermissions('masters.change_subtype.create'), ...getValidationForSchema('changeSubType'), createChangeSubType);

// PUT update a change subtype
router.put('/:id', authorizePermissions('masters.change_subtype.update'), ...getValidationForSchema('changeSubType'), updateChangeSubType);

// DELETE a change subtype
router.delete('/:id', authorizePermissions('masters.change_subtype.delete'), deleteChangeSubType);

export default router;
