// src/utils/api.js

const API_URL = '/api';

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
    await fetchWithCredentials(`${API_URL}/auth/csrf`);
  } catch (e) {}
  return getCookie('XSRF-TOKEN');
}

const fetchWithCredentials = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
};

// Login: role is optional
export async function login(username, password, role) {
  const body = { username, password };
  if (role) body.role = role;
  const res = await fetchWithCredentials(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Invalid credentials');
  return data;
}

// Register: order is username, password, email
export async function register(username, password, email = '', role = 'user', adminSecret = '') {
  const body = { username, password, email, role };
  if (role === 'admin') {
    body.adminSecret = adminSecret;
  }
  const res = await fetchWithCredentials(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');
  return data;
}

export async function logout() {
  const csrf = await ensureCsrfToken();
  await fetchWithCredentials(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
  });
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}
