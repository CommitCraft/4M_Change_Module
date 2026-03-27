import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AiOutlineMenu } from 'react-icons/ai';
import { MdDarkMode, MdLogout } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const profileRef = React.useRef();

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:opacity-90 transition"
            aria-label="Go to dashboard"
          >
            4M System
          </button>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleDarkMode}
            className="text-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
          >
            <MdDarkMode />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <FaUserCircle className="text-2xl text-gray-500 dark:text-gray-300" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{user?.name}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-100 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-b-lg transition text-left"
                >
                  <MdLogout /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
