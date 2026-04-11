import React, { useState, useEffect } from 'react';
import { approvalService, changeRequestService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/helpers';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  getWorkflowSteps as getWorkflowStepsHelper,
  getApprovalStep as getApprovalStepHelper,
  canUserApprove as canUserApproveHelper,
  getApprovalProgress as getApprovalProgressHelper,
  getAssignedRoleLabel,
  getWorkflowStatusLabel,
  getApprovalEntries,
} from '../utils/approvalWorkflow';

const Approvals = () => {
  const { user, hasPermission } = useAuth();
  const currentUserId = String(user?.id || '');
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState(null);
  const [detailsChange, setDetailsChange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({ status: 'Approved', remarks: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPendingChanges();
  }, [user?.id, user?.role]);

  const getWorkflowSteps = (change) => getWorkflowStepsHelper(change);

  const fetchPendingChanges = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setChanges([]);
        return;
      }

      const response = await changeRequestService.getChangeRequests({ status: 'Pending' });
      const allChanges = response.data.data.rows || [];
      
      // Keep requests visible if user can approve now OR already reviewed them.
      const approvableChanges = allChanges.filter((change) => {
        if (canUserApproveHelper(change, user, currentUserId)) return true;
        return Boolean(getMyReview(change));
      });
      
      setChanges(approvableChanges);
    } catch (error) {
      showError('Failed to fetch pending changes');
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStep = (change) => getApprovalStepHelper(change);

  const canUserApprove = (change) => canUserApproveHelper(change, user, currentUserId);

  const getMyReview = (change) =>
    getApprovalEntries(change).find((a) => String(a.approver_id || '') === currentUserId) || null;

  const handleApprove = (change) => {
    if (!canUserApprove(change)) {
      showError('You cannot approve this request at the current step');
      return;
    }
    setSelectedChange(change);
    setModalOpen(true);
  };

  const openDetails = (change) => {
    setDetailsChange(change);
    setDetailsOpen(true);
  };

  const renderField = (label, value) => (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/70 dark:bg-gray-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-800 dark:text-gray-200 break-words">{value || '-'}</p>
    </div>
  );

  const renderYesNo = (label, value) => renderField(label, typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value);

  const getApprovalProgress = (change) => getApprovalProgressHelper(change);

  const submitApproval = async () => {
    if (!selectedChange) return;

    try {
      await approvalService.createApproval(selectedChange.id, approvalData.status, approvalData.remarks);
      showSuccess(`Change request ${approvalData.status.toLowerCase()} successfully!`);
      setModalOpen(false);
      setApprovalData({ status: 'Approved', remarks: '' });
      fetchPendingChanges();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit approval');
    }
  };

  const detailsProgress = detailsChange ? getApprovalProgress(detailsChange) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Pending Approvals</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review the full request details before approving or rejecting.
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {changes.length} request{changes.length === 1 ? '' : 's'} ready for your review
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="space-y-4">
            {changes.length === 0 ? (
              <div className="card text-center py-10 text-gray-500">No pending approvals for your role</div>
            ) : (
              changes.map((change) => {
                const currentStep = getApprovalStep(change);
                const progress = getApprovalProgress(change);
                const { approvedCount, workflowSteps } = progress;
                const myReview = getMyReview(change);
                const isReviewed = Boolean(myReview);
                
                return (
                  <div key={change.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{change.title}</h3>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                              CR-{String(change.id).padStart(4, '0')}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                              {getWorkflowStatusLabel(change)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {change.type} | {change.department || '-'} | {change.machine || change.machine_name || '-'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Requested by {change.creator?.name || 'Unknown'} on {formatDate(change.created_at)}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Assigned To Role: {getAssignedRoleLabel(change)}
                          </p>
                          {isReviewed && (
                            <p className={`text-sm mt-1 font-semibold ${myReview.status === 'Approved' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                              {myReview.status === 'Approved' ? 'Reviewed by you: Approved ✓' : 'Reviewed by you: Rejected ✗'}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {renderField('Description', change.description)}
                          {renderField('Risk Level', change.risk_level)}
                          {renderField('Current State', change.current_state || change.old_value)}
                          {renderField('Proposed Change', change.proposed_change || change.new_value)}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {renderField('Production Line', change.production_line)}
                          {renderField('Current Operator', change.current_operator)}
                          {renderField('Proposed Operator', change.proposed_operator)}
                          {renderField('Reason', change.reason)}
                        </div>

                        {change.type === 'Man' && (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {renderField('Required Skills', change.required_skills)}
                            {renderField('Skill Status', change.proposed_operator_skill_status)}
                            {renderYesNo('Training Required', change.training_required)}
                            {renderField('Training Status', change.training_status)}
                            {renderField('Training Notes', change.training_notes)}
                          </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {renderField('Compliance Requirements', change.compliance_requirements)}
                          {renderYesNo('Action Plan Required', change.action_plan_required)}
                          {renderField('Action Plan Notes', change.action_plan_notes)}
                          {renderField('Request Date', formatDate(change.request_date || change.created_at))}
                        </div>
                        
                        {/* Approval Progress */}
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                              Approval Progress
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {progress.approvedCount}/{workflowSteps.length} steps completed
                            </p>
                          </div>
                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <div className="mt-3 space-y-2">
                            {workflowSteps.map((step, idx) => {
                              const isCompleted = idx < approvedCount;
                              const isCurrent = idx === approvedCount && !progress.isComplete;

                              return (
                                <div key={step.step} className="flex items-center gap-3 text-xs">
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-full font-bold ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                                    {isCompleted ? '✓' : idx + 1}
                                  </span>
                                  <span className={`text-gray-700 dark:text-gray-300 ${isCurrent ? 'font-semibold' : ''}`}>
                                    {step.name}
                                    {isCurrent ? ' (Current)' : ''}
                                    {progress.isComplete && idx === workflowSteps.length - 1 ? ' (Completed)' : ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(change)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            View Full Details
                          </button>
                        </div>
                      </div>
                      {hasPermission('approvals.approve') && (
                        <button
                          onClick={() => handleApprove(change)}
                          disabled={!canUserApprove(change) || isReviewed}
                          className={`ml-4 px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
                            isReviewed
                              ? myReview.status === 'Approved'
                                ? 'bg-green-600 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white cursor-not-allowed'
                              : canUserApprove(change)
                              ? 'btn-primary'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isReviewed
                            ? myReview.status === 'Approved'
                              ? 'Reviewed ✓'
                              : 'Reviewed ✗'
                            : canUserApprove(change)
                            ? 'Review & Approve'
                            : 'Not Your Step'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <Modal
          isOpen={detailsOpen}
          title={detailsChange?.title || 'Request Details'}
          sizeClassName="max-w-6xl"
          onClose={() => setDetailsOpen(false)}
        >
          {detailsChange && detailsProgress && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">Request Overview</p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{detailsChange.title}</h3>
                    <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-100/80">
                      {detailsChange.type} | {detailsChange.department || '-'} | {detailsChange.machine || detailsChange.machine_name || '-'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:bg-gray-900 dark:text-blue-200">
                      CR-{String(detailsChange.id).padStart(4, '0')}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-200">
                      {getWorkflowStatusLabel(detailsChange)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Request Details</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {renderField('Created By', detailsChange.creator?.name)}
                    {renderField('Created At', formatDate(detailsChange.created_at))}
                    {renderField('Request Date', formatDate(detailsChange.request_date || detailsChange.created_at))}
                    {renderField('Risk Level', detailsChange.risk_level)}
                    {renderField('Department', detailsChange.department)}
                    {renderField('Production Line', detailsChange.production_line)}
                    {renderField('Machine', detailsChange.machine || detailsChange.machine_name)}
                    {renderField('Type', detailsChange.type)}
                    {renderField('Current State', detailsChange.current_state || detailsChange.old_value)}
                    {renderField('Proposed Change', detailsChange.proposed_change || detailsChange.new_value)}
                    {renderField('Reason', detailsChange.reason)}
                    {renderField('Description', detailsChange.description)}
                  </div>

                  {detailsChange.type === 'Man' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Man Details</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {renderField('Current Operator', detailsChange.current_operator)}
                        {renderField('Proposed Operator', detailsChange.proposed_operator)}
                        {renderField('Required Skills', detailsChange.required_skills)}
                        {renderField('Skill Status', detailsChange.proposed_operator_skill_status)}
                        {renderYesNo('Training Required', detailsChange.training_required)}
                        {renderField('Training Status', detailsChange.training_status)}
                        {renderField('Training Notes', detailsChange.training_notes)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Review & Impact</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {renderField('Quality Impact', detailsChange.quality_impact)}
                    {renderField('Cost Impact', detailsChange.cost_impact)}
                    {renderField('Delivery Impact', detailsChange.delivery_impact)}
                    {renderField('Safety Impact', detailsChange.safety_impact)}
                    {renderField('Compliance Requirements', detailsChange.compliance_requirements)}
                    {renderField('Action Plan Notes', detailsChange.action_plan_notes)}
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Approval Progress</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {detailsProgress.approvedCount} approval{detailsProgress.approvedCount === 1 ? '' : 's'} completed
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          Current Stage: {getWorkflowStatusLabel(detailsChange)}
                        </p>
                        <p>Next Step: {detailsProgress.currentStep?.name || (detailsProgress.isComplete ? 'Completed' : 'Pending')}</p>
                        <p>Visible steps: {detailsProgress.workflowSteps.length}</p>
                        <p>Assigned To Role: {getAssignedRoleLabel(detailsChange)}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${detailsProgress.percent}%` }}
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      {detailsProgress.workflowSteps.map((step, index) => {
                        const isCompleted = index < detailsProgress.approvedCount;
                        const isCurrent = index === detailsProgress.approvedCount && !detailsProgress.isComplete;
                        return (
                          <div key={step.step} className="flex items-center gap-3 text-sm">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                isCompleted
                                  ? 'bg-green-600 text-white'
                                  : isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {isCompleted ? '✓' : index + 1}
                            </span>
                            <span className={`text-gray-700 dark:text-gray-300 ${isCurrent ? 'font-semibold' : ''}`}>
                              {step.name}
                              {isCurrent ? ' (Current)' : ''}
                              {detailsProgress.isComplete && index === detailsProgress.workflowSteps.length - 1 ? ' (Completed)' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Approval History</h4>
                    {getApprovalEntries(detailsChange).length > 0 ? (
                      <div className="space-y-2">
                        {getApprovalEntries(detailsChange).map((approval) => (
                          <div key={approval.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                {approval.approver?.name || 'Unknown Reviewer'}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${approval.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'}`}>
                                {approval.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {approval.approver?.Role?.name || approval.approver?.role?.name || 'Role not available'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {approval.approved_at ? formatDate(approval.approved_at) : 'Time not available'}
                            </p>
                            {approval.remarks && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{approval.remarks}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No approval actions recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setDetailsOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={modalOpen}
          title="Approval Decision"
          onClose={() => setModalOpen(false)}
        >
          {selectedChange && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Request:</strong> {selectedChange.title}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Decision</p>
                <select
                  value={approvalData.status}
                  onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
                  className="input-field dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </label>
                <textarea
                  value={approvalData.remarks}
                  onChange={(e) => setApprovalData({ ...approvalData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  rows="4"
                  placeholder="Enter your remarks..."
                ></textarea>
              </div>

              <div className="flex gap-2 pt-4">
                {hasPermission('approvals.approve') && (
                  <button
                    onClick={submitApproval}
                    className="flex-1 btn-primary"
                  >
                    Submit Decision
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default Approvals;
