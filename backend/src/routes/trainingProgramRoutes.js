import express from 'express';
import {
  getTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram
} from '../controllers/trainingProgramController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all training programs
router.get('/', authorizePermissions('masters.training_program.read'), getTrainingPrograms);

// POST create a new training program
router.post('/', authorizePermissions('masters.training_program.create'), ...getValidationForSchema('trainingProgram'), createTrainingProgram);

// PUT update a training program
router.put('/:id', authorizePermissions('masters.training_program.update'), ...getValidationForSchema('trainingProgram'), updateTrainingProgram);

// DELETE a training program
router.delete('/:id', authorizePermissions('masters.training_program.delete'), deleteTrainingProgram);

export default router;
