import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { roleService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, formatPermissionLabel } from '../utils/permissions';

const Roles = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRoleName, setCreateRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();
      setRoles(response.data.data || []);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions([...ALL_PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();

    const normalizedName = createRoleName.trim();
    if (!normalizedName) {
      showError('Role name is required');
      return;
    }

    const exists = roles.some((role) => role.name.toLowerCase() === normalizedName.toLowerCase());
    if (exists) {
      showError('Role name already exists');
      return;
    }

    try {
      setSubmitting(true);
      await roleService.createRole({
        name: normalizedName,
        permissions: selectedPermissions,
      });
      showSuccess('Role created successfully');
      setIsCreateOpen(false);
      setCreateRoleName('');
      setSelectedPermissions([]);
      fetchRoles();
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role) => {
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
      fetchRoles();
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Role Management</h1>
            <div className="flex gap-2">
              {hasPermission('roles.update') && (
                <Link to="/roles/permissions" className="btn-secondary">
                  Permission Matrix
                </Link>
              )}
              {hasPermission('roles.create') && (
                <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
                  Create Role
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-gray-600 dark:text-gray-300">Loading roles...</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Assigned Users</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.users_count}</td>
                    <td>
                      {role.permissions?.length ? (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {role.permissions.map((permission) => (
                            <span
                              key={`${role.id}-${permission}`}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              title={permission}
                            >
                              {formatPermissionLabel(permission)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No permissions</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link className="btn-secondary" to={`/roles/${role.id}`}>
                          View
                        </Link>
                        {hasPermission('roles.update') && (currentUser?.role === 'SuperAdmin' || role.name !== currentUser?.role) && (
                          <Link className="btn-secondary" to={`/roles/${role.id}/edit`}>
                            Edit
                          </Link>
                        )}
                        {hasPermission('roles.delete') && (currentUser?.role === 'SuperAdmin' || role.name !== currentUser?.role) && (
                          <button
                            className="btn-danger"
                            onClick={() => handleDelete(role)}
                            disabled={role.name === 'SuperAdmin' || role.users_count > 0}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <Modal
        isOpen={isCreateOpen && hasPermission('roles.create')}
        title="Create Role"
        onClose={() => {
          setIsCreateOpen(false);
          setCreateRoleName('');
          setSelectedPermissions([]);
        }}
      >
        <form className="space-y-4" onSubmit={handleCreateRole}>
          <input
            className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
            placeholder="Role name (e.g. QualityLead)"
            value={createRoleName}
            onChange={(e) => setCreateRoleName(e.target.value)}
            maxLength={100}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Permissions</h2>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={selectAllPermissions}>
                  Select All
                </button>
                <button type="button" className="btn-secondary" onClick={clearAllPermissions}>
                  Clear All
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="font-medium text-gray-800 dark:text-gray-100 mb-2">{group}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label key={permission} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                        />
                        <span>{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateRoleName('');
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Roles;
