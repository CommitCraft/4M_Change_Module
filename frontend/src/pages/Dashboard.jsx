import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeRequestService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { hasPermission, user } = useAuth();
  const currentUserId = String(user?.id || '');
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);
  const [pendingSplit, setPendingSplit] = useState({ pendingReview: 0, pendingApproval: 0 });
  const [selectedChange, setSelectedChange] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    department: '',
    risk_level: 'Low',
    status: 'Pending',
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const APPROVAL_STEPS = [
    { step: 1, minRole: 'Manager' },
    { step: 2, minRole: 'Admin' },
    { step: 3, minRole: 'SuperAdmin' },
  ];
  const roleHierarchy = { Manager: 1, Admin: 2, SuperAdmin: 3 };

  const getWorkflowSteps = (change) => {
    const requesterRole = change?.creator?.Role?.name;
    return requesterRole === 'SuperAdmin' ? APPROVAL_STEPS.slice(0, 2) : APPROVAL_STEPS;
  };

  const canCurrentUserApprove = (change) => {
    if (!hasPermission('approvals.approve')) return false;
    if (!change || change.status !== 'Pending') return false;
    if (String(change.created_by || '') === currentUserId) return false;

    const approvedCount = change.approvals?.filter((a) => a.status === 'Approved').length || 0;
    const workflowSteps = getWorkflowSteps(change);
    const currentStep = workflowSteps[Math.min(approvedCount, workflowSteps.length - 1)];
    const userLevel = roleHierarchy[user?.role] || 0;
    const requiredLevel = roleHierarchy[currentStep?.minRole] || 1;
    const userApproval = change.approvals?.find((a) => String(a.approver_id || '') === currentUserId);

    return userLevel >= requiredLevel && !userApproval;
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, recentRes, pendingRes] = await Promise.allSettled([
        changeRequestService.getDashboardStats(),
        changeRequestService.getChangeRequests({ page: 1, limit: 8, sortBy: 'created_at', sortOrder: 'DESC' }),
        changeRequestService.getChangeRequests({ status: 'Pending', page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      } else {
        setStats({
          total: 0,
          byType: { Man: 0, Machine: 0, Method: 0, Material: 0 },
          byStatus: { Pending: 0, Approved: 0, Rejected: 0, Implemented: 0, Closed: 0 },
        });
      }

      if (recentRes.status === 'fulfilled') {
        setRecentChanges(recentRes.value.data.data.rows || []);
      } else {
        setRecentChanges([]);
      }

      if (pendingRes.status === 'fulfilled') {
        const pendingRows = pendingRes.value.data.data.rows || [];
        const pendingReview = pendingRows.filter((item) => (item.approvals?.length || 0) === 0).length;
        const pendingApproval = pendingRows.filter((item) => (item.approvals?.length || 0) > 0).length;
        setPendingSplit({ pendingReview, pendingApproval });
      } else {
        setPendingSplit({ pendingReview: 0, pendingApproval: 0 });
      }

      if ([statsRes, recentRes, pendingRes].every((result) => result.status === 'rejected')) {
        showError('Failed to fetch dashboard data');
      }
    } catch (error) {
      showError('Failed to fetch dashboard data');
      setStats({
        total: 0,
        byType: { Man: 0, Machine: 0, Method: 0, Material: 0 },
        byStatus: { Pending: 0, Approved: 0, Rejected: 0, Implemented: 0, Closed: 0 },
      });
      setRecentChanges([]);
      setPendingSplit({ pendingReview: 0, pendingApproval: 0 });
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (change) => {
    setSelectedChange(change);
    setViewModalOpen(true);
  };

  const openEditModal = (change) => {
    setSelectedChange(change);
    setEditForm({
      title: change.title || '',
      department: change.department || '',
      risk_level: change.risk_level || 'Low',
      status: change.status || 'Pending',
    });
    setEditModalOpen(true);
  };

  const submitEdit = async () => {
    if (!selectedChange) return;

    try {
      setEditLoading(true);
      await changeRequestService.updateChangeRequest(selectedChange.id, editForm);
      showSuccess('Change request updated successfully');
      setEditModalOpen(false);
      fetchStats();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update change request');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
      case 'Implemented':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const requestRows = useMemo(
    () =>
      recentChanges.map((change) => ({
        id: change.id,
        requestNo: `CR-${String(change.id).padStart(4, '0')}`,
        date: formatDate(change.created_at),
        department: change.department || '-',
        machine: change.machine || change.machine_name || '-',
        type: change.type || '-',
        title: change.title || '-',
        status: change.status || '-',
      })),
    [recentChanges]
  );

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  const typeData = {
    labels: ['Man', 'Machine', 'Method', 'Material'],
    datasets: [
      {
        data: [
          stats?.byType?.Man || 0,
          stats?.byType?.Machine || 0,
          stats?.byType?.Method || 0,
          stats?.byType?.Material || 0,
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };

  const statusData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Implemented'],
    datasets: [
      {
        label: 'Status Count',
        data: [
          stats?.byStatus?.Pending || 0,
          stats?.byStatus?.Approved || 0,
          stats?.byStatus?.Rejected || 0,
          stats?.byStatus?.Implemented || 0,
        ],
        backgroundColor: '#36A2EB',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">4M Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Entry page for change request monitoring and actions.</p>
            {user?.role !== 'SuperAdmin' && user?.department && (
              <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                Department scope: {user.department}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {hasPermission('changes.create') && (
              <button type="button" className="btn-primary" onClick={() => navigate('/create')}>
                + New Change Request
              </button>
            )}
            {hasPermission('changes.read') && (
              <button type="button" className="btn-secondary" onClick={() => navigate('/changes')}>
                View All Requests
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold">Total Change Requests</h3>
            <p className="text-3xl font-bold mt-2">{stats?.total || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <h3 className="text-lg font-semibold">Pending Review</h3>
            <p className="text-3xl font-bold mt-2">{pendingSplit.pendingReview}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <h3 className="text-lg font-semibold">Pending Approval</h3>
            <p className="text-3xl font-bold mt-2">{pendingSplit.pendingApproval}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-lg font-semibold">Implemented Changes</h3>
            <p className="text-3xl font-bold mt-2">{stats?.byStatus?.Implemented || 0}</p>
          </div>
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <h3 className="text-lg font-semibold">Rejected Changes</h3>
            <p className="text-3xl font-bold mt-2">{stats?.byStatus?.Rejected || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">4M Changes Distribution</h3>
            <div className="max-w-md mx-auto">
              <Pie data={typeData} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Changes</h3>
          <div className="overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="dark:text-gray-200">Request No</th>
                  <th className="dark:text-gray-200">Date</th>
                  <th className="dark:text-gray-200">Department</th>
                  <th className="dark:text-gray-200">Machine</th>
                  <th className="dark:text-gray-200">4M Type</th>
                  <th className="dark:text-gray-200">Title</th>
                  <th className="dark:text-gray-200">Status</th>
                  <th className="dark:text-gray-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No recent changes found
                    </td>
                  </tr>
                ) : (
                  requestRows.map((item) => (
                    <tr key={item.id} className="dark:border-gray-700">
                      <td className="dark:text-gray-300">{item.requestNo}</td>
                      <td className="dark:text-gray-300">{item.date}</td>
                      <td className="dark:text-gray-300">{item.department}</td>
                      <td className="dark:text-gray-300">{item.machine}</td>
                      <td className="dark:text-gray-300">{item.type}</td>
                      <td className="dark:text-gray-300">{item.title}</td>
                      <td className="dark:text-gray-300">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openViewModal(recentChanges.find((c) => c.id === item.id))}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                          {hasPermission('changes.update') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(recentChanges.find((c) => c.id === item.id))}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Edit
                            </button>
                          )}
                          {canCurrentUserApprove(recentChanges.find((c) => c.id === item.id)) && (
                            <button
                              type="button"
                              onClick={() => navigate('/approvals')}
                              className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={viewModalOpen} title={selectedChange?.title || 'Request Details'} onClose={() => setViewModalOpen(false)}>
          {selectedChange && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Request No</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  CR-{String(selectedChange.id).padStart(4, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedChange.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">4M Type</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedChange.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-gray-800 dark:text-gray-200">{selectedChange.description}</p>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={editModalOpen} title="Edit Change Request" onClose={() => setEditModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="input-field dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="input-field dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk</label>
                <select
                  value={editForm.risk_level}
                  onChange={(e) => setEditForm({ ...editForm, risk_level: e.target.value })}
                  className="input-field dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="input-field dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Implemented">Implemented</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={submitEdit} disabled={editLoading} className="btn-primary flex-1 disabled:opacity-50">
                {editLoading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Dashboard;
