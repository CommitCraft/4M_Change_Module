/**
 * Centralized approval workflow configuration.
 * Synced with backend: backend/src/controllers/approvalController.js (lines 5-8)
 * Used by: Approvals, ReviewPage, ChangeList, Dashboard
 */

export const APPROVAL_STEPS = [
  { step: 1, name: 'Supervisor Review', minRole: 'Manager', allowedRoles: ['Manager'] },
  { step: 2, name: 'Quality Approval', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
];

export const ROLE_HIERARCHY = {
  Manager: 1,
  Admin: 2,
  SuperAdmin: 3,
};

export const getApprovalEntries = (change) => {
  if (!change) return [];
  if (Array.isArray(change.approvals)) return change.approvals;
  if (Array.isArray(change.Approvals)) return change.Approvals;
  return [];
};

const countApprovedSteps = (change) => {
  const stageCount = Number.parseInt(change?.approval_stage_count, 10);
  if (Number.isFinite(stageCount) && stageCount >= 0) {
    return stageCount;
  }

  const approvals = getApprovalEntries(change);
  return approvals.filter((approval) => String(approval?.status || '').toLowerCase() === 'approved').length;
};

/**
 * Get workflow steps for a change request.
 */
export const getWorkflowSteps = (change) => {
  return APPROVAL_STEPS;
};

/**
 * Get the current approval step based on already-approved count.
 */
export const getApprovalStep = (change) => {
  if (!change) return null;
  const approvedCount = countApprovedSteps(change);
  const workflowSteps = getWorkflowSteps(change);
  return workflowSteps[Math.min(approvedCount, workflowSteps.length - 1)] || null;
};

/**
 * Check if a user can approve a change at the current step.
 */
export const canUserApprove = (change, user, currentUserId) => {
  if (!change || !user) return false;
  if (String(change.created_by || '') === String(currentUserId)) return false;
  
  const currentStep = getApprovalStep(change);
  if (!currentStep) return false;

  if (Array.isArray(currentStep.allowedRoles) && !currentStep.allowedRoles.includes(user.role)) {
    return false;
  }
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[currentStep.minRole] || 1;

  const approvals = getApprovalEntries(change);
  const userApproval = approvals.find((a) => String(a.approver_id || '') === String(currentUserId));
  
  return userLevel >= requiredLevel && !userApproval;
};

/**
 * Get approval progress info for UI rendering.
 */
export const getApprovalProgress = (change) => {
  if (!change) return null;
  const workflowSteps = getWorkflowSteps(change);
  const approvedCount = countApprovedSteps(change);
  const currentIndex = workflowSteps.length === 0 ? -1 : Math.min(approvedCount, workflowSteps.length - 1);
  const currentStep = currentIndex >= 0 ? workflowSteps[currentIndex] : null;

  return {
    workflowSteps,
    approvedCount,
    currentStep,
    isComplete: workflowSteps.length > 0 && approvedCount >= workflowSteps.length,
    percent: workflowSteps.length > 0 ? Math.min((approvedCount / workflowSteps.length) * 100, 100) : 0,
  };
};

/**
 * Get assignee role label for the current approval step.
 */
export const getAssignedRoleLabel = (change) => {
  const progress = getApprovalProgress(change);
  if (!progress || progress.isComplete || !progress.currentStep) return 'Completed';
  const roles = progress.currentStep.allowedRoles || [];
  return roles.length > 0 ? roles.join(' / ') : progress.currentStep.minRole;
};

/**
 * Get a human-friendly status label for display in lists and detail views.
 */
export const getWorkflowStatusLabel = (change) => {
  if (!change) return '-';
  const progress = getApprovalProgress(change);
  if (!progress) return change.status || '-';
  if (change.status === 'Rejected') return 'Rejected';
  if (change.status === 'Implemented') return 'Implemented';
  if (change.status === 'Closed') return 'Closed';
  if (progress.isComplete) return 'Approved';

  if (progress.approvedCount === 0) {
    return 'Awaiting Stage 1 Approval';
  }

  return `Awaiting Stage ${Math.min(progress.approvedCount + 1, progress.workflowSteps.length)} Approval`;
};
