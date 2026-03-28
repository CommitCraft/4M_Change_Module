import React, { useEffect, useMemo, useState } from 'react';
import { changeRequestService } from '../services/api';
import { dismissToast, showError, showLoading, showSuccess } from '../utils/helpers';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          changeRequestService.getDashboardStats(),
          changeRequestService.getChangeRequests({ page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
        ]);
        setStats(statsRes.data.data);
        setRows(listRes.data.data.rows || []);
      } catch (error) {
        showError('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const byDepartment = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      const key = r.department || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const byMachine = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      const key = r.machine || 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const monthlyTrend = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const highRiskChanges = rows.filter((r) => r.risk_level === 'High' || r.risk_level === 'Critical').length;

  const exportCSV = async () => {
    const toastId = showLoading('Preparing Excel export...');

    try {
      const XLSX = await import('xlsx');
      const data = rows.map((r) => ({
        'Request No': r.request_no || `CR-${String(r.id).padStart(4, '0')}`,
        Date: new Date(r.created_at).toISOString().slice(0, 10),
        Department: r.department || '',
        Machine: r.machine || '',
        Type: r.type || '',
        Title: r.title || '',
        Status: r.status || '',
        Risk: r.risk_level || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '4M Report');
      XLSX.writeFile(workbook, '4m-change-report.xlsx');
      dismissToast(toastId);
      showSuccess('Excel report exported');
    } catch (error) {
      dismissToast(toastId);
      showError('Failed to export Excel report');
    }
  };

  const exportPDF = async () => {
    const toastId = showLoading('Preparing PDF export...');

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF('landscape');
      doc.setFontSize(14);
      doc.text('4M Change Management Report', 14, 14);

      autoTable(doc, {
        startY: 20,
        head: [['Request No', 'Date', 'Department', 'Machine', 'Type', 'Title', 'Status', 'Risk']],
        body: rows.map((r) => [
          r.request_no || `CR-${String(r.id).padStart(4, '0')}`,
          new Date(r.created_at).toISOString().slice(0, 10),
          r.department || '',
          r.machine || '',
          r.type || '',
          r.title || '',
          r.status || '',
          r.risk_level || '',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save('4m-change-report.pdf');
      dismissToast(toastId);
      showSuccess('PDF report exported');
    } catch (error) {
      dismissToast(toastId);
      showError('Failed to export PDF report');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Reports Page</h1>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={exportCSV}>Export Excel</button>
            <button type="button" className="btn-primary" onClick={exportPDF}>Export PDF</button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="card"><p className="text-sm text-gray-500">Man Changes</p><p className="text-2xl font-bold">{stats?.byType?.Man || 0}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Machine Changes</p><p className="text-2xl font-bold">{stats?.byType?.Machine || 0}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Method Changes</p><p className="text-2xl font-bold">{stats?.byType?.Method || 0}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Material Changes</p><p className="text-2xl font-bold">{stats?.byType?.Material || 0}</p></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Department Wise Changes</h2>
            <Bar data={{ labels: Object.keys(byDepartment), datasets: [{ label: 'Changes', data: Object.values(byDepartment), backgroundColor: '#2563eb' }] }} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Machine Wise Changes</h2>
            <Pie data={{ labels: Object.keys(byMachine), datasets: [{ data: Object.values(byMachine), backgroundColor: ['#2563eb', '#059669', '#dc2626', '#ca8a04', '#7c3aed', '#0891b2'] }] }} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Monthly Trend</h2>
            <Bar data={{ labels: Object.keys(monthlyTrend), datasets: [{ label: 'Requests', data: Object.values(monthlyTrend), backgroundColor: '#0ea5e9' }] }} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">High Risk Changes</h2>
            <p className="text-4xl font-bold text-red-600">{highRiskChanges}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
