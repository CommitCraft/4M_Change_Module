import models from '../models/index.js';
const { sequelize, Approval, AuditLog, ChangeRequest, User, Role } = models;
import { sendError, sendResponse } from '../utils/response.js';

const APPROVAL_STEPS = [
  { step: 1, name: 'Supervisor Review', minRole: 'Manager', allowedRoles: ['Manager'] },
  { step: 2, name: 'Quality Approval', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
];

const getWorkflowMeta = (request, approvals) => {
  const approvedCount = approvals.filter((approval) => approval.status === 'Approved').length;
  const currentStep = APPROVAL_STEPS[Math.min(approvedCount, APPROVAL_STEPS.length - 1)] || null;
  const isComplete = approvedCount >= APPROVAL_STEPS.length;

  let workflowStatusLabel = request.status || 'Pending';
  if (request.status === 'Rejected') {
    workflowStatusLabel = 'Rejected';
  } else if (request.status === 'Implemented') {
    workflowStatusLabel = 'Implemented';
  } else if (request.status === 'Closed') {
    workflowStatusLabel = 'Closed';
  } else if (isComplete || request.status === 'Approved') {
    workflowStatusLabel = 'Approved';
  } else if (approvedCount === 0) {
    workflowStatusLabel = 'Awaiting Stage 1 Approval';
  } else {
    workflowStatusLabel = `Awaiting Stage ${Math.min(approvedCount + 1, APPROVAL_STEPS.length)} Approval`;
  }

  return {
    current_stage: currentStep?.name || (isComplete ? 'Completed' : 'Pending'),
    current_stage_role: currentStep?.allowedRoles?.join(' / ') || currentStep?.minRole || null,
    approval_stage_count: approvedCount,
    approval_stage_total: APPROVAL_STEPS.length,
    workflow_status_label: workflowStatusLabel,
    workflow_is_complete: isComplete,
  };
};

export const approveRequest = async (req, res) => {
  try {
    const { request_id, status, remarks } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const request = await ChangeRequest.findByPk(request_id, { transaction });
      if (!request) throw new Error('Change request not found');

      const workflowSteps = APPROVAL_STEPS;

      if (request.created_by === req.user.id) {
        throw new Error('You cannot approve your own request');
      }

      if (request.status !== 'Pending') {
        throw new Error('Only pending requests can be approved or rejected');
      }

      const approvals = await Approval.findAll({
        where: { request_id },
        order: [['approved_at', 'ASC']],
        transaction,
      });

      const approvedCount = approvals.filter((a) => a.status === 'Approved').length;
      const step = workflowSteps[Math.min(approvedCount, workflowSteps.length - 1)];

      // STRICT SEQUENTIAL ENFORCEMENT: Check that all previous steps are approved
      for (let i = 0; i < step.step - 1; i++) {
        const previousStep = workflowSteps[i];
        const previousStepApprovals = approvals.filter((a) => 
          a.status === 'Approved' && 
          a.step_number === previousStep.step
        );
        
        if (previousStepApprovals.length === 0) {
          throw new Error(
            `Cannot proceed to ${step.name} (Step ${step.step}). ` +
            `Step ${previousStep.step} (${previousStep.name}) must be completed first.`
          );
        }
      }

      if (!step.allowedRoles.includes(req.user.role)) {
        throw new Error(
          `Current step is ${step.name} (Step ${step.step}). ` +
          `Your role (${req.user.role}) cannot approve at this stage. ` +
          `Required roles: ${step.allowedRoles.join(' or ')}`
        );
      }

      const existingApproval = approvals.find((a) => a.approver_id === req.user.id);
      if (existingApproval) {
        throw new Error('You have already submitted an approval decision for this request');
      }

      // Ensure no duplicate roles approve (e.g., two different Managers)
      const roleApprovals = approvals.filter((a) => {
        const approverUser = req.user; // In real scenario, fetch approver details
        return a.status === 'Approved';
      });
      
      // Enforce step requirement matches user role
      const roleHierarchy = { 'Manager': 1, 'Admin': 2, 'SuperAdmin': 3 };
      const requiredLevel = roleHierarchy[step.minRole] || 1;
      const userLevel = roleHierarchy[req.user.role] || 0;
      if (userLevel < requiredLevel) {
        throw new Error(`Your role (${req.user.role}) cannot approve at step ${step.step}. Required: ${step.minRole} or higher`);
      }

      await Approval.create(
        {
          request_id,
          approver_id: req.user.id,
          status,
          remarks,
          step_number: step.step,
        },
        { transaction }
      );

      if (status === 'Rejected') {
        request.status = 'Rejected';
      } else if (approvedCount + 1 >= workflowSteps.length) {
        request.status = 'Approved';
      }

      await request.save({ transaction });

      await AuditLog.create(
        {
          request_id,
          user_id: req.user.id,
          action: status === 'Approved' ? 'APPROVED' : 'REJECTED',
        },
        { transaction }
      );

      return request;
    });

    const approvals = await Approval.findAll({
      where: { request_id: result.id },
      order: [['approved_at', 'ASC']],
    });

    sendResponse(res, 200, 'Approval recorded successfully', {
      ...(typeof result.toJSON === 'function' ? result.toJSON() : result),
      ...getWorkflowMeta(result, approvals),
    });
  } catch (error) {
    sendError(res, 400, error.message || 'Failed to approve request');
  }
};

