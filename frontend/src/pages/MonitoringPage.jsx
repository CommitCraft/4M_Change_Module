import React, { useEffect, useState } from 'react';
import { changeRequestService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const MonitoringPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [form, setForm] = useState({});
  const [savingId, setSavingId] = useState(null);

  const canCloseOrExtend = ['Admin', 'SuperAdmin'].includes(user?.role);

  const fetchImplemented = async () => {
    try {
      setLoading(true);
      const response = await changeRequestService.getChangeRequests({ status: 'Implemented', page: 1, limit: 50 });
      const rows = response.data.data.rows || [];
      setChanges(rows);
      setForm((prev) => {
        const next = { ...prev };
        rows.forEach((change) => {
          next[change.id] = {
            monitoring_period: prev[change.id]?.monitoring_period || change.monitoring_period || '',
            quality_result: prev[change.id]?.quality_result || change.quality_result || '',
            defect_rate: prev[change.id]?.defect_rate || change.defect_rate || '',
            comments: prev[change.id]?.comments || change.monitoring_comments || '',
          };
        });
        return next;
      });
    } catch (error) {
      showError('Failed to fetch implemented changes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImplemented();
  }, []);

  const updateForm = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { monitoring_period: '', quality_result: '', defect_rate: '', comments: '' }),
        [field]: value,
      },
    }));
  };

  const closeChange = async (change) => {
    if (!canCloseOrExtend) {
      showError('Only Admin or SuperAdmin can close requests');
      return;
    }

    const values = form[change.id] || {};

    if (!values.monitoring_period || !values.quality_result) {
      showError('Monitoring period and quality result are required before closing');
      return;
    }

    try {
      setSavingId(change.id);
      await changeRequestService.updateChangeRequest(change.id, {
        status: 'Closed',
        monitoring_period: values.monitoring_period || '',
        quality_result: values.quality_result || '',
        defect_rate: values.defect_rate || '',
        monitoring_comments: values.comments || '',
      });
      showSuccess('Change closed successfully');
      fetchImplemented();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to close change');
    } finally {
      setSavingId(null);
    }
  };

  const extendMonitoring = async (change) => {
    if (!canCloseOrExtend) {
      showError('Only Admin or SuperAdmin can extend monitoring');
      return;
    }

    const values = form[change.id] || {};
    if (!values.monitoring_period && !values.comments) {
      showError('Please enter monitoring period or comments before extending');
      return;
    }

    try {
      setSavingId(change.id);
      await changeRequestService.updateChangeRequest(change.id, {
        monitoring_period: values.monitoring_period || '',
        quality_result: values.quality_result || '',
        defect_rate: values.defect_rate || '',
        monitoring_comments: values.comments || '',
      });
      showSuccess('Monitoring details saved and period extended');
      fetchImplemented();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to extend monitoring');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Monitoring Page</h1>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : !canCloseOrExtend ? (
          <div className="card text-center py-10 text-gray-500">Only Admin or SuperAdmin can perform monitoring actions.</div>
        ) : changes.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">No implemented changes for monitoring.</div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <div className="card" key={change.id}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{change.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{change.department} | {change.type} | {formatDate(change.created_at)}</p>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Monitoring Period</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.monitoring_period || ''} onChange={(e) => updateForm(change.id, 'monitoring_period', e.target.value)} placeholder="e.g. 30 days" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quality Result</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.quality_result || ''} onChange={(e) => updateForm(change.id, 'quality_result', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Defect Rate</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.defect_rate || ''} onChange={(e) => updateForm(change.id, 'defect_rate', e.target.value)} placeholder="e.g. 0.8%" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Comments</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.comments || ''} onChange={(e) => updateForm(change.id, 'comments', e.target.value)} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => closeChange(change)}
                    disabled={savingId === change.id}
                  >
                    {savingId === change.id ? 'Saving...' : 'Close Change'}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                    onClick={() => extendMonitoring(change)}
                    disabled={savingId === change.id}
                  >
                    {savingId === change.id ? 'Saving...' : 'Extend Monitoring'}
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

export default MonitoringPage;
