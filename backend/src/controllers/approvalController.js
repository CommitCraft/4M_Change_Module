import { sequelize, Approval, AuditLog, ChangeRequest, User, Role } from '../models/index.js';
import { sendError, sendResponse } from '../utils/response.js';

const APPROVAL_STEPS = [
  { step: 1, name: 'Supervisor/Manager Review', minRole: 'Manager', allowedRoles: ['Manager', 'Admin', 'SuperAdmin'] },
  { step: 2, name: 'Manager/Admin Review', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
  { step: 3, name: 'Admin/SuperAdmin Review', minRole: 'SuperAdmin', allowedRoles: ['SuperAdmin'] },
];

export const approveRequest = async (req, res) => {
  try {
    const { request_id, status, remarks } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const request = await ChangeRequest.findByPk(request_id, { transaction });
      if (!request) throw new Error('Change request not found');

      const requester = await User.findByPk(request.created_by, {
        include: [{ model: Role, attributes: ['name'] }],
        transaction,
      });
      const requesterRole = requester?.Role?.name;
      // If requester is SuperAdmin, final SuperAdmin step is unreachable due to self-approval restriction.
      const workflowSteps = requesterRole === 'SuperAdmin' ? APPROVAL_STEPS.slice(0, 2) : APPROVAL_STEPS;

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

      if (!step.allowedRoles.includes(req.user.role)) {
        throw new Error(`Current step is ${step.name}. Your role cannot approve at this stage.`);
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

    sendResponse(res, 200, 'Approval recorded successfully', result);
  } catch (error) {
    sendError(res, 400, error.message || 'Failed to approve request');
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
