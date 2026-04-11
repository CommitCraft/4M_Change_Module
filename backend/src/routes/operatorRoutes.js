import express from 'express';
import {
  getOperators,
  createOperator,
  updateOperator,
  deleteOperator
} from '../controllers/operatorController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all operators
router.get('/', getOperators);

// POST create a new operator
router.post('/', authorizePermissions('masters.operator.create'), ...getValidationForSchema('operator'), createOperator);

// PUT update an operator
router.put('/:id', authorizePermissions('masters.operator.update'), ...getValidationForSchema('operator'), updateOperator);

// DELETE an operator
router.delete('/:id', authorizePermissions('masters.operator.delete'), deleteOperator);

export default router;
