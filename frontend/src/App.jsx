import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangeList from './pages/ChangeList';
import CreateChange from './pages/CreateChange';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import Roles from './pages/Roles';
import RoleCreate from './pages/RoleCreate';
import RoleEdit from './pages/RoleEdit';
import RoleView from './pages/RoleView';
import PermissionMatrix from './pages/PermissionMatrix';
import MasterCategories from './pages/MasterCategories';
import RequestDetail from './pages/RequestDetail';
import ReviewPage from './pages/ReviewPage';
import ImplementationPage from './pages/ImplementationPage';
import MonitoringPage from './pages/MonitoringPage';
import ReportsPage from './pages/ReportsPage';
import MastersPage from './pages/MastersPage';
import GuidedSetupPage from './pages/GuidedSetupPage';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { isAuthenticated, loading } = useAuth();
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const accessDenied = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Access denied</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Your account does not have access to this page.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (location.pathname !== '/changes' && hasPermission('changes.read')) {
      return <Navigate to="/changes" replace />;
    }
    return accessDenied();
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (location.pathname !== '/changes' && hasPermission('changes.read')) {
      return <Navigate to="/changes" replace />;
    }
    return accessDenied();
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermission="dashboard.view">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <ChangeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes/:id"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <RequestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute requiredPermission="changes.create">
                <CreateChange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master-categories"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <MasterCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute requiredPermission="approvals.approve" allowedRoles={['Manager', 'Admin', 'SuperAdmin']}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute requiredPermission="approvals.approve" allowedRoles={['Manager', 'Admin', 'SuperAdmin']}>
                <ReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/implementation"
            element={
              <ProtectedRoute requiredPermission="changes.update" allowedRoles={['Admin', 'SuperAdmin']}>
                <ImplementationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute requiredPermission="changes.update" allowedRoles={['Admin', 'SuperAdmin']}>
                <MonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/masters"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <MastersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guided-setup"
            element={
              <ProtectedRoute requiredPermission="changes.read">
                <GuidedSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="users.read">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute requiredPermission="roles.read">
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/create"
            element={
              <ProtectedRoute requiredPermission="roles.create">
                <RoleCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:id"
            element={
              <ProtectedRoute requiredPermission="roles.read">
                <RoleView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:id/edit"
            element={
              <ProtectedRoute requiredPermission="roles.update">
                <RoleEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/permissions"
            element={
              <ProtectedRoute requiredPermission="roles.update">
                <PermissionMatrix />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
