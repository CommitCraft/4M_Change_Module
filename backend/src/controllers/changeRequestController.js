import { Op } from 'sequelize';
import models from '../models/index.js';
const { ChangeRequest, Approval, AuditLog, Attachment, User, Role, MasterData } = models;
import { sendResponse, sendError } from '../utils/response.js';

const WORKFLOW_STEPS = [
  { step: 1, name: 'Supervisor Review', minRole: 'Manager', allowedRoles: ['Manager'] },
  { step: 2, name: 'Quality Approval', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
];

const getApprovalWorkflowMeta = (request) => {
  const approvals = Array.isArray(request?.approvals)
    ? request.approvals
    : Array.isArray(request?.Approvals)
    ? request.Approvals
    : [];
  const approvedCount = approvals.filter((approval) => approval.status === 'Approved').length;
  const currentStep = WORKFLOW_STEPS[Math.min(approvedCount, WORKFLOW_STEPS.length - 1)] || null;
  const isComplete = approvedCount >= WORKFLOW_STEPS.length;
  const requesterRole = request?.creator?.Role?.name || null;
  const assignedRoles = currentStep?.allowedRoles || [];

  let workflowStatusLabel = request?.status || 'Pending';
  if (request?.status === 'Rejected') {
    workflowStatusLabel = 'Rejected';
  } else if (request?.status === 'Implemented') {
    workflowStatusLabel = 'Implemented';
  } else if (request?.status === 'Closed') {
    workflowStatusLabel = 'Closed';
  } else if (isComplete || request?.status === 'Approved') {
    workflowStatusLabel = 'Approved';
  } else if (approvedCount === 0) {
    workflowStatusLabel = 'Awaiting Stage 1 Approval';
  } else {
    workflowStatusLabel = `Awaiting Stage ${Math.min(approvedCount + 1, WORKFLOW_STEPS.length)} Approval`;
  }

  return {
    current_stage: currentStep?.name || (isComplete ? 'Completed' : 'Pending'),
    current_stage_step: currentStep?.step || null,
    current_stage_role: assignedRoles.join(' / ') || currentStep?.minRole || null,
    approval_stage_count: approvedCount,
    approval_stage_total: WORKFLOW_STEPS.length,
    workflow_status_label: workflowStatusLabel,
    workflow_is_complete: isComplete,
    requester_role: requesterRole,
  };
};

const attachWorkflowMeta = (request) => {
  if (!request) return request;
  const plainRequest = typeof request.toJSON === 'function' ? request.toJSON() : { ...request };
  return {
    ...plainRequest,
    ...getApprovalWorkflowMeta(plainRequest),
  };
};

const resolveManSkillAssessment = async (payload, existingRequest = null) => {
  const type = payload.type || existingRequest?.type;
  if (type !== 'Man') return {};

  const machine = payload.machine || existingRequest?.machine;
  const proposedOperator = payload.proposed_operator || existingRequest?.proposed_operator;

  if (!machine || !proposedOperator) return {};

  const [machineSkillRows, operatorSkillRows] = await Promise.all([
    MasterData.findAll({
      where: { category: 'machine_skill_requirement', type: machine },
      attributes: ['name'],
    }),
    MasterData.findAll({
      where: { category: 'operator_skill_map', type: proposedOperator },
      attributes: ['name'],
    }),
  ]);

  const requiredSkills = machineSkillRows.map((r) => r.name);
  const operatorSkills = new Set(operatorSkillRows.map((r) => r.name));
  const missingSkills = requiredSkills.filter((skill) => !operatorSkills.has(skill));

  if (requiredSkills.length === 0) {
    return {
      required_skills: null,
      proposed_operator_skill_status: null,
      training_required: false,
      training_status: 'Not Required',
      training_notes: payload.training_notes || existingRequest?.training_notes || null,
    };
  }

  return {
    required_skills: requiredSkills.join(', '),
    proposed_operator_skill_status: missingSkills.length > 0 ? 'Gap' : 'Matched',
    training_required: missingSkills.length > 0,
    training_status: missingSkills.length > 0 ? 'Pending' : 'Not Required',
    training_notes:
      missingSkills.length > 0
        ? payload.training_notes || `Training required for missing skills: ${missingSkills.join(', ')}`
        : payload.training_notes || null,
  };
};

const resolveTypeGovernance = async (payload, existingRequest = null) => {
  const type = payload.type || existingRequest?.type;
  if (!type) return {};

  const [requirementRows, actionRows] = await Promise.all([
    MasterData.findAll({
      where: { category: 'type_requirement', type },
      attributes: ['name'],
    }),
    MasterData.findAll({
      where: { category: 'type_action_template', type },
      attributes: ['name'],
    }),
  ]);

  const requirements = requirementRows.map((r) => r.name);
  const actionTemplates = actionRows.map((r) => r.name);

  return {
    compliance_requirements: requirements.length > 0 ? requirements.join(', ') : payload.compliance_requirements || null,
    action_plan_required: actionTemplates.length > 0,
    action_plan_notes:
      actionTemplates.length > 0
        ? payload.action_plan_notes || `Recommended action plan: ${actionTemplates.join(', ')}`
        : payload.action_plan_notes || null,
  };
};

export const createChangeRequest = async (req, res) => {
  try {
    const {
      type,
      request_no,
      request_date,
      production_line,
      machine,
      sub_type,
      current_operator,
      proposed_operator,
      required_skills,
      proposed_operator_skill_status,
      training_required,
      training_status,
      training_notes,
      compliance_requirements,
      action_plan_required,
      action_plan_notes,
      title,
      description,
      current_state,
      proposed_change,
      reason,
      old_value,
      new_value,
      impact_analysis,
      quality_impact,
      cost_impact,
      delivery_impact,
      safety_impact,
      risk_level,
      department,
    } = req.body;

    const skillAssessment = await resolveManSkillAssessment({
      type,
      machine,
      proposed_operator,
      training_notes,
    });
    const governanceAssessment = await resolveTypeGovernance({
      type,
      compliance_requirements,
      action_plan_notes,
    });

    const request = await ChangeRequest.create({
      type,
      request_no,
      request_date,
      production_line,
      machine,
      sub_type,
      current_operator,
      proposed_operator,
      required_skills: skillAssessment.required_skills ?? required_skills,
      proposed_operator_skill_status: skillAssessment.proposed_operator_skill_status ?? proposed_operator_skill_status,
      training_required: skillAssessment.training_required ?? training_required,
      training_status: skillAssessment.training_status ?? training_status,
      training_notes: skillAssessment.training_notes ?? training_notes,
      compliance_requirements: governanceAssessment.compliance_requirements ?? compliance_requirements,
      action_plan_required: governanceAssessment.action_plan_required ?? action_plan_required,
      action_plan_notes: governanceAssessment.action_plan_notes ?? action_plan_notes,
      title,
      description,
      current_state,
      proposed_change,
      reason,
      old_value,
      new_value,
      impact_analysis,
      quality_impact,
      cost_impact,
      delivery_impact,
      safety_impact,
      risk_level,
      department,
      created_by: req.user.id,
    });

    await AuditLog.create({
      request_id: request.id,
      action: 'CREATED',
      user_id: req.user.id,
    });

    sendResponse(res, 201, 'Change request created successfully', attachWorkflowMeta(request));
  } catch (error) {
    sendError(res, 500, 'Error creating change request', error.message);
  }
};

export const getChangeRequests = async (req, res) => {
  try {
    const {
      type,
      status,
      department,
      risk_level,
      search,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (department) where.department = department;
    if (risk_level) where.risk_level = risk_level;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const canApprove = Array.isArray(req.user.permissions) && req.user.permissions.includes('approvals.approve');

    if (req.user.role !== 'SuperAdmin') {
      if (canApprove) {
        // Approver roles must not be blocked by department-based scoping.
        // They need to see requests from all departments that are in their workflow stage.
      } else {
        const visibilityConditions = [{ created_by: req.user.id }];

        if (req.user.department) {
          visibilityConditions.push({ department: req.user.department });
        }

        where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: visibilityConditions }] : [{ [Op.or]: visibilityConditions }];
      }
    }

    const { rows, count } = await ChangeRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'], include: [{ model: Role }] },
        { 
          model: Approval, 
          attributes: ['id', 'approver_id', 'status', 'remarks', 'approved_at'],
          include: [{ model: User, as: 'approver', attributes: ['id', 'name', 'email'], include: [{ model: Role }] }]
        }
      ],
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
      order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    });

    sendResponse(res, 200, 'Change requests fetched', {
      rows: rows.map((row) => attachWorkflowMeta(row)),
      total: count,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    sendError(res, 500, 'Error fetching change requests', error.message);
  }
};

