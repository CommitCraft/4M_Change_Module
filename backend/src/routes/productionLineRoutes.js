import express from 'express';
import {
  getProductionLines,
  createProductionLine,
  updateProductionLine,
  deleteProductionLine
} from '../controllers/productionLineController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all production lines
router.get('/', getProductionLines);

// POST create a new production line
router.post('/', ...getValidationForSchema('productionLine'), createProductionLine);

// PUT update a production line
router.put('/:id', ...getValidationForSchema('productionLine'), updateProductionLine);

// DELETE a production line
router.delete('/:id', deleteProductionLine);

export default router;
