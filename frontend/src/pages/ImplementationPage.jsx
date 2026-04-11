import React, { useEffect, useState } from 'react';
import { changeRequestService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const ImplementationPage = () => {
  const { user, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [selectedChange, setSelectedChange] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ implementation_date: '', implemented_by: '', trial_result: '', observation: '' });
  const [loadError, setLoadError] = useState('');

  const canImplement = hasPermission('changes.implement') && ['Admin', 'SuperAdmin'].includes(user?.role);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await changeRequestService.getChangeRequests({ status: 'Approved', page: 1, limit: 50 });
      const payload = response?.data?.data || {};
      setChanges(Array.isArray(payload.rows) ? payload.rows : []);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to fetch approved changes';
      setLoadError(message);
      setChanges([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openImplementationForm = (change) => {
    setSelectedChange(change);
    setForm({
      implementation_date: new Date().toISOString().slice(0, 10),
      implemented_by: user?.name || '',
      trial_result: '',
      observation: '',
    });
    setModalOpen(true);
  };

  const markImplemented = async () => {
    if (!canImplement) {
      showError('Only Admin or SuperAdmin can mark requests as Implemented');
      return;
    }

    if (!selectedChange) return;

    const observation = [
      `Implementation Date: ${form.implementation_date || '-'}`,
      `Implemented By: ${form.implemented_by || '-'}`,
      `Trial Result: ${form.trial_result || '-'}`,
      `Observation: ${form.observation || '-'}`,
    ].join(' | ');

    try {
      setSubmitting(true);
      await changeRequestService.updateChangeRequest(selectedChange.id, {
        status: 'Implemented',
        impact_analysis: observation,
      });
      showSuccess('Request marked as Implemented');
      setModalOpen(false);
      setSelectedChange(null);
      fetchApproved();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to mark implemented');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Implementation Page</h1>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          Implementation stage owner: <span className="font-semibold">Admin / SuperAdmin</span>. After implementation, request moves to Monitoring stage.
        </div>

        {!!loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button type="button" className="btn-secondary" onClick={fetchApproved}>
                Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : !canImplement ? (
          <div className="card text-center py-10 text-gray-500">Only Admin or SuperAdmin can perform implementation actions.</div>
        ) : changes.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">No approved requests pending implementation.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Request No</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Machine</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Requested By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr key={change.id}>
                    <td>{change.request_no || `CR-${String(change.id).padStart(4, '0')}`}</td>
                    <td>{formatDate(change.request_date || change.created_at)}</td>
                    <td>{change.department || '-'}</td>
                    <td>{change.machine || '-'}</td>
                    <td>{change.type || '-'}</td>
                    <td>{change.title || '-'}</td>
                    <td>{change.creator?.name || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => openImplementationForm(change)}
                      >
                        Implementation Form
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          title={selectedChange ? `Implementation - ${selectedChange.title}` : 'Implementation Form'}
          onClose={() => {
            if (submitting) return;
            setModalOpen(false);
            setSelectedChange(null);
          }}
        >
          {selectedChange && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                markImplemented();
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Implementation Date</label>
                <input
                  type="date"
                  className="input-field w-full dark:bg-gray-800 dark:text-gray-200"
                  value={form.implementation_date}
                  onChange={(e) => updateForm('implementation_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Implemented By</label>
                <input
                  type="text"
                  className="input-field w-full dark:bg-gray-800 dark:text-gray-200"
                  value={form.implemented_by}
                  onChange={(e) => updateForm('implemented_by', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Trial Result</label>
                <input
                  type="text"
                  className="input-field w-full dark:bg-gray-800 dark:text-gray-200"
                  value={form.trial_result}
                  onChange={(e) => updateForm('trial_result', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Observation</label>
                <textarea
                  className="input-field w-full dark:bg-gray-800 dark:text-gray-200"
                  rows={3}
                  value={form.observation}
                  onChange={(e) => updateForm('observation', e.target.value)}
                  placeholder="Enter implementation observation"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (submitting) return;
                    setModalOpen(false);
                    setSelectedChange(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Mark Implemented'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default ImplementationPage;
