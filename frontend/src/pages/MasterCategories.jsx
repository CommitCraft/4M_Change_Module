import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FOUR_M_CATEGORIES, FOUR_M_TYPES, getSubCategoriesByType } from '../utils/changeCategories';
import { businessRoleService, departmentService } from '../services/api';
import { showError } from '../utils/helpers';

const MasterCategories = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeType, setActiveType] = useState('Man');
  const [dropdownType, setDropdownType] = useState('Man');
  const [roleModule, setRoleModule] = useState('Man');
  const [businessRoles, setBusinessRoles] = useState([]);
  const [selectedBusinessRole, setSelectedBusinessRole] = useState('');
  const [departments, setDepartments] = useState([]);

  const dropdownOptions = useMemo(() => getSubCategoriesByType(dropdownType), [dropdownType]);
  const [dropdownSubCategory, setDropdownSubCategory] = useState(dropdownOptions[0] || '');
  const roleOptions = useMemo(
    () => businessRoles.filter((role) => role.m_module === roleModule && role.status === 'Active'),
    [businessRoles, roleModule]
  );

  useEffect(() => {
    const fetchBusinessRoles = async () => {
      try {
        const response = await businessRoleService.getAll({ status: 'Active' });
        const rows = response?.data?.data || [];
        setBusinessRoles(Array.isArray(rows) ? rows : []);
      } catch (error) {
        showError('Failed to load business roles');
        setBusinessRoles([]);
      }
    };

    fetchBusinessRoles();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAll({ status: 'Active' });
        setDepartments(response?.data?.data || []);
      } catch (error) {
        showError('Failed to load departments');
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    setSelectedBusinessRole(roleOptions[0]?.role_name || '');
  }, [roleModule, roleOptions]);

  const handleTypeChange = (value) => {
    setDropdownType(value);
    const nextOptions = getSubCategoriesByType(value);
    setDropdownSubCategory(nextOptions[0] || '');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">4M Master Categories</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Master list ready for dropdown usage with tab-wise grouping.
            </p>
          </div>

          <div className="card">
            <div className="flex flex-wrap gap-2 mb-6">
              {FOUR_M_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    activeType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{activeType}</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {FOUR_M_CATEGORIES[activeType].map((item, index) => (
                  <li
                    key={item}
                    className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  >
                    <span className="font-semibold mr-2">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Dropdown Preview</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Category</label>
                <select
                  value={dropdownType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                >
                  {FOUR_M_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sub Category</label>
                <select
                  value={dropdownSubCategory}
                  onChange={(e) => setDropdownSubCategory(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                >
                  {dropdownOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Business Roles Dropdown (Live API)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">4M Module</label>
                <select
                  value={roleModule}
                  onChange={(e) => setRoleModule(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                >
                  {['Man', 'Machine', 'Material', 'Method', 'User'].map((moduleName) => (
                    <option key={moduleName} value={moduleName}>
                      {moduleName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Role</label>
                <select
                  value={selectedBusinessRole}
                  onChange={(e) => setSelectedBusinessRole(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                >
                  {roleOptions.length === 0 ? (
                    <option value="">No active roles found</option>
                  ) : (
                    roleOptions.map((role) => (
                      <option key={role.id} value={role.role_name}>
                        {role.role_name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedBusinessRole && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Focus Area:{' '}
                {roleOptions.find((role) => role.role_name === selectedBusinessRole)?.focus_area || '-'}
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Departments (Live API)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{department.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    4M Link: {department.four_m_link || '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MasterCategories;
