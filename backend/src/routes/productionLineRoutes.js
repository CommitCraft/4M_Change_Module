import express from 'express';
import {
  getProductionLines,
  createProductionLine,
  updateProductionLine,
  deleteProductionLine
} from '../controllers/productionLineController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();


import { authMiddleware, authorizePermissions } from '../middleware/auth.js';

router.use(authMiddleware);

// GET all production lines
router.get('/', getProductionLines);

// POST create a new production line
router.post('/', authorizePermissions('masters.productionline.create'), ...getValidationForSchema('productionLine'), createProductionLine);

// PUT update a production line
router.put('/:id', authorizePermissions('masters.productionline.update'), ...getValidationForSchema('productionLine'), updateProductionLine);

// DELETE a production line
router.delete('/:id', authorizePermissions('masters.productionline.delete'), deleteProductionLine);

export default router;
