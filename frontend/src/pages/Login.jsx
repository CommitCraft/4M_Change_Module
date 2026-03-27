import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/helpers';
import FormInput from '../components/FormInput';
import { MdDarkMode } from 'react-icons/md';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      showSuccess('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      showError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <button
        type="button"
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 transition"
        aria-label="Toggle theme"
      >
        <MdDarkMode className="text-xl" />
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">4M System</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Change Management Platform</p>

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Sign in with seeded SuperAdmin credentials from backend .env or with a user created by Admin APIs.
        </p>
      </div>
    </div>
  );
};

export default Login;
