import express from 'express';
import {
  getMachineSkillRequirements,
  createMachineSkillRequirement,
  updateMachineSkillRequirement,
  deleteMachineSkillRequirement
} from '../controllers/machineSkillRequirementController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all machine-skill requirements
router.get('/', authorizePermissions('masters.machine_skill_requirement.read'), getMachineSkillRequirements);

// POST create a new machine-skill requirement
router.post('/', authorizePermissions('masters.machine_skill_requirement.create'), ...getValidationForSchema('machineSkillRequirement'), createMachineSkillRequirement);

// PUT update a machine-skill requirement
router.put('/:id', authorizePermissions('masters.machine_skill_requirement.update'), ...getValidationForSchema('machineSkillRequirement'), updateMachineSkillRequirement);

// DELETE a machine-skill requirement
router.delete('/:id', authorizePermissions('masters.machine_skill_requirement.delete'), deleteMachineSkillRequirement);

export default router;