export const getChangeRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ChangeRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          include: [{ model: Role }],
        },
        {
          model: Approval,
          attributes: ['id', 'approver_id', 'status', 'remarks', 'approved_at'],
          include: [{ model: User, as: 'approver', attributes: ['id', 'name', 'email'], include: [{ model: Role }] }],
        },
        { model: Attachment },
        { model: AuditLog, include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'email'], include: [{ model: Role }] }] },
      ],
    });

    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (req.user.role === 'User' && request.created_by !== req.user.id) {
      return sendError(res, 403, 'You are not authorized to view this request');
    }

    sendResponse(res, 200, 'Change request fetched', attachWorkflowMeta(request));
  } catch (error) {
    sendError(res, 500, 'Error fetching change request', error.message);
  }
};

export const updateChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const hasPermission = (permission) =>
      req.user.role === 'SuperAdmin' || (req.user.permissions || []).includes(permission);
    const isAdminRole = ['Admin', 'SuperAdmin'].includes(req.user.role);

    const request = await ChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (request.created_by !== req.user.id && !['Admin', 'Manager', 'SuperAdmin'].includes(req.user.role)) {
      return sendError(res, 403, 'Unauthorized');
    }

    const isImplementationTransition = updates.status === 'Implemented';
    const isCloseTransition = updates.status === 'Closed';
    const isMonitoringFieldUpdate =
      Object.prototype.hasOwnProperty.call(updates, 'monitoring_period') ||
      Object.prototype.hasOwnProperty.call(updates, 'quality_result') ||
      Object.prototype.hasOwnProperty.call(updates, 'defect_rate') ||
      Object.prototype.hasOwnProperty.call(updates, 'monitoring_comments');

    const isWorkflowControlledUpdate = isImplementationTransition || isCloseTransition || isMonitoringFieldUpdate;

    // Lock business field edits once approval has started, but allow controlled workflow updates.
    const approvalCount = await Approval.count({ where: { request_id: id } });
    const isLockedForEdit = request.status !== 'Rejected' && approvalCount > 0;
    if (isLockedForEdit && !isWorkflowControlledUpdate) {
      return sendError(res, 403, 'Cannot modify request until it is rejected');
    }

    if (updates.status === 'Implemented' && (!isAdminRole || !hasPermission('changes.implement'))) {
      return sendError(res, 403, 'You do not have permission to mark requests as Implemented');
    }

    if (updates.status === 'Closed' && (!isAdminRole || !hasPermission('changes.close'))) {
      return sendError(res, 403, 'You do not have permission to close requests');
    }

    if (isMonitoringFieldUpdate && (!isAdminRole || !hasPermission('changes.monitor'))) {
      return sendError(res, 403, 'You do not have permission to update monitoring details');
    }

    if (updates.status === 'Implemented' && request.status !== 'Approved') {
      return sendError(res, 400, 'Only approved requests can be marked as implemented');
    }

    if (updates.status === 'Closed' && request.status !== 'Implemented') {
      return sendError(res, 400, 'Only implemented requests can be closed');
    }

    const [recalculatedSkill, recalculatedGovernance] = await Promise.all([
      resolveManSkillAssessment(updates, request),
      resolveTypeGovernance(updates, request),
    ]);
    const finalUpdates = { ...updates, ...recalculatedSkill, ...recalculatedGovernance };

    await request.update(finalUpdates);

    const action = updates.status === 'Implemented' ? 'IMPLEMENTED' : updates.status === 'Closed' ? 'CLOSED' : 'UPDATED';

    await AuditLog.create({
      request_id: id,
      action,
      user_id: req.user.id,
    });

    sendResponse(res, 200, 'Change request updated', request);
  } catch (error) {
    sendError(res, 500, 'Error updating change request', error.message);
  }
};

