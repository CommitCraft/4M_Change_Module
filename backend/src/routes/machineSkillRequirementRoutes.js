import express from 'express';
import {
  getMachineSkillRequirements,
  createMachineSkillRequirement,
  updateMachineSkillRequirement,
  deleteMachineSkillRequirement
} from '../controllers/machineSkillRequirementController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all machine-skill requirements
router.get('/', getMachineSkillRequirements);

// POST create a new machine-skill requirement
router.post('/', ...getValidationForSchema('machineSkillRequirement'), createMachineSkillRequirement);

// PUT update a machine-skill requirement
router.put('/:id', ...getValidationForSchema('machineSkillRequirement'), updateMachineSkillRequirement);

// DELETE a machine-skill requirement
router.delete('/:id', deleteMachineSkillRequirement);

export default router;
