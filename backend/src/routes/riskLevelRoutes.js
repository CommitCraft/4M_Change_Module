import express from 'express';
import {
  getAllRiskLevels,
  createRiskLevel,
  updateRiskLevel,
  deleteRiskLevel
} from '../controllers/riskLevelController.js';

const router = express.Router();

router.get('/', getAllRiskLevels);
router.post('/', createRiskLevel);
router.put('/:id', updateRiskLevel);
router.delete('/:id', deleteRiskLevel);

export default router;
