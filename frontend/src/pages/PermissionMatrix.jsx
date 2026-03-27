import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { roleService } from '../services/api';
import { showError, showInfo, showSuccess } from '../utils/helpers';
import { ADMIN_MANDATORY_PERMISSIONS, ALL_PERMISSIONS, PERMISSION_GROUPS, formatPermissionLabel } from '../utils/permissions';

const PermissionMatrix = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [baselineByRoleId, setBaselineByRoleId] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleGroupSelection, setRoleGroupSelection] = useState({});
  const [globalGroupSelection, setGlobalGroupSelection] = useState(Object.keys(PERMISSION_GROUPS)[0] || '');

  const groupedPermissions = useMemo(() => {
    return Object.entries(PERMISSION_GROUPS).flatMap(([group, permissions]) =>
      permissions.map((permission) => ({ group, permission }))
    );
  }, []);

  const normalizePermissions = (permissions = []) =>
    [...new Set(permissions)].sort();

  const permissionsKey = (permissions = []) => normalizePermissions(permissions).join('|');

  const groupOptions = useMemo(() => ['All', ...Object.keys(PERMISSION_GROUPS)], []);

  const roleOptions = useMemo(() => ['All', ...roles.map((role) => role.name)], [roles]);

  const normalizeRolePermissions = (roleName, permissions = []) => {
    const normalized = normalizePermissions(permissions);
    if (roleName === 'SuperAdmin') return normalizePermissions(ALL_PERMISSIONS);
    if (roleName === 'Admin') {
      return normalizePermissions([...normalized, ...ADMIN_MANDATORY_PERMISSIONS]);
    }
    return normalized;
  };

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    return groupedPermissions.filter((item) => {
      const groupMatch = groupFilter === 'All' || item.group === groupFilter;
      const searchMatch =
        !query ||
        item.permission.toLowerCase().includes(query) ||
        formatPermissionLabel(item.permission).toLowerCase().includes(query) ||
        item.group.toLowerCase().includes(query);
      return groupMatch && searchMatch;
    });
  }, [groupedPermissions, groupFilter, permissionSearch]);

  const visibleRoles = useMemo(
    () => (roleFilter === 'All' ? roles : roles.filter((role) => role.name === roleFilter)),
    [roles, roleFilter]
  );

  const dirtyRoleIds = useMemo(() => {
    return roles
      .filter((role) => permissionsKey(role.permissions) !== (baselineByRoleId[role.id] || ''))
      .map((role) => role.id);
  }, [roles, baselineByRoleId]);

  const permissionDeltaPreview = useMemo(() => {
    const rows = roles
      .map((role) => {
        const baseline = new Set((baselineByRoleId[role.id] || '').split('|').filter(Boolean));
        const current = new Set(role.permissions || []);

        const added = [...current].filter((permission) => !baseline.has(permission));
        const removed = [...baseline].filter((permission) => !current.has(permission));

        return {
          roleId: role.id,
          roleName: role.name,
          added,
          removed,
          changed: added.length + removed.length,
        };
      })
      .filter((item) => item.changed > 0)
      .sort((a, b) => b.changed - a.changed || a.roleName.localeCompare(b.roleName));

    return {
      rows,
      totalAdded: rows.reduce((sum, item) => sum + item.added.length, 0),
      totalRemoved: rows.reduce((sum, item) => sum + item.removed.length, 0),
    };
  }, [roles, baselineByRoleId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();
      const list = response.data.data || [];
      setRoles(
        list.map((role) => ({
          ...role,
          permissions: normalizeRolePermissions(role.name, role.permissions || []),
        }))
      );
      const baseline = {};
      list.forEach((role) => {
        baseline[role.id] = permissionsKey(role.permissions || []);
      });
      setBaselineByRoleId(baseline);
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
        const nextPermissions = hasPermission
          ? role.permissions.filter((item) => item !== permission)
          : [...role.permissions, permission];

        return {
          ...role,
          permissions: normalizeRolePermissions(role.name, nextPermissions),
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
            permissions: normalizeRolePermissions(role.name, ALL_PERMISSIONS),
          };
        }
        if (role.name === 'Admin' && !checked) {
          return {
            ...role,
            permissions: normalizeRolePermissions(role.name, ADMIN_MANDATORY_PERMISSIONS),
          };
        }
        return {
          ...role,
          permissions: normalizeRolePermissions(role.name, checked ? ALL_PERMISSIONS : []),
        };
      })
    );
  };

  const grantAllToAllRoles = () => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: normalizeRolePermissions(role.name, ALL_PERMISSIONS),
      }))
    );
    showSuccess('All permissions selected for all roles. Click Save All to apply.');
  };

  const clearAllForAllRoles = () => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: normalizeRolePermissions(role.name, []),
      }))
    );
    showSuccess('All permissions cleared for all roles. Click Save All to apply.');
  };

  const applyGroupPermissionsForRole = (roleId, groupName, checked) => {
    const groupPermissions = PERMISSION_GROUPS[groupName] || [];
    if (groupPermissions.length === 0) return;

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        if (role.name === 'SuperAdmin') return role;

        const nextPermissions = checked
          ? [...role.permissions, ...groupPermissions]
          : role.permissions.filter((permission) => !groupPermissions.includes(permission));

        return {
          ...role,
          permissions: normalizeRolePermissions(role.name, nextPermissions),
        };
      })
    );
  };

  const applyGroupPermissionsForAllRoles = (groupName, checked) => {
    const groupPermissions = PERMISSION_GROUPS[groupName] || [];
    if (groupPermissions.length === 0) return;

    setRoles((prev) =>
      prev.map((role) => {
        if (role.name === 'SuperAdmin') return role;

        const nextPermissions = checked
          ? [...role.permissions, ...groupPermissions]
          : role.permissions.filter((permission) => !groupPermissions.includes(permission));

        return {
          ...role,
          permissions: normalizeRolePermissions(role.name, nextPermissions),
        };
      })
    );

    showSuccess(
      `${checked ? 'Granted' : 'Cleared'} ${groupName} permissions for all editable roles. Click Save All to apply.`
    );
  };

  const resetUnsavedChanges = () => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: normalizePermissions((baselineByRoleId[role.id] || '').split('|').filter(Boolean)),
      }))
    );
    showInfo('Unsaved permission changes reverted.');
  };

  const saveRolePermissions = async (role) => {
    try {
      setSavingRoleId(role.id);
      await roleService.updateRole(role.id, {
        permissions: role.permissions,
      });
      setBaselineByRoleId((prev) => ({
        ...prev,
        [role.id]: permissionsKey(role.permissions),
      }));
      showSuccess(`Permissions updated for ${role.name}`);
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSavingRoleId(null);
    }
  };

  const saveAllPermissions = async () => {
    try {
      const dirtyRoles = roles.filter((role) => dirtyRoleIds.includes(role.id));
      if (dirtyRoles.length === 0) {
        showInfo('No permission changes to save.');
        return;
      }

      setSavingAll(true);

      await Promise.all(
        dirtyRoles.map((role) =>
          roleService.updateRole(role.id, {
            permissions: role.permissions,
          })
        )
      );

      setBaselineByRoleId((prev) => {
        const next = { ...prev };
        dirtyRoles.forEach((role) => {
          next[role.id] = permissionsKey(role.permissions);
        });
        return next;
      });

      showSuccess(`Permissions updated for ${dirtyRoles.length} role(s)`);
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
            <div className="flex gap-2 flex-wrap justify-end">
              <button className="btn-secondary" onClick={resetUnsavedChanges} disabled={savingAll || loading || dirtyRoleIds.length === 0}>
                Reset Unsaved
              </button>
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Roles</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{roles.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Permissions Visible</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{filteredPermissions.length}</p>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-700 p-3 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs text-amber-700 dark:text-amber-300">Unsaved Roles</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{dirtyRoleIds.length}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
              placeholder="Search permissions"
            />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Groups' : option}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-gray-200"
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Roles' : option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={globalGroupSelection}
              onChange={(e) => setGlobalGroupSelection(e.target.value)}
              className="input-field max-w-xs dark:bg-gray-800 dark:text-gray-200"
            >
              {Object.keys(PERMISSION_GROUPS).map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              onClick={() => applyGroupPermissionsForAllRoles(globalGroupSelection, true)}
              disabled={savingAll || loading || !globalGroupSelection}
            >
              Grant Group To All Roles
            </button>
            <button
              className="btn-secondary"
              onClick={() => applyGroupPermissionsForAllRoles(globalGroupSelection, false)}
              disabled={savingAll || loading || !globalGroupSelection}
            >
              Clear Group For All Roles
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Change Preview (Before Save)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Review add/remove permission impact before saving.</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Roles: {permissionDeltaPreview.rows.length} | Added: {permissionDeltaPreview.totalAdded} | Removed: {permissionDeltaPreview.totalRemoved}
              </p>
            </div>

            {permissionDeltaPreview.rows.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No unsaved permission changes to preview.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {permissionDeltaPreview.rows.map((row) => (
                  <div key={`preview-${row.roleId}`} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{row.roleName}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        +{row.added.length} / -{row.removed.length}
                      </p>
                    </div>

                    {row.added.length > 0 && (
                      <p className="text-[11px] text-green-700 dark:text-green-300 mt-1 break-words">
                        Added: {row.added.map((permission) => formatPermissionLabel(permission)).join(', ')}
                      </p>
                    )}

                    {row.removed.length > 0 && (
                      <p className="text-[11px] text-red-700 dark:text-red-300 mt-1 break-words">
                        Removed: {row.removed.map((permission) => formatPermissionLabel(permission)).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                  {filteredPermissions.map((item) => (
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
                {visibleRoles.map((role) => {
                  const hasAll = ALL_PERMISSIONS.every((permission) => role.permissions.includes(permission));
                  const isSuperAdminRole = role.name === 'SuperAdmin';
                  const isAdminRole = role.name === 'Admin';
                  const isDirty = dirtyRoleIds.includes(role.id);
                  const selectedGroup = roleGroupSelection[role.id] || Object.keys(PERMISSION_GROUPS)[0] || '';

                  return (
                    <tr key={role.id}>
                      <td className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{role.name}</span>
                          {isDirty && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              Unsaved
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={hasAll}
                          onChange={(e) => setAllPermissionsForRole(role.id, e.target.checked)}
                          disabled={isSuperAdminRole}
                        />
                      </td>
                      {filteredPermissions.map((item) => (
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
                        <div className="flex flex-col gap-2 min-w-[180px]">
                          <select
                            value={selectedGroup}
                            onChange={(e) =>
                              setRoleGroupSelection((prev) => ({
                                ...prev,
                                [role.id]: e.target.value,
                              }))
                            }
                            className="input-field text-xs dark:bg-gray-800 dark:text-gray-200"
                            disabled={isSuperAdminRole}
                          >
                            {Object.keys(PERMISSION_GROUPS).map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-1">
                            <button
                              className="btn-secondary text-xs"
                              onClick={() => applyGroupPermissionsForRole(role.id, selectedGroup, true)}
                              disabled={isSuperAdminRole || savingAll}
                            >
                              Grant Group
                            </button>
                            <button
                              className="btn-secondary text-xs"
                              onClick={() => applyGroupPermissionsForRole(role.id, selectedGroup, false)}
                              disabled={isSuperAdminRole || savingAll}
                            >
                              Clear Group
                            </button>
                          </div>

                          <button
                            className="btn-primary"
                            onClick={() => saveRolePermissions(role)}
                            disabled={savingRoleId === role.id || savingAll || isSuperAdminRole || !isDirty}
                          >
                            {savingRoleId === role.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleRoles.length === 0 && (
                  <tr>
                    <td colSpan={filteredPermissions.length + 3} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No roles match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default PermissionMatrix;
