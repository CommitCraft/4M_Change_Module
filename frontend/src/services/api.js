import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const withConfirmation = (message, requestFn) => {
  // Confirmation dialogs removed; callers now rely on toast responses.
  void message;
  return requestFn();
};

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const changeRequestService = {
  createChangeRequest: (data) => withConfirmation('Create this change request?', () => api.post('/change', data)),
  getChangeRequests: (filters = {}) =>
    api.get('/change', { params: filters }),
  getChangeRequestById: (id) =>
    api.get(`/change/${id}`),
  updateChangeRequest: (id, data) =>
    withConfirmation('Update this change request?', () => api.put(`/change/${id}`, data)),
  deleteChangeRequest: (id) =>
    withConfirmation('Delete this change request?', () => api.delete(`/change/${id}`)),
  getDashboardStats: () =>
    api.get('/change/dashboard/stats'),
};

export const approvalService = {
  createApproval: (request_id, status, remarks) =>
    withConfirmation('Submit this approval decision?', () => api.post('/approval', { request_id, status, remarks })),
  getApprovals: (requestId) => api.get(`/approval/${requestId}`),
};

export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (payload) => withConfirmation('Create this user?', () => api.post('/users', payload)),
  updateUser: (id, payload) => withConfirmation('Update this user?', () => api.put(`/users/${id}`, payload)),
  updateSelf: (payload) => api.put('/users/me', payload),
  deleteUser: (id) => withConfirmation('Delete this user?', () => api.delete(`/users/${id}`)),
};

export const roleService = {
  getRoles: () => api.get('/roles'),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (payload) => withConfirmation('Create this role?', () => api.post('/roles', payload)),
  updateRole: (id, payload) => withConfirmation('Update this role?', () => api.put(`/roles/${id}`, payload)),
  deleteRole: (id) => withConfirmation('Delete this role?', () => api.delete(`/roles/${id}`)),
};

export const fileService = {
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return withConfirmation('Upload this file?', () =>
      api.post(`/files/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
  downloadFile: (filename) =>
    api.get(`/files/${filename}`, { responseType: 'blob' }),
  getByRequestId: (id) => api.get(`/files/request/${id}`),
  deleteFile: (id) =>
    withConfirmation('Delete this file?', () => api.delete(`/files/${id}`)),
};

export const masterService = {
  getMasters: (filters = {}) => api.get('/masters', { params: filters }),
  createMaster: (payload) => withConfirmation('Create master entry?', () => api.post('/masters', payload)),
  updateMaster: (id, payload) => withConfirmation('Update master entry?', () => api.put(`/masters/${id}`, payload)),
  deleteMaster: (id) => withConfirmation('Delete master entry?', () => api.delete(`/masters/${id}`)),
};

export const guidedSetupService = {
  getProgress: (flowType) => api.get(`/guided-setup/${flowType}`),
  saveProgress: (flowType, payload) => withConfirmation('Save guided setup progress?', () => api.put(`/guided-setup/${flowType}`, payload)),
  resetProgress: (flowType) => withConfirmation('Reset guided setup progress?', () => api.delete(`/guided-setup/${flowType}`)),
};

export default api;
