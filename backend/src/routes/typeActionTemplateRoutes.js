import express from 'express';
import {
  getTypeActionTemplates,
  createTypeActionTemplate,
  updateTypeActionTemplate,
  deleteTypeActionTemplate
} from '../controllers/typeActionTemplateController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

router.use(authMiddleware);

// GET all type action templates
router.get('/', authorizePermissions('masters.type_action_template.read'), getTypeActionTemplates);

// POST create a new type action template
router.post('/', authorizePermissions('masters.type_action_template.create'), ...getValidationForSchema('typeActionTemplate'), createTypeActionTemplate);

// PUT update a type action template
router.put('/:id', authorizePermissions('masters.type_action_template.update'), ...getValidationForSchema('typeActionTemplate'), updateTypeActionTemplate);

// DELETE a type action template
router.delete('/:id', authorizePermissions('masters.type_action_template.delete'), deleteTypeActionTemplate);

export default router;
