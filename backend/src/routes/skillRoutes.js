import express from 'express';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all skills
router.get('/', getSkills);

// POST create a new skill
router.post('/', ...getValidationForSchema('skill'), createSkill);

// PUT update a skill
router.put('/:id', ...getValidationForSchema('skill'), updateSkill);

// DELETE a skill
router.delete('/:id', deleteSkill);

export default router;
