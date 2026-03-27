import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AiOutlineMenu } from 'react-icons/ai';
import { MdDarkMode, MdLogout } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
          >
            <AiOutlineMenu />
          </button>
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">4M System</h1>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleDarkMode}
            className="text-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
          >
            <MdDarkMode />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <MdLogout /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
