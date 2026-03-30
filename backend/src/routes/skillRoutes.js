import express from 'express';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();


import { authMiddleware, authorizePermissions } from '../middleware/auth.js';

router.use(authMiddleware);

// GET all skills
router.get('/', authorizePermissions('masters.skill.read'), getSkills);

// POST create a new skill
router.post('/', authorizePermissions('masters.skill.create'), ...getValidationForSchema('skill'), createSkill);

// PUT update a skill
router.put('/:id', authorizePermissions('masters.skill.update'), ...getValidationForSchema('skill'), updateSkill);

// DELETE a skill
router.delete('/:id', authorizePermissions('masters.skill.delete'), deleteSkill);

export default router;
