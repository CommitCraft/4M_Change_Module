import React, { useEffect, useState } from 'react';
import { approvalService, changeRequestService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  getWorkflowSteps as getWorkflowStepsHelper,
  canUserApprove as canUserApproveHelper,
  ROLE_HIERARCHY,
} from '../utils/approvalWorkflow';

const ReviewPage = () => {
  const { user, hasPermission } = useAuth();
  const currentUserId = String(user?.id || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [form, setForm] = useState({});

  const canCurrentUserReview = (change) => {
    if (!hasPermission('approvals.approve')) return false;
    if (!change || change.status !== 'Pending') return false;
    return canUserApproveHelper(change, user, currentUserId);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await changeRequestService.getChangeRequests({ status: 'Pending', page: 1, limit: 50 });
      const allRows = response.data.data.rows || [];
      setChanges(allRows.filter((change) => canCurrentUserReview(change)));
    } catch (error) {
      showError('Failed to fetch pending review requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user?.id, user?.role]);

  const updateForm = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { reviewComment: '', suggestedChanges: '' }),
        [field]: value,
      },
    }));
  };

  const submitDecision = async (change, mode) => {
    if (!canCurrentUserReview(change)) {
      showError('You cannot review this request at the current step');
      return;
    }

    if (mode === 'sendBack' && !hasPermission('changes.update')) {
      showError('You do not have permission to send back requests');
      return;
    }

    const values = form[change.id] || { reviewComment: '', suggestedChanges: '' };
    const combinedRemarks = [
      `Review Comment: ${values.reviewComment || '-'}`,
      `Suggested Changes: ${values.suggestedChanges || '-'}`,
      mode === 'sendBack' ? 'Action: Sent Back For Correction' : `Action: ${mode}`,
    ].join(' | ');

    try {
      if (mode === 'approve') {
        await approvalService.createApproval(change.id, 'Approved', combinedRemarks);
        showSuccess('Request moved to next step (Pending Approval)');
      } else if (mode === 'reject') {
        await approvalService.createApproval(change.id, 'Rejected', combinedRemarks);
        showSuccess('Request rejected');
      } else {
        await changeRequestService.updateChangeRequest(change.id, { status: 'Pending' });
        showSuccess('Request sent back for correction');
      }
      fetchPending();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to process review action');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Review Page</h1>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : changes.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">No requests pending for review.</div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <div className="card" key={change.id}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{change.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{change.department} | {change.type} | {formatDate(change.created_at)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Review Comment</label>
                    <textarea
                      rows="3"
                      value={form[change.id]?.reviewComment || ''}
                      onChange={(e) => updateForm(change.id, 'reviewComment', e.target.value)}
                      className="input-field dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Suggested Changes</label>
                    <textarea
                      rows="3"
                      value={form[change.id]?.suggestedChanges || ''}
                      onChange={(e) => updateForm(change.id, 'suggestedChanges', e.target.value)}
                      className="input-field dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button type="button" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60" onClick={() => submitDecision(change, 'approve')} disabled={!canCurrentUserReview(change)}>
                    Approve
                  </button>
                  <button type="button" className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" onClick={() => submitDecision(change, 'reject')} disabled={!canCurrentUserReview(change)}>
                    Reject
                  </button>
                  <button type="button" className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60" onClick={() => submitDecision(change, 'sendBack')} disabled={!canCurrentUserReview(change) || !hasPermission('changes.update')}>
                    Send Back
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReviewPage;
