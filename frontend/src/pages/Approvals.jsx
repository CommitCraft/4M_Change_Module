import React, { useState, useEffect } from 'react';
import { approvalService, changeRequestService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/helpers';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const APPROVAL_STEPS = [
  { step: 1, name: 'Supervisor/Manager Review', minRole: 'Manager' },
  { step: 2, name: 'Manager/Admin Review', minRole: 'Admin' },
  { step: 3, name: 'Admin/SuperAdmin Review', minRole: 'SuperAdmin' },
];

const Approvals = () => {
  const { user, hasPermission } = useAuth();
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({ status: 'Approved', remarks: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPendingChanges();
  }, []);

  const getWorkflowSteps = (change) => {
    const requesterRole = change.creator?.Role?.name;
    return requesterRole === 'SuperAdmin' ? APPROVAL_STEPS.slice(0, 2) : APPROVAL_STEPS;
  };

  const fetchPendingChanges = async () => {
    try {
      setLoading(true);
      const response = await changeRequestService.getChangeRequests({ status: 'Pending' });
      const allChanges = response.data.data.rows || [];
      
      // Filter to show only changes this user can approve
      const approvableChanges = allChanges.filter((change) => {
        // User cannot approve their own request
        if (change.created_by === user?.id) return false;
        
        // Get current approval step
        const approvedCount = change.approvals?.filter(a => a.status === 'Approved').length || 0;
        const workflowSteps = getWorkflowSteps(change);
        const currentStep = workflowSteps[Math.min(approvedCount, workflowSteps.length - 1)];
        
        // Check if user can approve at this step (role hierarchy)
        const roleHierarchy = { 'Manager': 1, 'Admin': 2, 'SuperAdmin': 3 };
        const userLevel = roleHierarchy[user?.role] || 0;
        const requiredLevel = roleHierarchy[currentStep.minRole] || 1;
        
        return userLevel >= requiredLevel;
      });
      
      setChanges(approvableChanges);
    } catch (error) {
      showError('Failed to fetch pending changes');
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStep = (change) => {
    const approvedCount = change.approvals?.filter(a => a.status === 'Approved').length || 0;
    const workflowSteps = getWorkflowSteps(change);
    return workflowSteps[Math.min(approvedCount, workflowSteps.length - 1)];
  };

  const canUserApprove = (change) => {
    if (change.created_by === user?.id) return false;
    
    const currentStep = getApprovalStep(change);
    const roleHierarchy = { 'Manager': 1, 'Admin': 2, 'SuperAdmin': 3 };
    const userLevel = roleHierarchy[user?.role] || 0;
    const requiredLevel = roleHierarchy[currentStep.minRole] || 1;
    
    // Check if user already approved this request
    const userApproval = change.approvals?.find(a => a.approver_id === user?.id);
    
    return userLevel >= requiredLevel && !userApproval;
  };

  const handleApprove = (change) => {
    if (!canUserApprove(change)) {
      showError('You cannot approve this request at the current step');
      return;
    }
    setSelectedChange(change);
    setModalOpen(true);
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Pending Approvals</h1>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="space-y-4">
            {changes.length === 0 ? (
              <div className="card text-center py-10 text-gray-500">No pending approvals for your role</div>
            ) : (
              changes.map((change) => {
                const currentStep = getApprovalStep(change);
                const approvedCount = change.approvals?.filter(a => a.status === 'Approved').length || 0;
                const workflowSteps = getWorkflowSteps(change);
                
                return (
                  <div key={change.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{change.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {change.type} | {change.department}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{change.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Requested on: {formatDate(change.created_at)}
                        </p>
                        
                        {/* Approval Progress */}
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                            Approval Progress
                          </p>
                          <div className="space-y-1">
                            {workflowSteps.map((step, idx) => (
                              <div key={step.step} className="flex items-center gap-2 text-xs">
                                <span className={`
                                  w-5 h-5 rounded-full flex items-center justify-center font-bold
                                  ${idx < approvedCount ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}
                                `}>
                                  {idx < approvedCount ? '✓' : idx + 1}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {step.name}
                                  {idx === approvedCount && <span className="font-semibold"> (Current)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {hasPermission('approvals.approve') && (
                        <button
                          onClick={() => handleApprove(change)}
                          disabled={!canUserApprove(change)}
                          className={`ml-4 px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
                            canUserApprove(change)
                              ? 'btn-primary'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {canUserApprove(change) ? 'Review & Approve' : 'Not Your Step'}
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
