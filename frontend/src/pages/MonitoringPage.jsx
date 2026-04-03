import React, { useEffect, useState, useMemo, useRef } from 'react';
import { changeRequestService, monitoringPeriodService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Table from '../components/Table';
import * as XLSX from 'xlsx';

import { Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';


const MonitoringPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const searchRef = useRef();

  // Static options for filters (replace with API if needed)
  const departmentOptions = [
    '', 'Production', 'Quality', 'Maintenance', 'Logistics', 'HR', 'R&D', 'Other'
  ];
  const typeOptions = ['', 'Man', 'Machine', 'Method', 'Material'];
  const [form, setForm] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [selectedChangeId, setSelectedChangeId] = useState(null);
  const [monitoringDefaults, setMonitoringDefaults] = useState([]);

  // Memoized department-wise count for chart
  const byDepartment = useMemo(() => {
    const counts = {};
    changes.forEach((r) => {
      const key = r.department || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [changes]);

  const canCloseOrExtend = ['Admin', 'SuperAdmin'].includes(user?.role);

  const getDefaultMonitoringPeriod = (changeType) => {
    const normalizedType = String(changeType || '').toLowerCase();
    const activeDefaults = monitoringDefaults.filter((item) => item.status === 'Active');

    const exactMatch = activeDefaults.find((item) => String(item.type || '').toLowerCase() === normalizedType);
    if (exactMatch?.name) return exactMatch.name;

    const fallback = activeDefaults.find((item) => ['all', 'default', 'general'].includes(String(item.type || '').toLowerCase()));
    return fallback?.name || '';
  };

  const fetchMonitoringDefaults = async () => {
    try {
      const response = await monitoringPeriodService.getAll({ status: 'Active' });
      const rows = response?.data?.data || [];
      setMonitoringDefaults(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setMonitoringDefaults([]);
    }
  };

  const fetchImplemented = async (params = {}) => {
    try {
      setLoading(true);
      const response = await changeRequestService.getChangeRequests({
        status: 'Implemented',
        page,
        limit,
        search: search || undefined,
        department: department || undefined,
        type: type || undefined,
        sortBy,
        sortOrder,
        ...params,
      });
      const rows = response.data.data.rows || [];
      setChanges(rows);
      setTotal(response.data.data.total || 0);
      setForm((prev) => {
        const next = { ...prev };
        rows.forEach((change) => {
          const defaultPeriod = getDefaultMonitoringPeriod(change.type);
          next[change.id] = {
            monitoring_period: prev[change.id]?.monitoring_period || change.monitoring_period || defaultPeriod,
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
    fetchMonitoringDefaults();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      fetchImplemented();
    }, 400);
    return () => clearTimeout(searchRef.current);
    // eslint-disable-next-line
  }, [page, limit, search, department, type, sortBy, sortOrder, monitoringDefaults]);
    // Reset filters
    const resetFilters = () => {
      setSearch('');
      setDepartment('');
      setType('');
      setPage(1);
      setSortBy('created_at');
      setSortOrder('DESC');
    };
  // Export to Excel
  const exportExcel = () => {
    const data = changes.map((r) => ({
      Title: r.title,
      Department: r.department,
      Type: r.type,
      Date: formatDate(r.created_at),
      'Monitoring Period': r.monitoring_period,
      'Quality Result': r.quality_result,
      'Defect Rate': r.defect_rate,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoring');
    XLSX.writeFile(workbook, 'monitoring.xlsx');
  };

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
        ) : (
          <>
            {/* Search, filter, export controls */}
            <div className="control-bar flex flex-wrap md:flex-nowrap gap-2 mb-4 items-center p-3 rounded-lg border bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <input
                type="text"
                className="input-field w-48"
                placeholder="🔍 Search title..."
                value={search}
                onChange={e => { setPage(1); setSearch(e.target.value); }}
              />
              <select className="input-field w-40" value={department} onChange={e => { setPage(1); setDepartment(e.target.value); }}>
                {departmentOptions.map(dep => (
                  <option key={dep} value={dep}>{dep ? dep : 'All Departments'}</option>
                ))}
              </select>
              <select className="input-field w-40" value={type} onChange={e => { setPage(1); setType(e.target.value); }}>
                {typeOptions.map(t => (
                  <option key={t} value={t}>{t ? t : 'All Types'}</option>
                ))}
              </select>
              <div className="flex gap-2 ml-auto">
                <button className="btn-secondary flex items-center gap-1" onClick={exportExcel}>
                  <span role="img" aria-label="Export">📤</span> Export
                </button>
                <button className="btn-secondary flex items-center gap-1" onClick={resetFilters}>
                  <span role="img" aria-label="Reset">♻️</span> Reset
                </button>
              </div>
            </div>
            <Table
              columns={[
                { key: 'title', label: 'Title', sortable: true },
                { key: 'department', label: 'Department', sortable: true },
                { key: 'type', label: 'Type', sortable: true },
                { key: 'created_at', label: 'Date', render: row => formatDate(row.created_at), sortable: true },
                { key: 'monitoring_period', label: 'Monitoring Period' },
                { key: 'quality_result', label: 'Quality Result' },
                { key: 'defect_rate', label: 'Defect Rate' },
              ]}
              data={changes}
              onView={row => setSelectedChangeId(row.id)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(key) => {
                if (sortBy === key) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                else { setSortBy(key); setSortOrder('ASC'); }
              }}
              selectedId={selectedChangeId}
            />
            {/* Pagination controls */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mt-4 justify-between bg-white/70 dark:bg-gray-900/70 p-3 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2">
                <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  &#8592; Prev
                </button>
                <span className="text-sm font-medium">
                  Page <span className="font-bold">{page}</span> of <span className="font-bold">{Math.max(1, Math.ceil(total / limit))}</span>
                </span>
                <button className="btn-secondary" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)}>
                  Next &#8594;
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total: {total}</span>
                <select className="input-field w-24" value={limit} onChange={e => { setPage(1); setLimit(Number(e.target.value)); }}>
                  {[10, 20, 50, 100].map(l => <option key={l} value={l}>{l} / page</option>)}
                </select>
              </div>
            </div>



            {/* Card UI for selected row in a popup modal */}
            {canCloseOrExtend && selectedChangeId && (() => {
              const change = changes.find((c) => c.id === selectedChangeId);
              if (!change) return null;
              return (
                <Modal isOpen={!!selectedChangeId} title={change.title} onClose={() => setSelectedChangeId(null)}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{change.department} | {change.type} | {formatDate(change.created_at)}</p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                  <div className="flex flex-wrap gap-2">
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
                </Modal>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
};

export default MonitoringPage;
