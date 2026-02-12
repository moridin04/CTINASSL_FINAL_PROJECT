// server/utils/api.js

import api from './api'; // Your axios instance

export const getAdminMovies = () => api.get('/admin/movies').then(res => res.data);
export const getAdminMovie = id => api.get(`/admin/movies/${id}`).then(res => res.data);
export const createAdminMovie = data => api.post('/admin/movies', data).then(res => res.data);
export const updateAdminMovie = (id, data) => api.put(`/admin/movies/${id}`, data).then(res => res.data);
export const deleteAdminMovie = id => api.delete(`/admin/movies/${id}`).then(res => res.data);
