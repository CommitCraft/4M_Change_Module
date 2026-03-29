import express from 'express';
import {
  getOperators,
  createOperator,
  updateOperator,
  deleteOperator
} from '../controllers/operatorController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all operators
router.get('/', getOperators);

// POST create a new operator
router.post('/', ...getValidationForSchema('operator'), createOperator);

// PUT update an operator
router.put('/:id', ...getValidationForSchema('operator'), updateOperator);

// DELETE an operator
router.delete('/:id', deleteOperator);

export default router;
