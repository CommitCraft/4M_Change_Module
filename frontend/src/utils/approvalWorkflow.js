/**
 * Centralized approval workflow configuration.
 * Synced with backend: backend/src/controllers/approvalController.js (lines 5-8)
 * Used by: Approvals, ReviewPage, ChangeList, Dashboard
 */

export const APPROVAL_STEPS = [
  { step: 1, name: 'Supervisor/Manager Review', minRole: 'Manager', allowedRoles: ['Manager', 'Admin', 'SuperAdmin'] },
  { step: 2, name: 'Manager/Admin Review', minRole: 'Admin', allowedRoles: ['Admin', 'SuperAdmin'] },
  { step: 3, name: 'Admin/SuperAdmin Review', minRole: 'SuperAdmin', allowedRoles: ['SuperAdmin'] },
];

export const ROLE_HIERARCHY = {
  Manager: 1,
  Admin: 2,
  SuperAdmin: 3,
};

/**
 * Get workflow steps for a change request, accounting for requester role.
 * If requester is SuperAdmin, skip the final SuperAdmin step (self-approval prevention).
 */
export const getWorkflowSteps = (change) => {
  const requesterRole = change?.creator?.Role?.name;
  return requesterRole === 'SuperAdmin' ? APPROVAL_STEPS.slice(0, 2) : APPROVAL_STEPS;
};

/**
 * Get the current approval step based on already-approved count.
 */
export const getApprovalStep = (change) => {
  if (!change) return null;
  const approvedCount = change.approvals?.filter(a => a.status === 'Approved').length || 0;
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
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[currentStep.minRole] || 1;
  
  const userApproval = change.approvals?.find((a) => String(a.approver_id || '') === String(currentUserId));
  
  return userLevel >= requiredLevel && !userApproval;
};

/**
 * Get approval progress info for UI rendering.
 */
export const getApprovalProgress = (change) => {
  if (!change) return null;
  const workflowSteps = getWorkflowSteps(change);
  const approvedCount = change.approvals?.filter((approval) => approval.status === 'Approved').length || 0;
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
