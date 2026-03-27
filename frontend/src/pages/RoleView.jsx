import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { roleService } from '../services/api';
import { formatDate, showError, showSuccess } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { formatPermissionLabel } from '../utils/permissions';

const RoleView = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoleById(id);
      setRole(response.data.data);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to fetch role');
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [id]);

  const handleDelete = async () => {
    if (!role) return;

    if (role.name === 'SuperAdmin') {
      showError('SuperAdmin role cannot be deleted');
      return;
    }

    if (role.users_count > 0) {
      showError('Cannot delete role assigned to users');
      return;
    }

    try {
      await roleService.deleteRole(role.id);
      showSuccess('Role deleted successfully');
      navigate('/roles');
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6 space-y-6`}>
        <section className="card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Role Details</h1>
            <div className="flex gap-2">
              <Link to="/roles" className="btn-secondary">
                Back
              </Link>
              {hasPermission('roles.update') && (
                <Link to={`/roles/${id}/edit`} className="btn-secondary">
                  Edit
                </Link>
              )}
              {hasPermission('roles.delete') && (currentUser?.role === 'SuperAdmin' || role?.name !== currentUser?.role) && (
                <button className="btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-gray-600 dark:text-gray-300">Loading role details...</div>
          ) : (
            <div className="space-y-2 text-gray-700 dark:text-gray-200">
              <p>
                <span className="font-semibold">Role Name:</span> {role?.name}
              </p>
              <p>
                <span className="font-semibold">Assigned Users:</span> {role?.users_count}
              </p>
              <div>
                <p className="font-semibold">Permissions:</p>
                {role?.permissions?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        title={permission}
                      >
                        {formatPermissionLabel(permission)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">No permissions assigned.</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="card overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Assigned Users</h2>

          {loading ? null : role?.users_count === 0 ? (
            <div className="text-gray-600 dark:text-gray-300">No users are assigned to this role.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {role?.users?.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default RoleView;
