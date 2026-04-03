import express from 'express';
import {
  getTypeRequirements,
  createTypeRequirement,
  updateTypeRequirement,
  deleteTypeRequirement
} from '../controllers/typeRequirementController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all type requirements
router.get('/', authorizePermissions('masters.type_requirement.read'), getTypeRequirements);

// POST create a new type requirement
router.post('/', authorizePermissions('masters.type_requirement.create'), ...getValidationForSchema('typeRequirement'), createTypeRequirement);

// PUT update a type requirement
router.put('/:id', authorizePermissions('masters.type_requirement.update'), ...getValidationForSchema('typeRequirement'), updateTypeRequirement);

// DELETE a type requirement
router.delete('/:id', authorizePermissions('masters.type_requirement.delete'), deleteTypeRequirement);

export default router;
