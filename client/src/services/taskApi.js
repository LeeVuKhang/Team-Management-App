import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Get all tasks assigned to the authenticated user
 */
export const getUserTasks = async () => {
  const response = await axiosInstance.get('/tasks/my-tasks');
  return response.data;
};

/**
 * Get task statistics for the authenticated user
 */
export const getUserTaskStats = async () => {
  const response = await axiosInstance.get('/tasks/my-stats');
  return response.data;
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}`);
  return response.data;
};

/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (projectId) => {
  const response = await axiosInstance.get(`/tasks/project/${projectId}`);
  return response.data;
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

/**
 * Update a task
 */
export const updateTask = async (taskId, updates) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, updates);
  return response.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
};
