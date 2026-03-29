export const riskLevelService = {
  getAll: () => api.get('/risk-levels'),
  create: (payload) => withConfirmation('Create risk level?', () => api.post('/risk-levels', payload)),
  update: (id, payload) => withConfirmation('Update risk level?', () => api.put(`/risk-levels/${id}`, payload)),
  delete: (id) => withConfirmation('Delete risk level?', () => api.delete(`/risk-levels/${id}`)),
};
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
  createChangeRequest: (data) => withConfirmation('Create this change request?', () => api.post('/change-requests', data)),
  getChangeRequests: (filters = {}) =>
    api.get('/change-requests', { params: filters }),
  getChangeRequestById: (id) =>
    api.get(`/change-requests/${id}`),
  updateChangeRequest: (id, data) =>
    withConfirmation('Update this change request?', () => api.put(`/change-requests/${id}`, data)),
  deleteChangeRequest: (id) =>
    withConfirmation('Delete this change request?', () => api.delete(`/change-requests/${id}`)),
  getDashboardStats: () =>
    api.get('/change-requests/dashboard/stats'),
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


// Individual master data services
export const departmentService = {
  getAll: () => api.get('/departments'),
  create: (payload) => withConfirmation('Create department?', () => api.post('/departments', payload)),
  update: (id, payload) => withConfirmation('Update department?', () => api.put(`/departments/${id}`, payload)),
  delete: (id) => withConfirmation('Delete department?', () => api.delete(`/departments/${id}`)),
};
export const productionLineService = {
  getAll: () => api.get('/production-lines'),
  create: (payload) => withConfirmation('Create production line?', () => api.post('/production-lines', payload)),
  update: (id, payload) => withConfirmation('Update production line?', () => api.put(`/production-lines/${id}`, payload)),
  delete: (id) => withConfirmation('Delete production line?', () => api.delete(`/production-lines/${id}`)),
};
export const machineService = {
  getAll: () => api.get('/machines'),
  create: (payload) => withConfirmation('Create machine?', () => api.post('/machines', payload)),
  update: (id, payload) => withConfirmation('Update machine?', () => api.put(`/machines/${id}`, payload)),
  delete: (id) => withConfirmation('Delete machine?', () => api.delete(`/machines/${id}`)),
};
export const changeSubTypeService = {
  getAll: () => api.get('/change-subtypes'),
  create: (payload) => withConfirmation('Create change subtype?', () => api.post('/change-subtypes', payload)),
  update: (id, payload) => withConfirmation('Update change subtype?', () => api.put(`/change-subtypes/${id}`, payload)),
  delete: (id) => withConfirmation('Delete change subtype?', () => api.delete(`/change-subtypes/${id}`)),
};
export const operatorService = {
  getAll: () => api.get('/operators'),
  create: (payload) => withConfirmation('Create operator?', () => api.post('/operators', payload)),
  update: (id, payload) => withConfirmation('Update operator?', () => api.put(`/operators/${id}`, payload)),
  delete: (id) => withConfirmation('Delete operator?', () => api.delete(`/operators/${id}`)),
};
export const skillService = {
  getAll: () => api.get('/skills'),
  create: (payload) => withConfirmation('Create skill?', () => api.post('/skills', payload)),
  update: (id, payload) => withConfirmation('Update skill?', () => api.put(`/skills/${id}`, payload)),
  delete: (id) => withConfirmation('Delete skill?', () => api.delete(`/skills/${id}`)),
};
export const operatorSkillMapService = {
  getAll: () => api.get('/operator-skill-maps'),
  create: (payload) => withConfirmation('Create operator-skill map?', () => api.post('/operator-skill-maps', payload)),
  update: (id, payload) => withConfirmation('Update operator-skill map?', () => api.put(`/operator-skill-maps/${id}`, payload)),
  delete: (id) => withConfirmation('Delete operator-skill map?', () => api.delete(`/operator-skill-maps/${id}`)),
};
export const machineSkillRequirementService = {
  getAll: () => api.get('/machine-skill-requirements'),
  create: (payload) => withConfirmation('Create machine-skill requirement?', () => api.post('/machine-skill-requirements', payload)),
  update: (id, payload) => withConfirmation('Update machine-skill requirement?', () => api.put(`/machine-skill-requirements/${id}`, payload)),
  delete: (id) => withConfirmation('Delete machine-skill requirement?', () => api.delete(`/machine-skill-requirements/${id}`)),
};
export const trainingProgramService = {
  getAll: () => api.get('/training-programs'),
  create: (payload) => withConfirmation('Create training program?', () => api.post('/training-programs', payload)),
  update: (id, payload) => withConfirmation('Update training program?', () => api.put(`/training-programs/${id}`, payload)),
  delete: (id) => withConfirmation('Delete training program?', () => api.delete(`/training-programs/${id}`)),
};
export const typeRequirementService = {
  getAll: () => api.get('/type-requirements'),
  create: (payload) => withConfirmation('Create type requirement?', () => api.post('/type-requirements', payload)),
  update: (id, payload) => withConfirmation('Update type requirement?', () => api.put(`/type-requirements/${id}`, payload)),
  delete: (id) => withConfirmation('Delete type requirement?', () => api.delete(`/type-requirements/${id}`)),
};
export const typeActionTemplateService = {
  getAll: () => api.get('/type-action-templates'),
  create: (payload) => withConfirmation('Create type action template?', () => api.post('/type-action-templates', payload)),
  update: (id, payload) => withConfirmation('Update type action template?', () => api.put(`/type-action-templates/${id}`, payload)),
  delete: (id) => withConfirmation('Delete type action template?', () => api.delete(`/type-action-templates/${id}`)),
};

export const guidedSetupService = {
  getProgress: (flowType) => api.get(`/guided-setup/${flowType}`),
  saveProgress: (flowType, payload) => withConfirmation('Save guided setup progress?', () => api.put(`/guided-setup/${flowType}`, payload)),
  resetProgress: (flowType) => withConfirmation('Reset guided setup progress?', () => api.delete(`/guided-setup/${flowType}`)),
};

export default api;
