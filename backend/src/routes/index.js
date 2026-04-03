import express from 'express';

import approvalRoutes from './approvalRoutes.js';
import authRoutes from './authRoutes.js';
import changeRequestRoutes from './changeRequestRoutes.js';
import changeSubTypeRoutes from './changeSubTypeRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import fileRoutes from './fileRoutes.js';
import guidedSetupRoutes from './guidedSetupRoutes.js';
import machineRoutes from './machineRoutes.js';
import machineSkillRequirementRoutes from './machineSkillRequirementRoutes.js';
import masterRoutes from './masterRoutes.js';
import monitoringPeriodRoutes from './monitoringPeriodRoutes.js';
import operatorRoutes from './operatorRoutes.js';
import operatorSkillMapRoutes from './operatorSkillMapRoutes.js';
import productionLineRoutes from './productionLineRoutes.js';


import roleRoutes from './roleRoutes.js';
import skillRoutes from './skillRoutes.js';

import trainingProgramRoutes from './trainingProgramRoutes.js';
import typeActionTemplateRoutes from './typeActionTemplateRoutes.js';
import typeRequirementRoutes from './typeRequirementRoutes.js';
import userRoutes from './userRoutes.js';

import riskLevelRoutes from './riskLevelRoutes.js';

const router = express.Router();

router.use('/approvals', approvalRoutes);
router.use('/auth', authRoutes);
router.use('/change-requests', changeRequestRoutes);
router.use('/change-subtypes', changeSubTypeRoutes);
router.use('/departments', departmentRoutes);
router.use('/files', fileRoutes);
router.use('/guided-setup', guidedSetupRoutes);
router.use('/machines', machineRoutes);
router.use('/machine-skill-requirements', machineSkillRequirementRoutes);
router.use('/masters', masterRoutes);
router.use('/monitoring-periods', monitoringPeriodRoutes);
router.use('/operators', operatorRoutes);
router.use('/operator-skill-maps', operatorSkillMapRoutes);
router.use('/production-lines', productionLineRoutes);
router.use('/roles', roleRoutes);
router.use('/skills', skillRoutes);
router.use('/training-programs', trainingProgramRoutes);
router.use('/risk-levels', riskLevelRoutes);
router.use('/type-action-templates', typeActionTemplateRoutes);
router.use('/type-requirements', typeRequirementRoutes);
router.use('/users', userRoutes);

export default router;
