import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { changeRequestService, fileService, approvalService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getAssignedRoleLabel, getWorkflowStatusLabel, getApprovalProgress } from '../utils/approvalWorkflow';

const timelineSteps = [
  { key: 'created', label: 'Request Created' },
  { key: 'review', label: 'Supervisor Review (Manager)' },
  { key: 'approval', label: 'Quality Approval (Admin/SuperAdmin)' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'closed', label: 'Closed' },
];

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [files, setFiles] = useState([]);
  const [changeApprovalModal, setChangeApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [changeData, setChangeData] = useState({ status: 'Approved', remarks: '' });
  const [changingApproval, setChangingApproval] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [detailRes, filesRes] = await Promise.all([
          changeRequestService.getChangeRequestById(id),
          fileService.getByRequestId(id),
        ]);
        setRequest(detailRes.data.data);
        setFiles(filesRes.data.data || []);
      } catch (error) {
        showError('Failed to fetch request details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const downloadAttachment = async (filename) => {
    try {
      const response = await fileService.downloadFile(filename);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showError('Failed to download file');
    }
  };

  const handleChangeApproval = (approval) => {
    setSelectedApproval(approval);
    setChangeData({ status: approval.status, remarks: approval.remarks || '' });
    setChangeApprovalModal(true);
  };

  const submitChangeApproval = async () => {
    if (!selectedApproval) return;

    try {
      setChangingApproval(true);
      await approvalService.changeApproval(request.id, selectedApproval.id, changeData.status, changeData.remarks);
      showSuccess('Approval updated successfully!');
      setChangeApprovalModal(false);
      setSelectedApproval(null);
      // Refresh the request detail
      const detailRes = await changeRequestService.getChangeRequestById(id);
      setRequest(detailRes.data.data);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to change approval');
    } finally {
      setChangingApproval(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!request) {
    return <div className="text-center py-10">Request not found</div>;
  }

  const approvalProgress = getApprovalProgress(request);
  const approvedCount = approvalProgress?.approvedCount || 0;
  const currentStage =
    request.current_stage_step === 1
      ? 'review'
      : request.current_stage_step === 2
      ? 'approval'
      : request.status === 'Closed'
      ? 'closed'
      : request.status === 'Implemented'
      ? 'monitoring'
      : request.status === 'Approved'
      ? 'implementation'
      : approvedCount === 0
      ? 'review'
      : 'approval';

  const completedStages = {
    created: true,
    review: approvedCount >= 1 || ['Approved', 'Implemented', 'Closed'].includes(request.status),
    approval: approvedCount >= 2 || ['Approved', 'Implemented', 'Closed'].includes(request.status),
    implementation: ['Implemented', 'Closed'].includes(request.status),
    monitoring: request.status === 'Closed',
    closed: request.status === 'Closed',
  };

  const displayStatus = getWorkflowStatusLabel(request);

  const statusBadgeClass =
    displayStatus === 'Approved'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
      : displayStatus === 'Rejected'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
      : displayStatus === 'Implemented'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
      : displayStatus === 'Closed'
      ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Change Request Detail</h1>
            <button type="button" className="btn-secondary" onClick={() => navigate('/changes')}>
              Back to List
            </button>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 1 - Basic Info</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <p><span className="font-semibold">Request No:</span> {request.request_no || `CR-${String(request.id).padStart(4, '0')}`}</p>
              <p><span className="font-semibold">Department:</span> {request.department || '-'}</p>
              <p><span className="font-semibold">Machine:</span> {request.machine || '-'}</p>
              <p><span className="font-semibold">4M Type:</span> {request.type}</p>
              <p><span className="font-semibold">Created By:</span> {request.creator?.name || '-'}</p>
              <p><span className="font-semibold">Date:</span> {formatDate(request.request_date || request.created_at)}</p>
              <p>
                <span className="font-semibold">Current Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass}`}>{displayStatus}</span>
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 2 - Change Description</h2>
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Title:</span> {request.title}</p>
              <p><span className="font-semibold">Description:</span> {request.description}</p>
              <p><span className="font-semibold">Reason:</span> {request.reason}</p>
              <p><span className="font-semibold">Risk Level:</span> {request.risk_level}</p>
              {request.type === 'Man' && (
                <>
                  <p><span className="font-semibold">Current Operator:</span> {request.current_operator || '-'}</p>
                  <p><span className="font-semibold">Proposed Operator:</span> {request.proposed_operator || '-'}</p>
                  <p><span className="font-semibold">Required Skills:</span> {request.required_skills || '-'}</p>
                  <p><span className="font-semibold">Skill Status:</span> {request.proposed_operator_skill_status || '-'}</p>
                  <p><span className="font-semibold">Training Required:</span> {request.training_required ? 'Yes' : 'No'}</p>
                  <p><span className="font-semibold">Training Status:</span> {request.training_status || '-'}</p>
                  <p><span className="font-semibold">Training Notes:</span> {request.training_notes || '-'}</p>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 3 - Old vs New</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 border rounded dark:border-gray-700"><span className="font-semibold">Old Value:</span> {request.old_value || request.current_state}</div>
              <div className="p-3 border rounded dark:border-gray-700"><span className="font-semibold">New Value:</span> {request.new_value || request.proposed_change}</div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 4 - Impact Analysis</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <p><span className="font-semibold">Quality Impact:</span> {request.quality_impact || '-'}</p>
              <p><span className="font-semibold">Cost Impact:</span> {request.cost_impact || '-'}</p>
              <p><span className="font-semibold">Delivery Impact:</span> {request.delivery_impact || '-'}</p>
              <p><span className="font-semibold">Safety Impact:</span> {request.safety_impact || '-'}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 5 - Attachments</h2>
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">No attachments available.</p>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 border rounded dark:border-gray-700">
                    <span className="text-sm">{file.original_name || file.filename}</span>
                    <button type="button" className="btn-secondary" onClick={() => downloadAttachment(file.filename)}>
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 6 - Approval Timeline (Sequential Steps)</h2>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">⚡ SEQUENTIAL APPROVAL PROCESS</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Each step must be completed in order. Step 2 cannot be approved until Step 1 is complete.</p>
            </div>

            {/* APPROVAL WORKFLOW SECTION */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">Approval Workflow</h3>
              <div className="space-y-3">
                {/* STEP 1: SUPERVISOR REVIEW */}
                <div className={`p-4 rounded border-2 ${
                  approvedCount >= 1 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : approvedCount === 0 && request.status === 'Pending'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/20'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      approvedCount >= 1 ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {approvedCount >= 1 ? '✓' : '1'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Step 1: Supervisor Review</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Requires: Manager Approval</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      approvedCount >= 1
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                        : approvedCount === 0 && request.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {approvedCount >= 1 ? 'APPROVED' : approvedCount === 0 && request.status === 'Pending' ? 'AWAITING' : 'LOCKED'}
                    </span>
                  </div>
                  {request.approvals && request.approvals.length > 0 && request.approvals[0]?.status === 'Approved' && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded text-xs space-y-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300">✓ Approved by: {request.approvals[0]?.approver?.name || 'Unknown'}</p>
                      <p className="text-gray-600 dark:text-gray-400">Date: {formatDate(request.approvals[0]?.approved_at)}</p>
                      {request.approvals[0]?.remarks && <p className="text-gray-600 dark:text-gray-400 italic mt-1">"{request.approvals[0]?.remarks}"</p>}
                    </div>
                  )}
                  {request.status === 'Rejected' && request.approvals && request.approvals[0]?.status === 'Rejected' && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs space-y-1 border border-red-200 dark:border-red-700">
                      <p className="font-semibold text-red-700 dark:text-red-300">✗ Rejected by: {request.approvals[0]?.approver?.name || 'Unknown'}</p>
                      <p className="text-red-600 dark:text-red-400">Date: {formatDate(request.approvals[0]?.approved_at)}</p>
                      {request.approvals[0]?.remarks && <p className="text-red-600 dark:text-red-400 italic mt-1">"{request.approvals[0]?.remarks}"</p>}
                    </div>
                  )}
                </div>

                {/* STEP 2: QUALITY APPROVAL - LOCKED UNTIL STEP 1 COMPLETE */}
                <div className={`p-4 rounded border-2 transition-all ${
                  approvedCount >= 2
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : approvedCount >= 1 && request.status === 'Pending'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      approvedCount >= 2 ? 'bg-green-600' : approvedCount >= 1 ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {approvedCount >= 2 ? '✓' : '2'}
                    </span>
                    <div className="flex-1">
                      <p className={`font-semibold ${approvedCount < 1 ? 'text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        Step 2: Quality Approval
                      </p>
                      <p className={`text-xs ${approvedCount < 1 ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        Requires: Admin or SuperAdmin Approval
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      approvedCount >= 2
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                        : approvedCount >= 1 && request.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {approvedCount >= 2 ? 'APPROVED' : approvedCount >= 1 ? 'AWAITING' : 'LOCKED'}
                    </span>
                  </div>
                  {approvedCount < 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                      🔒 This step is locked. Step 1 (Supervisor Review) must be approved first.
                    </p>
                  )}
                  {request.approvals && request.approvals.length > 1 && request.approvals[1]?.status === 'Approved' && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded text-xs space-y-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300">✓ Approved by: {request.approvals[1]?.approver?.name || 'Unknown'}</p>
                      <p className="text-gray-600 dark:text-gray-400">Date: {formatDate(request.approvals[1]?.approved_at)}</p>
                      {request.approvals[1]?.remarks && <p className="text-gray-600 dark:text-gray-400 italic mt-1">"{request.approvals[1]?.remarks}"</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OPERATIONAL PHASES SECTION */}
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">Operational Phases</h3>
              <div className="space-y-2">
                {timelineSteps.slice(3).map((step, index) => {
                  const isCompleted = completedStages[step.key];
                  const isCurrent = currentStage === step.key;
                  const stepStatus = step.key === 'created'
                    ? 'Completed'
                    : isCompleted
                    ? 'Completed'
                    : isCurrent
                    ? 'Current'
                    : 'Pending';
                  return (
                  <div key={step.key} className="flex items-center gap-3 px-3 py-2 rounded">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 4}
                    </span>
                    <span className={`flex-1 text-sm text-gray-700 dark:text-gray-300 ${isCurrent ? 'font-semibold' : ''}`}>
                      {step.label}
                      {isCurrent ? ' (Current)' : ''}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        stepStatus === 'Completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                          : stepStatus === 'Current'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {stepStatus}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* PROGRESS SUMMARY */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Approval Progress Summary</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{approvedCount}/{approvalProgress?.workflowSteps?.length || 0}</span> approval steps completed
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(approvedCount / (approvalProgress?.workflowSteps?.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 7 - Approval Activity</h2>
            {!request.approvals || request.approvals.length === 0 ? (
              <p className="text-sm text-gray-500">No approval actions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {request.approvals.map((approval, idx) => {
                  const isCurrentUserApproval = approval.approver_id === user?.id;
                  const canChangeApproval = isCurrentUserApproval && request.status === 'Pending';
                  
                  return (
                    <div key={approval.id || idx} className={`p-3 border rounded dark:border-gray-700 ${canChangeApproval ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex justify-between items-center gap-3 mb-1">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {approval.approver?.name || 'Unknown Reviewer'}
                            {isCurrentUserApproval && <span className="text-xs ml-2 text-blue-600 dark:text-blue-300">(You)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              approval.status === 'Approved'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                            }`}
                          >
                            {approval.status}
                          </span>
                          {canChangeApproval && (
                            <button
                              type="button"
                              onClick={() => handleChangeApproval(approval)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Change
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {approval.approved_at ? formatDate(approval.approved_at) : 'Time not available'}
                      </p>
                      {approval.remarks && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{approval.remarks}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 8 - Monitoring Snapshot</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <p><span className="font-semibold">Monitoring Period:</span> {request.monitoring_period || '-'}</p>
              <p><span className="font-semibold">Quality Result:</span> {request.quality_result || '-'}</p>
              <p><span className="font-semibold">Defect Rate:</span> {request.defect_rate || '-'}</p>
              <p><span className="font-semibold">Comments:</span> {request.monitoring_comments || '-'}</p>
            </div>
          </div>
        </div>
      </main>

      {/* CHANGE APPROVAL MODAL */}
      <Modal
        isOpen={changeApprovalModal}
        title="Change Approval Decision"
        onClose={() => setChangeApprovalModal(false)}
      >
        {selectedApproval && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">You can change your approval decision for this request.</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Note: Changes are only allowed if no subsequent steps have been approved.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Approval Status</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="Approved"
                    checked={changeData.status === 'Approved'}
                    onChange={(e) => setChangeData({ ...changeData, status: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">✓ Approve</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="Rejected"
                    checked={changeData.status === 'Rejected'}
                    onChange={(e) => setChangeData({ ...changeData, status: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">✗ Reject</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Remarks (Optional)</label>
              <textarea
                value={changeData.remarks}
                onChange={(e) => setChangeData({ ...changeData, remarks: e.target.value })}
                placeholder="Add any comments about your decision..."
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setChangeApprovalModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitChangeApproval}
                disabled={changingApproval}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingApproval ? 'Updating...' : 'Update Approval'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestDetail;
