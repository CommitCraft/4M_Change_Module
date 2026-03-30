import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AiFillHome, AiFillFile, AiFillCheckCircle } from 'react-icons/ai';
import { FaChartBar, FaListUl, FaUserShield, FaUsers, FaTools, FaClipboardCheck, FaChartLine } from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const { hasPermission, user } = useAuth();
  const location = useLocation();

  const isRoleAllowed = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user?.role);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: AiFillHome, permission: 'dashboard.view' },
    { path: '/create', label: 'Create Request', icon: FaChartBar, permission: 'changes.create' },
    { path: '/changes', label: 'All Requests', icon: AiFillFile, permission: 'changes.read' },
    // Removed Pending Reviews and Pending Approvals from sidebar
    { path: '/implementation', label: 'Implementation', icon: FaTools, permission: 'changes.update', roles: ['Admin', 'SuperAdmin'] },
    { path: '/monitoring', label: 'Monitoring', icon: FaChartLine, permission: 'changes.update', roles: ['Admin', 'SuperAdmin'] },
    { path: '/reports', label: 'Reports', icon: FaChartBar, permission: 'changes.read' },
    { path: '/masters', label: 'Masters', icon: FaListUl, permission: 'changes.read' },
    { path: '/guided-setup', label: '4M Guided Setup', icon: FaClipboardCheck, permission: 'changes.read' },
    { path: '/users', label: 'Users', icon: FaUsers, permission: 'users.read' },
    { path: '/roles', label: 'Roles', icon: FaUserShield, permission: 'roles.read' },
  ];

  const visibleItems = menuItems.filter((item) => hasPermission(item.permission) && isRoleAllowed(item.roles));

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 z-40 overflow-y-auto`}
    >
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">Menu</h2>
        <nav className="space-y-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="text-xl" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
