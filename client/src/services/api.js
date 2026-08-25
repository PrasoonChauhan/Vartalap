import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('vartalap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (formData) => API.post('/auth/register', formData);
export const loginUser = (data) => API.post('/auth/login', data);
export const googleLogin = (credential) => API.post('/auth/google', { credential });
export const getMe = () => API.get('/auth/me');
export const updateAvatar = (formData) => API.put('/auth/avatar', formData);

// Users
export const searchUsers = (q) => API.get(`/users/search?q=${encodeURIComponent(q)}`);
export const getRecentContacts = () => API.get('/users/recent-contacts');
export const getUserById = (id) => API.get(`/users/${id}`);

// Chat
export const getChatHistory = (roomId) => API.get(`/chat/${roomId}`);
export const deleteRoomChat = (roomId) => API.delete(`/chat/${roomId}`);
