import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
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

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Categories API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// Topics API
export const topicAPI = {
  getAll: (params) => api.get('/topics', { params }),
  getBySlug: (slug) => api.get(`/topics/${slug}`),
  create: (data) => api.post('/topics', data),
};

// Lessons API
export const lessonAPI = {
  getBySlug: (slug) => api.get(`/lessons/${slug}`),
  search: (params) => api.get('/lessons/search', { params }),
  create: (data) => api.post('/lessons', data),
};

// Progress API
export const progressAPI = {
  getOverview: () => api.get('/progress/overview'),
  getForLesson: (lessonId) => api.get(`/progress/lesson/${lessonId}`),
  updateLesson: (lessonId, data) => api.post(`/progress/lesson/${lessonId}`, data),
};

// Quiz API
export const quizAPI = {
  submit: (data) => api.post('/quiz/submit', data),
  getStats: () => api.get('/quiz/stats'),
  getLessonAttempts: (lessonId) => api.get(`/quiz/lesson/${lessonId}`),
};

export default api;
