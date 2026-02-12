// src/admin/utils/api.js

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

async function ensureCsrfToken() {
  const existing = getCookie('XSRF-TOKEN');
  if (existing) return existing;
  try {
    await api.get('/auth/csrf');
  } catch (e) {}
  return getCookie('XSRF-TOKEN');
}

// --- REQUEST INTERCEPTOR: Attach JWT Token ---
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const csrf = getCookie('XSRF-TOKEN');
  if (csrf) config.headers['X-CSRF-Token'] = csrf;
  return config;
});

// --- RESPONSE INTERCEPTOR: Handle 401 & Token Refresh ---
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await ensureCsrfToken();
        const res = await api.post('/auth/refresh-token');
        localStorage.setItem('token', res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Do not redirect here, let React handle navigation
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH FUNCTIONS ---

/**
 * Login function
 * @param {string} username
 * @param {string} password
 * @param {string} role - 'user', 'admin', or 'super-admin' (default: 'super-admin' for admin panel)
 */
export const login = async (username, password, role) => {
  try {
    // Only send role if provided (admin login)
    const body = { username, password };
    if (role) body.role = role;
    const res = await api.post('/auth/login', body);
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Invalid username or password';
    throw new Error(msg);
  }
};

/**
 * Register function
 * @param {string} username
 * @param {string} password
 * @param {string} email
 * @param {string} role - 'user', 'admin', 'super-admin'
 * @param {string} superAdminSecret
 */
export const register = async (
  username,
  password,
  email = '',
  role = 'user',
  superAdminSecret = ''
) => {
  const body = { username, password, email, role };
  if (role === 'admin' || role === 'super-admin') {
    body.superAdminSecret = superAdminSecret;
  }
  try {
    const res = await api.post('/auth/register', body);
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Registration failed';
    throw new Error(msg);
  }
};

/**
 * Logout function
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {}
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Refresh token function
 */
export const refreshToken = async () => {
  const res = await api.post('/auth/refresh-token');
  return res.data;
};

// --- DASHBOARD APIs ---
export const getMoviesPerMonth = () =>
  api.get('/admin/dashboard/movies-per-month').then(res => res.data);

export const getUserRegistrations = () =>
  api.get('/admin/dashboard/user-registrations').then(res => res.data);

export const getGenrePopularity = () =>
  api.get('/admin/dashboard/genre-popularity').then(res => res.data);

export const getRecentActivity = () =>
  api.get('/admin/dashboard/recent-activity').then(res => res.data);

export const getDashboardStats = () =>
  api.get('/admin/dashboard/stats').then(res => res.data);

// --- MOVIES CRUD APIs ---
export const getAdminMovies = () =>
  api.get('/admin/movies').then(res => res.data);

export const getAdminMovie = id =>
  api.get(`/admin/movies/${id}`).then(res => res.data);

export const createAdminMovie = data =>
  api.post('/admin/movies', data).then(res => res.data);

export const updateAdminMovie = (id, data) =>
  api.put(`/admin/movies/${id}`, data).then(res => res.data);

export const deleteAdminMovie = id =>
  api.delete(`/admin/movies/${id}`).then(res => res.data);

// --- USERS CRUD APIs ---
export const getAdminUsers = () =>
  api.get('/admin/users').then(res => res.data);

export const createAdminUser = data =>
  api.post('/admin/users', data).then(res => res.data);

export const updateAdminUser = (id, data) =>
  api.put(`/admin/users/${id}`, data).then(res => res.data);

export const deleteAdminUser = id =>
  api.delete(`/admin/users/${id}`).then(res => res.data);

// --- GENRES CRUD APIs ---
export const getGenres = () =>
  api.get('/admin/genres').then(res => res.data);

export const getGenre = id =>
  api.get(`/admin/genres/${id}`).then(res => res.data);

export const createGenre = data =>
  api.post('/admin/genres', data).then(res => res.data);

export const updateGenre = (id, data) =>
  api.put(`/admin/genres/${id}`, data).then(res => res.data);

export const deleteGenre = id =>
  api.delete(`/admin/genres/${id}`).then(res => res.data);

// --- CAST CRUD APIs ---
export const getCast = () =>
  api.get('/admin/cast').then(res => res.data);

export const getCastMember = id =>
  api.get(`/admin/cast/${id}`).then(res => res.data);

export const createCastMember = data =>
  api.post('/admin/cast', data).then(res => res.data);

export const updateCastMember = (id, data) =>
  api.put(`/admin/cast/${id}`, data).then(res => res.data);

export const deleteCastMember = id =>
  api.delete(`/admin/cast/${id}`).then(res => res.data);

// --- RATINGS CRUD APIs ---
export const getRatings = () =>
  api.get('/admin/ratings').then(res => res.data);

export const getRating = id =>
  api.get(`/admin/ratings/${id}`).then(res => res.data);

export const createRating = data =>
  api.post('/admin/ratings', data).then(res => res.data);

export const updateRating = (id, data) =>
  api.put(`/admin/ratings/${id}`, data).then(res => res.data);

export const deleteRating = id =>
  api.delete(`/admin/ratings/${id}`).then(res => res.data);

// --- IMAGE UPLOAD ---
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.imageUrl;
};

// --- REPORTS APIs ---
export const getReportHistory = () =>
  api.get('/admin/reports').then(res => res.data);

export const getReportsMoviesPerMonth = () =>
  api.get('/admin/reports/movies-per-month').then(res => res.data);

export const getReportsUserGrowth = () =>
  api.get('/admin/reports/user-growth').then(res => res.data);

export const getReportsTopRatedMovies = () =>
  api.get('/admin/reports/top-rated-movies').then(res => res.data);

export const generateReport = (payload) =>
  api.post('/admin/reports/generate', payload).then(res => res.data);

export const downloadReport = (reportId) =>
  api.get(`/admin/reports/download/${reportId}`, { responseType: 'blob' }).then(res => res.data);

// --- Delete a report ---
export const deleteReport = (id) =>
  api.delete(`/admin/reports/${id}`).then(res => res.data);

export default api;
