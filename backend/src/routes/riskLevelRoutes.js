import express from 'express';
import {
  getAllRiskLevels,
  createRiskLevel,
  updateRiskLevel,
  deleteRiskLevel
} from '../controllers/riskLevelController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermissions('masters.risk_level.read'), getAllRiskLevels);
router.post('/', authorizePermissions('masters.risk_level.create'), createRiskLevel);
router.put('/:id', authorizePermissions('masters.risk_level.update'), updateRiskLevel);
router.delete('/:id', authorizePermissions('masters.risk_level.delete'), deleteRiskLevel);

export default router;
