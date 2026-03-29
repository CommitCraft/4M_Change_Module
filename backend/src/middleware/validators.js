// TypeActionTemplate validation
export const typeActionTemplateValidation = [
  body('type').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Type is required and must be 2-50 characters'),
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Action template name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// TypeRequirement validation
export const typeRequirementValidation = [
  body('type').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Type is required and must be 2-50 characters'),
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Requirement name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// TrainingProgram validation
export const trainingProgramValidation = [
  body('skill').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Skill is required and must be 2-120 characters'),
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Training program name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// MachineSkillRequirement validation
export const machineSkillRequirementValidation = [
  body('machine').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Machine is required and must be 2-120 characters'),
  body('skill').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Skill is required and must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// OperatorSkillMap validation
export const operatorSkillMapValidation = [
  body('operator').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Operator is required and must be 2-120 characters'),
  body('skill').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Skill is required and must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// Skill validation
export const skillValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Skill name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// Operator validation
export const operatorValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Operator name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// ChangeSubType validation
export const changeSubTypeValidation = [
  body('type').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Type is required and must be 2-50 characters'),
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Change subtype name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// Machine validation
export const machineValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Machine name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];
// ProductionLine validation
export const productionLineValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Production line name must be 2-120 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];


// Dynamic validator for use in routes
export const getValidationForSchema = (schema) => {
  switch (schema) {
    case 'productionLine':
      return [...productionLineValidation, validateRequest];
    case 'department':
      return [
        body('name').trim().notEmpty().isLength({ min: 2, max: 120 }).withMessage('Department name must be 2-120 characters'),
        body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
        validateRequest
      ];
    case 'machine':
      return [...machineValidation, validateRequest];
    case 'changeSubType':
      return [...changeSubTypeValidation, validateRequest];
    case 'operator':
      return [...operatorValidation, validateRequest];
    case 'skill':
      return [...skillValidation, validateRequest];
    case 'operatorSkillMap':
      return [...operatorSkillMapValidation, validateRequest];
    case 'machineSkillRequirement':
      return [...machineSkillRequirementValidation, validateRequest];
    case 'trainingProgram':
      return [...trainingProgramValidation, validateRequest];
    case 'typeRequirement':
      return [...typeRequirementValidation, validateRequest];
    case 'typeActionTemplate':
      return [...typeActionTemplateValidation, validateRequest];
    // Add more cases for other master types as needed
    default:
      return [validateRequest];
  }
};
import { body, param, validationResult, query } from 'express-validator';
import { sendError } from '../utils/response.js';
import { ALL_PERMISSIONS } from '../utils/permissions.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  next();
};

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').trim().notEmpty().withMessage('Role is required'),
];

export const createRoleValidation = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Role name must be 2-100 characters'),
  body('permissions').optional().isArray().withMessage('permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .custom((value) => ALL_PERMISSIONS.includes(value))
    .withMessage('Invalid permission value'),
];

export const updateRoleValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid role id'),
  body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Role name must be 2-100 characters'),
  body('permissions').optional().isArray().withMessage('permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .custom((value) => ALL_PERMISSIONS.includes(value))
    .withMessage('Invalid permission value'),
];


// For /users/:id (admin update)
export const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
];

// For /users/me (self update)
export const updateSelfValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const idParamValidation = [param('id').isInt({ min: 1 }).withMessage('Invalid id')];

export const createChangeValidation = [
  body('type').isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid type'),
  body('request_no').optional().trim().isLength({ min: 2, max: 50 }).withMessage('request_no must be 2-50 characters'),
  body('request_date').optional().isISO8601().withMessage('request_date must be a valid date'),
  body('production_line').optional().trim().isLength({ max: 120 }).withMessage('production_line must be at most 120 characters'),
  body('machine').optional().trim().isLength({ max: 120 }).withMessage('machine must be at most 120 characters'),
  body('sub_type').optional().trim().isLength({ max: 120 }).withMessage('sub_type must be at most 120 characters'),
  body('current_operator').optional().trim().isLength({ max: 120 }).withMessage('current_operator must be at most 120 characters'),
  body('proposed_operator').optional().trim().isLength({ max: 120 }).withMessage('proposed_operator must be at most 120 characters'),
  body('required_skills').optional().trim().isLength({ max: 10000 }).withMessage('required_skills too long'),
  body('proposed_operator_skill_status').optional().isIn(['Matched', 'Gap']).withMessage('Invalid proposed_operator_skill_status'),
  body('training_required').optional().isBoolean().withMessage('training_required must be boolean'),
  body('training_status').optional().isIn(['Not Required', 'Pending', 'Scheduled', 'Completed']).withMessage('Invalid training_status'),
  body('training_notes').optional().trim().isLength({ max: 5000 }).withMessage('training_notes too long'),
  body('compliance_requirements').optional().trim().isLength({ max: 10000 }).withMessage('compliance_requirements too long'),
  body('action_plan_required').optional().isBoolean().withMessage('action_plan_required must be boolean'),
  body('action_plan_notes').optional().trim().isLength({ max: 5000 }).withMessage('action_plan_notes too long'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('current_state').trim().notEmpty().withMessage('Current state is required'),
  body('proposed_change').trim().notEmpty().withMessage('Proposed change is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('old_value').optional().trim().isLength({ max: 10000 }).withMessage('old_value too long'),
  body('new_value').optional().trim().isLength({ max: 10000 }).withMessage('new_value too long'),
  body('impact_analysis').trim().notEmpty().withMessage('Impact analysis is required'),
  body('quality_impact').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid quality_impact'),
  body('cost_impact').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid cost_impact'),
  body('delivery_impact').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid delivery_impact'),
  body('safety_impact').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid safety_impact'),
  body('risk_level').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid risk level'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

export const updateChangeValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid request id'),
  body('status').optional().isIn(['Pending', 'Approved', 'Rejected', 'Implemented', 'Closed']).withMessage('Invalid status'),
  body('risk_level').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid risk level'),
  body('type').optional().isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid type'),
  body('current_operator').optional().trim().isLength({ max: 120 }).withMessage('current_operator must be at most 120 characters'),
  body('proposed_operator').optional().trim().isLength({ max: 120 }).withMessage('proposed_operator must be at most 120 characters'),
  body('required_skills').optional().trim().isLength({ max: 10000 }).withMessage('required_skills too long'),
  body('proposed_operator_skill_status').optional().isIn(['Matched', 'Gap']).withMessage('Invalid proposed_operator_skill_status'),
  body('training_required').optional().isBoolean().withMessage('training_required must be boolean'),
  body('training_status').optional().isIn(['Not Required', 'Pending', 'Scheduled', 'Completed']).withMessage('Invalid training_status'),
  body('training_notes').optional().trim().isLength({ max: 5000 }).withMessage('training_notes too long'),
  body('compliance_requirements').optional().trim().isLength({ max: 10000 }).withMessage('compliance_requirements too long'),
  body('action_plan_required').optional().isBoolean().withMessage('action_plan_required must be boolean'),
  body('action_plan_notes').optional().trim().isLength({ max: 5000 }).withMessage('action_plan_notes too long'),
  body('monitoring_period').optional().trim().isLength({ max: 120 }).withMessage('monitoring_period must be at most 120 characters'),
  body('quality_result').optional().trim().isLength({ max: 200 }).withMessage('quality_result must be at most 200 characters'),
  body('defect_rate').optional().trim().isLength({ max: 50 }).withMessage('defect_rate must be at most 50 characters'),
  body('monitoring_comments').optional().trim().isLength({ max: 5000 }).withMessage('monitoring_comments too long'),
];

export const queryValidation = [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('type').optional({ checkFalsy: true }).isIn(['Man', 'Machine', 'Method', 'Material']).withMessage('Invalid type'),
  query('status').optional({ checkFalsy: true }).isIn(['Pending', 'Approved', 'Rejected', 'Implemented', 'Closed']).withMessage('Invalid status'),
  query('department').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Department cannot be empty'),
  query('search').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Search cannot be empty'),
  query('sortBy').optional({ checkFalsy: true }).isIn(['id', 'title', 'type', 'department', 'status', 'risk_level', 'created_at', 'updated_at']).withMessage('Invalid sortBy'),
  query('sortOrder').optional({ checkFalsy: true }).isIn(['ASC', 'DESC']).withMessage('Invalid sortOrder'),
];

export const approveValidation = [
  body('request_id').isInt({ min: 1 }).withMessage('request_id is required'),
  body('status').isIn(['Approved', 'Rejected']).withMessage('status must be Approved or Rejected'),
  body('remarks').optional().isLength({ max: 2000 }).withMessage('Remarks too long'),
];
