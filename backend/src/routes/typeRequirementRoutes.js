import express from 'express';
import {
  getTypeRequirements,
  createTypeRequirement,
  updateTypeRequirement,
  deleteTypeRequirement
} from '../controllers/typeRequirementController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all type requirements
router.get('/', getTypeRequirements);

// POST create a new type requirement
router.post('/', ...getValidationForSchema('typeRequirement'), createTypeRequirement);

// PUT update a type requirement
router.put('/:id', ...getValidationForSchema('typeRequirement'), updateTypeRequirement);

// DELETE a type requirement
router.delete('/:id', deleteTypeRequirement);

export default router;