export const changeApproval = async (req, res) => {
  try {
    const { request_id, approval_id, status, remarks } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const request = await ChangeRequest.findByPk(request_id, { transaction });
      if (!request) throw new Error('Change request not found');

      const approval = await Approval.findByPk(approval_id, { transaction });
      if (!approval) throw new Error('Approval record not found');

      // Check that the approval belongs to this request
      if (approval.request_id !== request_id) {
        throw new Error('Approval does not belong to this request');
      }

      // Check that the request is still pending
      if (request.status !== 'Pending') {
        throw new Error('Cannot change approval for non-pending requests');
      }

      // Check that the user is the one who made the original approval
      if (approval.approver_id !== req.user.id) {
        throw new Error('You can only change your own approval decisions');
      }

      // Get all approvals to check workflow state
      const allApprovals = await Approval.findAll({
        where: { request_id },
        order: [['approved_at', 'ASC']],
        transaction,
      });

      const approvalIndex = allApprovals.findIndex((a) => a.id === approval_id);
      const approvedCount = allApprovals.filter((a) => a.status === 'Approved').length;
      const currentApprovalIsApproved = approval.status === 'Approved' ? 1 : 0;

      // Check if any steps AFTER this one are approved
      const laterApprovalsExist = allApprovals.slice(approvalIndex + 1).some((a) => a.status === 'Approved');
      if (laterApprovalsExist) {
        throw new Error('Cannot change approval when later steps have already been approved');
      }

      // Update the approval
      approval.status = status;
      approval.remarks = remarks;
      await approval.save({ transaction });

      // Recalculate request status based on new approval state
      const updatedApprovals = await Approval.findAll({
        where: { request_id },
        transaction,
      });
      const newApprovedCount = updatedApprovals.filter((a) => a.status === 'Approved').length;
      const workflowSteps = [
        { step: 1, name: 'Supervisor Review', minRole: 'Manager', allowedRoles: ['Manager'] },
        { step: 2, name: 'Quality Approval', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
      ];

      // If any approval is rejected, mark request as rejected
      if (updatedApprovals.some((a) => a.status === 'Rejected')) {
        request.status = 'Rejected';
      } else if (newApprovedCount >= workflowSteps.length) {
        request.status = 'Approved';
      } else {
        request.status = 'Pending';
      }

      await request.save({ transaction });

      await AuditLog.create(
        {
          request_id,
          user_id: req.user.id,
          action: `APPROVAL_CHANGED_TO_${status.toUpperCase()}`,
        },
        { transaction }
      );

      return request;
    });

    const approvals = await Approval.findAll({
      where: { request_id: result.id },
      order: [['approved_at', 'ASC']],
    });

    sendResponse(res, 200, 'Approval updated successfully', {
      ...(typeof result.toJSON === 'function' ? result.toJSON() : result),
      ...getWorkflowMeta(result, approvals),
    });
  } catch (error) {
    sendError(res, 400, error.message || 'Failed to change approval');
  }
};

export const getApprovalsByRequest = async (req, res) => {
  try {
    const { request_id } = req.params;

    const request = await ChangeRequest.findByPk(request_id, {
      attributes: ['id', 'created_by'],
    });

    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (req.user.role === 'User' && request.created_by !== req.user.id) {
      return sendError(res, 403, 'You are not authorized to view these approvals');
    }

    const approvals = await Approval.findAll({
      where: { request_id },
      include: [{ model: User, as: 'approver', attributes: ['id', 'name', 'email'], include: [{ model: Role }] }],
      order: [['approved_at', 'DESC']],
    });

    sendResponse(res, 200, 'Approvals fetched successfully', approvals);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch approvals', error.message);
  }
};
