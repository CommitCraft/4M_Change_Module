import express from 'express';
import {
  getTypeActionTemplates,
  createTypeActionTemplate,
  updateTypeActionTemplate,
  deleteTypeActionTemplate
} from '../controllers/typeActionTemplateController.js';
import { getValidationForSchema } from '../middleware/validators.js';

const router = express.Router();

// GET all type action templates
router.get('/', getTypeActionTemplates);

// POST create a new type action template
router.post('/', ...getValidationForSchema('typeActionTemplate'), createTypeActionTemplate);

// PUT update a type action template
router.put('/:id', ...getValidationForSchema('typeActionTemplate'), updateTypeActionTemplate);

// DELETE a type action template
router.delete('/:id', deleteTypeActionTemplate);

export default router;
