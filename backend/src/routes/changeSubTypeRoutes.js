import express from 'express';
import {
  getChangeSubTypes,
  createChangeSubType,
  updateChangeSubType,
  deleteChangeSubType
} from '../controllers/changeSubTypeController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all change subtypes
router.get('/', getChangeSubTypes);

// POST create a new change subtype
router.post('/', ...getValidationForSchema('changeSubType'), createChangeSubType);

// PUT update a change subtype
router.put('/:id', ...getValidationForSchema('changeSubType'), updateChangeSubType);

// DELETE a change subtype
router.delete('/:id', deleteChangeSubType);

export default router;
