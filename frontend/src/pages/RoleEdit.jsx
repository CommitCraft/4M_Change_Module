import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { roleService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import { ADMIN_MANDATORY_PERMISSIONS, ALL_PERMISSIONS, PERMISSION_GROUPS } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';

const RoleEdit = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isSuperAdminRole = currentRole?.name === 'SuperAdmin';
  const isAdminRole = currentRole?.name === 'Admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRolesRes, roleRes] = await Promise.all([roleService.getRoles(), roleService.getRoleById(id)]);

      const allRoles = allRolesRes.data.data || [];
      const role = roleRes.data.data;

      if (currentUser?.role !== 'SuperAdmin' && role.name === currentUser?.role) {
        showError('You cannot update your own role');
        navigate('/roles');
        return;
      }

      setRoles(allRoles);
      setCurrentRole(role);
      setRoleName(role.name);
      setSelectedPermissions(role.permissions || []);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to fetch role data');
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedName = roleName.trim();
    if (!normalizedName) {
      showError('Role name is required');
      return;
    }

    const duplicate = roles.some(
      (role) => role.id !== Number(id) && role.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicate) {
      showError('Role name already exists');
      return;
    }

    try {
      setSubmitting(true);
      await roleService.updateRole(id, { name: normalizedName, permissions: selectedPermissions });
      showSuccess('Role updated successfully');
      navigate(`/roles/${id}`);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (permission) => {
    if (isAdminRole && ADMIN_MANDATORY_PERMISSIONS.includes(permission)) {
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions([...ALL_PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    setSelectedPermissions(isAdminRole ? [...ADMIN_MANDATORY_PERMISSIONS] : []);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <section className="card max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Role</h1>
            <div className="flex gap-2">
              <Link to="/roles" className="btn-secondary">
                Roles
              </Link>
              <Link to={`/roles/${id}`} className="btn-secondary">
                View
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-600 dark:text-gray-300">Loading role...</div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
                placeholder="Role name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                maxLength={100}
                required
                disabled={isSuperAdminRole}
              />

              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Permissions</h2>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary disabled:opacity-60" onClick={selectAllPermissions} disabled={isSuperAdminRole}>
                      Select All
                    </button>
                    <button type="button" className="btn-secondary disabled:opacity-60" onClick={clearAllPermissions} disabled={isSuperAdminRole}>
                      Clear All
                    </button>
                  </div>
                </div>
                {isSuperAdminRole && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    SuperAdmin permissions are locked to full access.
                  </p>
                )}
                <div className="space-y-3">
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
                              disabled={isSuperAdminRole}
                            />
                            <span>{permission}</span>
                            {isAdminRole && ADMIN_MANDATORY_PERMISSIONS.includes(permission) && (
                              <span className="text-xs text-blue-600 dark:text-blue-300">(mandatory)</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default RoleEdit;
