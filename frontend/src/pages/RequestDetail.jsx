import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { changeRequestService, fileService } from '../services/api';
import { formatDate, showError } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getAssignedRoleLabel, getWorkflowStatusLabel } from '../utils/approvalWorkflow';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [files, setFiles] = useState([]);

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

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!request) {
    return <div className="text-center py-10">Request not found</div>;
  }

  const approvedCount = request.approvals?.filter((a) => a.status === 'Approved').length || 0;
  const currentStage =
    request.status === 'Closed'
      ? 'closed'
      : request.status === 'Implemented'
      ? 'monitoring'
      : request.status === 'Approved'
      ? 'implementation'
      : request.status === 'Rejected'
      ? approvedCount >= 1
        ? 'approval'
        : 'review'
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 6 - Approval Timeline</h2>
            <p className="mb-3 text-sm text-blue-700 dark:text-blue-300">Assigned To Role: {getAssignedRoleLabel(request)}</p>
            <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Current Stage: {getWorkflowStatusLabel(request)}</p>
            <div className="space-y-2 text-sm">
              {timelineSteps.map((step, index) => {
                const isCompleted = completedStages[step.key];
                const isCurrent = currentStage === step.key;
                return (
                <div key={step.key} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </span>
                  <span className={`text-gray-700 dark:text-gray-300 ${isCurrent ? 'font-semibold' : ''}`}>
                    {step.label}
                    {isCurrent ? ' (Current)' : ''}
                  </span>
                </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Section 7 - Approval Activity</h2>
            {!request.approvals || request.approvals.length === 0 ? (
              <p className="text-sm text-gray-500">No approval actions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {request.approvals.map((approval, idx) => (
                  <div key={approval.id || idx} className="p-3 border rounded dark:border-gray-700">
                    <div className="flex justify-between items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {approval.approver?.name || 'Unknown Reviewer'}
                      </p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          approval.status === 'Approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                        }`}
                      >
                        {approval.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {approval.approved_at ? formatDate(approval.approved_at) : 'Time not available'}
                    </p>
                    {approval.remarks && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{approval.remarks}</p>}
                  </div>
                ))}
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
    </div>
  );
};

export default RequestDetail;
