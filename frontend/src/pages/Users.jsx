import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { departmentService, roleService, userService } from '../services/api';
import { showError, showSuccess, formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { PERMISSION_GROUPS } from '../utils/permissions';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: '',
  department_id: '',
};

const formatDepartmentLabel = (department) =>
  department?.four_m_link ? `${department.name} (${department.four_m_link})` : department?.name || '-';

const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);

  const roleOptions =
    currentUser?.role === 'SuperAdmin'
      ? roles
      : roles.filter((roleName) => !['SuperAdmin', 'Admin'].includes(roleName));

  const visibleDepartments =
    currentUser?.role === 'SuperAdmin'
      ? departments
      : departments.filter((department) => String(department.id) === String(currentUser?.department_id || ''));

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      const rows = response.data.data || [];
      setUsers(departmentFilter === 'All' ? rows : rows.filter((row) => String(row.department_id || '') === String(departmentFilter)));
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [departmentFilter]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAll({ status: 'Active' });
        const rows = response.data.data || [];
        setDepartments(rows);
      } catch (error) {
        showError(error?.response?.data?.message || 'Failed to fetch departments');
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleService.getRoles();
        const roleNames = (response.data.data || []).map((role) => role.name);
        setRoles(roleNames);

        if (roleNames.length > 0) {
          const defaultRole =
            currentUser?.role === 'SuperAdmin'
              ? roleNames[0]
              : roleNames.find((name) => !['SuperAdmin', 'Admin'].includes(name)) || '';

          setForm((prev) => ({
            ...prev,
            role: prev.role || defaultRole,
            department_id: prev.department_id || String(currentUser?.department_id || ''),
          }));
        }
      } catch (error) {
        showError(error?.response?.data?.message || 'Failed to fetch roles');
      }
    };

    fetchRoles();
  }, [currentUser?.role]);

  const refreshRoles = async () => {
    const response = await roleService.getRoles();
    const roleNames = (response.data.data || []).map((role) => role.name);
    setRoles(roleNames);
    return roleNames;
  };

  const toggleNewRolePermission = (permission) => {
    setNewRolePermissions((prev) =>
      prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]
    );
  };

  const handleQuickCreateRole = async (e) => {
    e.preventDefault();

    if (!hasPermission('roles.create')) {
      showError('You do not have permission to create roles');
      return;
    }

    const normalizedName = newRoleName.trim();
    if (!normalizedName) {
      showError('Role name is required');
      return;
    }

    const exists = roles.some((role) => role.toLowerCase() === normalizedName.toLowerCase());
    if (exists) {
      showError('Role already exists');
      return;
    }

    try {
      setCreatingRole(true);
      await roleService.createRole({
        name: normalizedName,
        permissions: newRolePermissions,
      });

      const roleNames = await refreshRoles();
      if (roleNames.includes(normalizedName)) {
        setForm((prev) => ({ ...prev, role: normalizedName }));
      }

      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRolePermissions([]);
      showSuccess('Role created successfully');
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to create role');
    } finally {
      setCreatingRole(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await userService.createUser({
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null,
      });
      setForm(INITIAL_FORM);
      setIsCreateOpen(false);
      showSuccess('User created successfully');
      fetchUsers();
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      showSuccess('User deleted successfully');
      fetchUsers();
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department_id: user.department_id ? String(user.department_id) : '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    const payload = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      department_id: editForm.department_id ? Number(editForm.department_id) : null,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    try {
      setSubmitting(true);
      await userService.updateUser(editingUser.id, payload);
      setIsEditOpen(false);
      setEditingUser(null);
      setEditForm(INITIAL_FORM);
      showSuccess('User updated successfully');
      fetchUsers();
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6 space-y-6`}>
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input-field w-48 dark:bg-gray-800 dark:text-gray-100"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {formatDepartmentLabel(department)}
                  </option>
                ))}
              </select>
              {hasPermission('users.create') && (
                <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
                  Create User
                </button>
              )}
            </div>
          </div>
          {hasPermission('users.create') ? (
            <div className="text-gray-600 dark:text-gray-300">Click Create User to open the form.</div>
          ) : (
            <div className="text-gray-600 dark:text-gray-300">You do not have permission to create users.</div>
          )}
        </section>

        <section className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-gray-600 dark:text-gray-300">Loading users...</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.department || '-'}</td>
                    <td>{user.role}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="flex gap-2">
                        {hasPermission('users.update') && (currentUser?.role === 'SuperAdmin' || user.id !== currentUser?.id) && (
                          <button className="btn-secondary" onClick={() => openEditModal(user)}>
                            Edit
                          </button>
                        )}
                        {hasPermission('users.delete') && user.id !== currentUser?.id && (
                          <button className="btn-danger" onClick={() => handleDelete(user.id)}>
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
        isOpen={isCreateOpen && hasPermission('users.create')}
        title="Create User"
        onClose={() => {
          setIsCreateOpen(false);
          setForm(INITIAL_FORM);
        }}
      >
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
            {roleOptions.length === 0 ? (
              <option value="">No role available</option>
            ) : (
              roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
            <select
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              required
              disabled={currentUser?.role !== 'SuperAdmin'}
            >
              <option value="">Select Department</option>
              {visibleDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {formatDepartmentLabel(department)}
                </option>
              ))}
            </select>
          </div>

          {hasPermission('roles.create') && (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setIsCreateRoleOpen(true)}
            >
              Create New Role
            </button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              onClick={() => {
                setIsCreateOpen(false);
                setForm(INITIAL_FORM);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditOpen && hasPermission('users.update')}
        title="Edit User"
        onClose={() => {
          setIsEditOpen(false);
          setEditingUser(null);
          setEditForm(INITIAL_FORM);
        }}
      >
        <form className="space-y-3" onSubmit={handleUpdate}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input
              type="password"
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              placeholder="New Password (optional)"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              required
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
            <select
              className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
              value={editForm.department_id}
              onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
              required
              disabled={currentUser?.role !== 'SuperAdmin'}
            >
              <option value="">Select Department</option>
              {visibleDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {formatDepartmentLabel(department)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              onClick={() => {
                setIsEditOpen(false);
                setEditingUser(null);
                setEditForm(INITIAL_FORM);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateRoleOpen && hasPermission('roles.create')}
        title="Create Role"
        onClose={() => {
          setIsCreateRoleOpen(false);
          setNewRoleName('');
          setNewRolePermissions([]);
        }}
      >
        <form className="space-y-4" onSubmit={handleQuickCreateRole}>
          <input
            className="input-field w-full dark:bg-gray-800 dark:text-gray-100"
            placeholder="Role name (e.g. QualityLead)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            maxLength={100}
            required
          />

          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Permissions</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="font-medium text-gray-800 dark:text-gray-100 mb-2">{group}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label key={permission} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={newRolePermissions.includes(permission)}
                          onChange={() => toggleNewRolePermission(permission)}
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
                setIsCreateRoleOpen(false);
                setNewRoleName('');
                setNewRolePermissions([]);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creatingRole}>
              {creatingRole ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