export const deleteChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (!['Admin', 'SuperAdmin'].includes(req.user.role) && request.created_by !== req.user.id) {
      return sendError(res, 403, 'Unauthorized');
    }

    await request.destroy();

    sendResponse(res, 200, 'Change request deleted');
  } catch (error) {
    sendError(res, 500, 'Error deleting change request', error.message);
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const where = {};
    const canApprove = Array.isArray(req.user.permissions) && req.user.permissions.includes('approvals.approve');

    if (req.user.role !== 'SuperAdmin' && req.user.department && !canApprove) {
      where.department = req.user.department;
    }

    if (req.user.role === 'User') {
      where.created_by = req.user.id;
    }

    const requests = await ChangeRequest.findAll({
      where,
      attributes: ['id', 'type', 'status', 'created_at', 'title', 'department', 'machine'],
    });

    const stats = {
      total: requests.length,
      byType: { Man: 0, Machine: 0, Method: 0, Material: 0 },
      byStatus: { Pending: 0, Approved: 0, Rejected: 0, Implemented: 0, Closed: 0 },
      recent: requests
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 7)
        .map((r) => ({
          id: r.id,
          title: r.title,
          department: r.department,
          machine: r.machine,
          status: r.status,
          created_at: r.created_at,
        })),
    };

    for (const request of requests) {
      stats.byType[request.type] += 1;
      stats.byStatus[request.status] += 1;
    }

    sendResponse(res, 200, 'Dashboard stats fetched', stats);
  } catch (error) {
    sendError(res, 500, 'Error fetching stats', error.message);
  }
};
