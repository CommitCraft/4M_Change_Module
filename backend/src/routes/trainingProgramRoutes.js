import express from 'express';
import {
  getTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram
} from '../controllers/trainingProgramController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all training programs
router.get('/', getTrainingPrograms);

// POST create a new training program
router.post('/', ...getValidationForSchema('trainingProgram'), createTrainingProgram);

// PUT update a training program
router.put('/:id', ...getValidationForSchema('trainingProgram'), updateTrainingProgram);

// DELETE a training program
router.delete('/:id', deleteTrainingProgram);

export default router;
