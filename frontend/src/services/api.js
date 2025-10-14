import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.put('/auth/update-preferences', data),
};

// Upload APIs
export const uploadAPI = {
  uploadNodes: (formData) => api.post('/upload/nodes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadRoutes: (formData) => api.post('/upload/routes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  clearAll: () => api.delete('/upload/clear-all'),
};

// Node APIs
export const nodeAPI = {
  getAll: (params) => api.get('/nodes', { params }),
  getById: (id) => api.get(`/nodes/${id}`),
  getByNodeId: (nodeId) => api.get(`/nodes/nodeId/${nodeId}`),
  update: (id, data) => api.put(`/nodes/${id}`, data),
  delete: (id) => api.delete(`/nodes/${id}`),
  getStats: () => api.get('/nodes/stats/summary'),
};

// Route APIs
export const routeAPI = {
  getAll: (params) => api.get('/routes', { params }),
  getById: (id) => api.get(`/routes/${id}`),
  getByNode: (nodeId) => api.get(`/routes/node/${nodeId}`),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
  getStats: () => api.get('/routes/stats/summary'),
};

// Analytics APIs
export const analyticsAPI = {
  getMetrics: () => api.get('/analytics/metrics'),
  getBottlenecks: () => api.get('/analytics/bottlenecks'),
  getCriticalNodes: () => api.get('/analytics/critical-nodes'),
  simulateDisruption: (data) => api.post('/analytics/simulate-disruption', data),
  findPaths: (data) => api.post('/analytics/find-paths', data),
  getNetworkHealth: () => api.get('/analytics/network-health'),
};

// Report APIs
export const reportAPI = {
  generatePDF: () => api.post('/reports/generate-pdf'),
  generateExcel: () => api.post('/reports/generate-excel'),
  download: (filename) => `${API_BASE_URL}/reports/download/${filename}`,
  list: () => api.get('/reports/list'),
  delete: (filename) => api.delete(`/reports/${filename}`),
};

// Email APIs
export const emailAPI = {
  sendReport: (data) => api.post('/email/send-report', data),
  sendAlert: () => api.post('/email/send-alert'),
  schedule: (data) => api.post('/email/schedule', data),
  cancelSchedule: (data) => api.delete('/email/schedule', { data }),
  verify: () => api.get('/email/verify'),
  enableAutoAlerts: (data) => api.post('/email/enable-auto-alerts', data),
  disableAutoAlerts: () => api.delete('/email/disable-auto-alerts'),
  getAlertStatus: () => api.get('/email/alert-status'),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
