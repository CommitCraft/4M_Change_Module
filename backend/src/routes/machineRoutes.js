import express from 'express';
import {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine
} from '../controllers/machineController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();


import { authMiddleware, authorizePermissions } from '../middleware/auth.js';

router.use(authMiddleware);

// GET all machines
router.get('/', getMachines);

// POST create a new machine
router.post('/', authorizePermissions('masters.machine.create'), ...getValidationForSchema('machine'), createMachine);

// PUT update a machine
router.put('/:id', authorizePermissions('masters.machine.update'), ...getValidationForSchema('machine'), updateMachine);

// DELETE a machine
router.delete('/:id', authorizePermissions('masters.machine.delete'), deleteMachine);

export default router;
