import React, { useEffect, useState } from 'react';
import { changeRequestService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const ImplementationPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [form, setForm] = useState({});

  const canImplement = ['Admin', 'SuperAdmin'].includes(user?.role);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      const response = await changeRequestService.getChangeRequests({ status: 'Approved', page: 1, limit: 50 });
      setChanges(response.data.data.rows || []);
    } catch (error) {
      showError('Failed to fetch approved changes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const updateForm = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { implementation_date: '', implemented_by: '', trial_result: '', observation: '' }),
        [field]: value,
      },
    }));
  };

  const markImplemented = async (change) => {
    if (!canImplement) {
      showError('Only Admin or SuperAdmin can mark requests as Implemented');
      return;
    }

    const values = form[change.id] || {};
    const observation = [
      `Implementation Date: ${values.implementation_date || '-'}`,
      `Implemented By: ${values.implemented_by || '-'}`,
      `Trial Result: ${values.trial_result || '-'}`,
      `Observation: ${values.observation || '-'}`,
    ].join(' | ');

    try {
      await changeRequestService.updateChangeRequest(change.id, {
        status: 'Implemented',
        impact_analysis: observation,
      });
      showSuccess('Request marked as Implemented');
      fetchApproved();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to mark implemented');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Implementation Page</h1>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : !canImplement ? (
          <div className="card text-center py-10 text-gray-500">Only Admin or SuperAdmin can perform implementation actions.</div>
        ) : changes.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">No approved requests pending implementation.</div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <div className="card" key={change.id}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{change.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{change.department} | {change.type} | {formatDate(change.created_at)}</p>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Implementation Date</label>
                    <input type="date" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.implementation_date || ''} onChange={(e) => updateForm(change.id, 'implementation_date', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Implemented By</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.implemented_by || ''} onChange={(e) => updateForm(change.id, 'implemented_by', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Trial Result</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.trial_result || ''} onChange={(e) => updateForm(change.id, 'trial_result', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Observation</label>
                    <input type="text" className="input-field dark:bg-gray-800 dark:text-gray-200" value={form[change.id]?.observation || ''} onChange={(e) => updateForm(change.id, 'observation', e.target.value)} />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button type="button" className="btn-primary" onClick={() => markImplemented(change)}>
                    Mark Implemented
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

export default ImplementationPage;
