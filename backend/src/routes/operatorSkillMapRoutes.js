import express from 'express';
import {
  getOperatorSkillMaps,
  createOperatorSkillMap,
  updateOperatorSkillMap,
  deleteOperatorSkillMap
} from '../controllers/operatorSkillMapController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all operator-skill mappings
router.get('/', getOperatorSkillMaps);

// POST create a new operator-skill mapping
router.post('/', ...getValidationForSchema('operatorSkillMap'), createOperatorSkillMap);

// PUT update an operator-skill mapping
router.put('/:id', ...getValidationForSchema('operatorSkillMap'), updateOperatorSkillMap);

// DELETE an operator-skill mapping
router.delete('/:id', deleteOperatorSkillMap);

export default router;
