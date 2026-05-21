import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
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

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Groups
export const apiGroupService = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  search: (name) => api.get(`/groups/search?name=${name}`),
};

// API Nodes
export const apiNodeService = {
  getByGroupId: (groupId) => api.get(`/groups/${groupId}/nodes`),
  create: (groupId, data) => api.post(`/groups/${groupId}/nodes`, data),
  update: (nodeId, data) => api.put(`/groups/nodes/${nodeId}`, data),
  delete: (nodeId) => api.delete(`/groups/nodes/${nodeId}`),
  reorder: (groupId, nodeIds) => api.put(`/groups/${groupId}/nodes/reorder`, { nodeIds }),
};

// Execution
export const executionService = {
  execute: (groupId, variables = {}) => api.post(`/execution/run/${groupId}`, variables),
  run: (groupId, variables = {}) => api.post(`/execution/run/${groupId}`, variables),
  getRunsByGroup: (groupId) => api.get(`/execution/runs/${groupId}`),
  getRecentRuns: (groupId) => api.get(`/execution/runs/${groupId}/recent`),
  getRunById: (runId) => api.get(`/execution/run/${runId}`),
};

export default api;

// Made with Bob
