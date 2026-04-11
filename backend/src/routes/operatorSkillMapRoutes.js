import express from 'express';
import {
  getOperatorSkillMaps,
  createOperatorSkillMap,
  updateOperatorSkillMap,
  deleteOperatorSkillMap
} from '../controllers/operatorSkillMapController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all operator-skill mappings
router.get('/', getOperatorSkillMaps);

// POST create a new operator-skill mapping
router.post('/', authorizePermissions('masters.operator_skill_map.create'), ...getValidationForSchema('operatorSkillMap'), createOperatorSkillMap);

// PUT update an operator-skill mapping
router.put('/:id', authorizePermissions('masters.operator_skill_map.update'), ...getValidationForSchema('operatorSkillMap'), updateOperatorSkillMap);

// DELETE an operator-skill mapping
router.delete('/:id', authorizePermissions('masters.operator_skill_map.delete'), deleteOperatorSkillMap);

export default router;
