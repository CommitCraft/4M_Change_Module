import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { roleService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from '../utils/permissions';

const RoleCreate = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roleName, setRoleName] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedName = roleName.trim();
    if (!normalizedName) return;

    const exists = roles.some((role) => role.name.toLowerCase() === normalizedName.toLowerCase());
    if (exists) {
      showError('Role name already exists');
      return;
    }

    try {
      setSubmitting(true);
      await roleService.createRole({ name: normalizedName, permissions: selectedPermissions });
      showSuccess('Role created successfully');
      navigate('/roles');
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <section className="card max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Role</h1>
            <Link to="/roles" className="btn-secondary">
              Back
            </Link>
          </div>

          {loading ? (
            <div className="text-gray-600 dark:text-gray-300">Loading role options...</div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
                placeholder="Role name (e.g. QualityLead)"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
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
                            />
                            <span>{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Role'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default RoleCreate;
