import express from 'express';
import {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine
} from '../controllers/machineController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all machines
router.get('/', getMachines);

// POST create a new machine
router.post('/', ...getValidationForSchema('machine'), createMachine);

// PUT update a machine
router.put('/:id', ...getValidationForSchema('machine'), updateMachine);

// DELETE a machine
router.delete('/:id', deleteMachine);

export default router;
