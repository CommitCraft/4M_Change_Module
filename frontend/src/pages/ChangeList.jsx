import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeRequestService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showError } from '../utils/helpers';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  getWorkflowSteps as getWorkflowStepsHelper,
  canUserApprove as canUserApproveHelper,
} from '../utils/approvalWorkflow';

const ChangeList = () => {
  const { hasPermission, user } = useAuth();
  const currentUserId = String(user?.id || '');
  const navigate = useNavigate();
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    department: '',
    machine: '',
    fromDate: '',
    toDate: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [loadError, setLoadError] = useState('');

  const canCurrentUserApprove = (change) => {
    if (!hasPermission('approvals.approve')) return false;
    if (!change || change.status !== 'Pending') return false;
    return canUserApproveHelper(change, user, currentUserId);
  };

  useEffect(() => {
    fetchChanges();
  }, [filters, page, sortBy, sortOrder]);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await changeRequestService.getChangeRequests({
        type: filters.type,
        status: filters.status,
        department: filters.department,
        search: filters.search,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      const payload = response?.data?.data || {};
      setChanges(Array.isArray(payload.rows) ? payload.rows : []);
      setTotal(Number(payload.total || 0));
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to fetch changes';
      setLoadError(message);
      setChanges([]);
      setTotal(0);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (change) => {
    navigate(`/changes/${change.id}`);
  };

  const handleQuickView = (change) => {
    setSelectedChange(change);
    setModalOpen(true);
  };

  const handleDelete = async (change) => {
    try {
      await changeRequestService.deleteChangeRequest(change.id);
      fetchChanges();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const handleEdit = (change) => {
    setSelectedChange(change);
    setModalOpen(true);
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'Low':
        return 'badge-success';
      case 'Medium':
        return 'badge-warning';
      case 'High':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Approved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      case 'Implemented':
        return 'badge-info';
      default:
        return '';
    }
  };

  const filteredChanges = changes.filter((change) => {
    const createdDate = new Date(change.created_at);
    const machineMatch = !filters.machine || (change.machine || '').toLowerCase().includes(filters.machine.toLowerCase());
    const fromMatch = !filters.fromDate || createdDate >= new Date(`${filters.fromDate}T00:00:00`);
    const toMatch = !filters.toDate || createdDate <= new Date(`${filters.toDate}T23:59:59`);
    return machineMatch && fromMatch && toMatch;
  });

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Change Requests</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, fromDate: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            />

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, toDate: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            />

            <select
              value={filters.type}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, type: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Types</option>
              <option value="Man">Man</option>
              <option value="Machine">Machine</option>
              <option value="Method">Method</option>
              <option value="Material">Material</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, status: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Implemented">Implemented</option>
              <option value="Closed">Closed</option>
            </select>

            <input
              type="text"
              placeholder="Filter by department"
              value={filters.department}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, department: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            />

            <input
              type="text"
              placeholder="Filter by machine"
              value={filters.machine}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, machine: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            />

            <input
              type="text"
              placeholder="Search title/description"
              value={filters.search}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, search: e.target.value });
              }}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="created_at">Sort by Created Date</option>
              <option value="title">Sort by Title</option>
              <option value="department">Sort by Department</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="card">
          {!!loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <div className="flex items-center justify-between gap-3">
                <span>{loadError}</span>
                <button type="button" className="btn-secondary" onClick={fetchChanges}>
                  Retry
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="dark:text-gray-200">Request No</th>
                    <th className="dark:text-gray-200">Date</th>
                    <th className="dark:text-gray-200">Dept</th>
                    <th className="dark:text-gray-200">Machine</th>
                    <th className="dark:text-gray-200">Type</th>
                    <th className="dark:text-gray-200">Title</th>
                    <th className="dark:text-gray-200">Status</th>
                    <th className="dark:text-gray-200">Requested By</th>
                    <th className="dark:text-gray-200">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChanges.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-gray-500 dark:text-gray-400">No requests found</td>
                    </tr>
                  ) : (
                    filteredChanges.map((change) => (
                      <tr key={change.id} className="dark:border-gray-700">
                        <td className="dark:text-gray-300">{change.request_no || `CR-${String(change.id).padStart(4, '0')}`}</td>
                        <td className="dark:text-gray-300">{formatDate(change.request_date || change.created_at)}</td>
                        <td className="dark:text-gray-300">{change.department || '-'}</td>
                        <td className="dark:text-gray-300">{change.machine || '-'}</td>
                        <td className="dark:text-gray-300">{change.type}</td>
                        <td className="dark:text-gray-300">{change.title}</td>
                        <td><span className={`badge ${getStatusBadgeColor(change.status)}`}>{change.status}</span></td>
                        <td className="dark:text-gray-300">{change.creator?.name || '-'}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleView(change)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
                            {hasPermission('changes.update') && (
                              <button type="button" onClick={() => handleEdit(change)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Edit</button>
                            )}
                            {canCurrentUserApprove(change) && (
                              <button type="button" onClick={() => navigate('/approvals')} className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700">Approve</button>
                            )}
                            {hasPermission('changes.delete') && (
                              <button type="button" onClick={() => handleDelete(change)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                            )}
                            <button type="button" onClick={() => handleQuickView(change)} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Quick View</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {showingFrom} to {showingTo} of {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <Modal
          isOpen={modalOpen}
          title={selectedChange?.title}
          onClose={() => setModalOpen(false)}
        >
          {selectedChange && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedChange.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span className={`badge ${getStatusBadgeColor(selectedChange.status)}`}>
                  {selectedChange.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
                <span className={`badge ${getRiskBadgeColor(selectedChange.risk_level)}`}>
                  {selectedChange.risk_level}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-gray-800 dark:text-gray-300">{selectedChange.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                <p className="text-gray-800 dark:text-gray-300">{selectedChange.department}</p>
              </div>

              {/* Approval History */}
              {selectedChange.approvals && selectedChange.approvals.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Approval History</p>
                  <div className="space-y-2">
                    {selectedChange.approvals.map((approval, idx) => (
                      <div key={approval.id || idx} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                          approval.status === 'Approved' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {approval.status === 'Approved' ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {approval.approver?.name || 'Unknown'} ({approval.approver?.Role?.name || approval.approver?.role?.name || 'Role'})
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {approval.status === 'Approved' ? 'Approved' : 'Rejected'}
                            {approval.remarks && ` - ${approval.remarks}`}
                          </p>
                          {approval.approved_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {formatDate(approval.approved_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default ChangeList;
