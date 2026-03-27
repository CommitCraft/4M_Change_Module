import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { roleService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import { ADMIN_MANDATORY_PERMISSIONS, ALL_PERMISSIONS, PERMISSION_GROUPS, formatPermissionLabel } from '../utils/permissions';

const PermissionMatrix = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  const groupedPermissions = useMemo(() => {
    return Object.entries(PERMISSION_GROUPS).flatMap(([group, permissions]) =>
      permissions.map((permission) => ({ group, permission }))
    );
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();
      const list = response.data.data || [];
      setRoles(
        list.map((role) => ({
          ...role,
          permissions: role.permissions || [],
        }))
      );
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const togglePermission = (roleId, permission) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        if (role.name === 'SuperAdmin') return role;
        const hasPermission = role.permissions.includes(permission);
        if (role.name === 'Admin' && ADMIN_MANDATORY_PERMISSIONS.includes(permission) && hasPermission) {
          return role;
        }
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter((item) => item !== permission)
            : [...role.permissions, permission],
        };
      })
    );
  };

  const setAllPermissionsForRole = (roleId, checked) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        if (role.name === 'SuperAdmin') {
          return {
            ...role,
            permissions: [...ALL_PERMISSIONS],
          };
        }
        if (role.name === 'Admin' && !checked) {
          return {
            ...role,
            permissions: [...ADMIN_MANDATORY_PERMISSIONS],
          };
        }
        return {
          ...role,
          permissions: checked ? [...ALL_PERMISSIONS] : [],
        };
      })
    );
  };

  const grantAllToAllRoles = () => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: [...ALL_PERMISSIONS],
      }))
    );
    showSuccess('All permissions selected for all roles. Click Save All to apply.');
  };

  const clearAllForAllRoles = () => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: role.name === 'SuperAdmin' ? [...ALL_PERMISSIONS] : role.name === 'Admin' ? [...ADMIN_MANDATORY_PERMISSIONS] : [],
      }))
    );
    showSuccess('All permissions cleared for all roles. Click Save All to apply.');
  };

  const saveRolePermissions = async (role) => {
    try {
      setSavingRoleId(role.id);
      await roleService.updateRole(role.id, {
        permissions: role.permissions,
      });
      showSuccess(`Permissions updated for ${role.name}`);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSavingRoleId(null);
    }
  };

  const saveAllPermissions = async () => {
    try {
      setSavingAll(true);

      await Promise.all(
        roles.map((role) =>
          roleService.updateRole(role.id, {
            permissions: role.permissions,
          })
        )
      );

      showSuccess('Permissions updated for all roles');
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update all permissions');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6 space-y-6`}>
        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Permission Matrix</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                SuperAdmin can assign operation-level permissions role-wise from this screen.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={grantAllToAllRoles} disabled={savingAll || loading}>
                Grant All To All Roles
              </button>
              <button className="btn-secondary" onClick={clearAllForAllRoles} disabled={savingAll || loading}>
                Clear All For All Roles
              </button>
              <button className="btn-primary" onClick={saveAllPermissions} disabled={savingAll || loading}>
                {savingAll ? 'Saving All...' : 'Save All'}
              </button>
              <Link to="/roles" className="btn-secondary">
                Back to Roles
              </Link>
            </div>
          </div>
        </section>

        <section className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-gray-600 dark:text-gray-300">Loading permission matrix...</div>
          ) : (
            <table className="table-custom min-w-[1100px]">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>All</th>
                  {groupedPermissions.map((item) => (
                    <th key={item.permission}>
                      <div className="text-left" title={item.permission}>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.group}</div>
                        <div>{formatPermissionLabel(item.permission)}</div>
                      </div>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const hasAll = ALL_PERMISSIONS.every((permission) => role.permissions.includes(permission));
                  const isSuperAdminRole = role.name === 'SuperAdmin';
                  const isAdminRole = role.name === 'Admin';

                  return (
                    <tr key={role.id}>
                      <td className="font-semibold">{role.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={hasAll}
                          onChange={(e) => setAllPermissionsForRole(role.id, e.target.checked)}
                          disabled={isSuperAdminRole}
                        />
                      </td>
                      {groupedPermissions.map((item) => (
                        <td key={`${role.id}-${item.permission}`}>
                          <input
                            type="checkbox"
                            checked={role.permissions.includes(item.permission)}
                            onChange={() => togglePermission(role.id, item.permission)}
                              disabled={isSuperAdminRole || (isAdminRole && ADMIN_MANDATORY_PERMISSIONS.includes(item.permission))}
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="btn-primary"
                          onClick={() => saveRolePermissions(role)}
                          disabled={savingRoleId === role.id || savingAll || isSuperAdminRole}
                        >
                          {savingRoleId === role.id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default PermissionMatrix;
