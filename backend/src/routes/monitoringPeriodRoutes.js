import express from 'express';
import {
  getMonitoringPeriods,
  createMonitoringPeriod,
  updateMonitoringPeriod,
  deleteMonitoringPeriod,
} from '../controllers/monitoringPeriodController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermissions('masters.type_requirement.read'), getMonitoringPeriods);
router.post('/', authorizePermissions('masters.type_requirement.create'), ...getValidationForSchema('typeRequirement'), createMonitoringPeriod);
router.put('/:id', authorizePermissions('masters.type_requirement.update'), ...getValidationForSchema('typeRequirement'), updateMonitoringPeriod);
router.delete('/:id', authorizePermissions('masters.type_requirement.delete'), deleteMonitoringPeriod);

export default router;