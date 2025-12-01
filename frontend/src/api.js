// API helper with automatic refresh-on-401 using HttpOnly refresh cookie.
// Exports: apiFetch(path, opts, { retry = true }) and logout().
export function getApiBase() {
  // Default to the common Flask dev server port (5000). Override with VITE_API_BASE.
  return import.meta.env.VITE_API_BASE || 'http://localhost:8000';
}

import axios from 'axios';

async function parseResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

async function tryRefresh() {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await parseResponse(res);
    return data;
  } catch (e) {
    return null;
  }
}

export async function apiFetch(path, opts = {}, { retry = true } = {}) {
  const base = getApiBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const headers = new Headers(opts.headers || {});
  if (opts.body && !(opts.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('authToken');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Always include credentials so HttpOnly refresh cookie is sent
  let res = await fetch(url, { ...opts, headers, credentials: 'include' });
  if (res.status === 401 && retry) {
    // Try to refresh using the HttpOnly refresh cookie
    const refreshData = await tryRefresh();
    if (refreshData && refreshData.token) {
      // update local token and retry original request once
      localStorage.setItem('authToken', refreshData.token);
      headers.set('Authorization', `Bearer ${refreshData.token}`);
      res = await fetch(url, { ...opts, headers, credentials: 'include' });
    } else {
      // refresh failed -> logout
      await logout();
      const err = new Error('Unauthenticated');
      err.status = 401;
      throw err;
    }
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Small helper for POSTing JSON with credentials and proper headers.
export async function apiPost(path, body = {}, { retry = true } = {}) {
  const base = getApiBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Dev helper to log requests/responses
  const devLog = (label, data) => {
    if (import.meta.env.DEV) console.debug(`[apiPost] ${label}`, data);
  };

  let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), credentials: 'include' });
  devLog('request', { url, body });
  if (res.status === 401 && retry) {
    const refreshData = await tryRefresh();
    if (refreshData && refreshData.token) {
      localStorage.setItem('authToken', refreshData.token);
      headers['Authorization'] = `Bearer ${refreshData.token}`;
      res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), credentials: 'include' });
    }
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  if (!res.ok) {
    devLog('response-error', { status: res.status, body: data });
    const err = new Error('Request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  devLog('response', data);
  return data;
}

// Upload a single file with Axios and progress callback
export async function uploadSingle(path, file, onProgress = () => {}, extraFields = {}) {
  const base = getApiBase();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const token = localStorage.getItem('authToken');
  const fd = new FormData();
  // backend accepts 'image' for single-file enroll or attendance
  fd.append('image', file, file.name);
  // append extra fields (e.g., latitude, longitude)
  Object.entries(extraFields || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(url, fd, {
      withCredentials: true,
      headers,
      onUploadProgress: (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    return res.data;
  } catch (err) {
    // Handle 401 by trying refresh+retry
    if (err.response && err.response.status === 401) {
      const refreshData = await tryRefresh();
      if (refreshData && refreshData.token) {
        localStorage.setItem('authToken', refreshData.token);
        headers['Authorization'] = `Bearer ${refreshData.token}`;
        const res2 = await axios.post(url, fd, { withCredentials: true, headers, onUploadProgress: (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); } });
        return res2.data;
      }
    }
    throw err;
  }
}

// Upload multiple files sequentially to provide per-file progress callbacks.
// files: array of File
// callbacks: { onFileProgress(index, percent), onOverall(percent) }
export async function uploadFilesSequential(path, files, { onFileProgress = () => {}, onOverall = () => {} } = {}) {
  const total = files.length;
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const res = await uploadSingle(path, file, (p) => {
      onFileProgress(i, p);
      // approximate overall progress: average of completed files + current file percent
      const overall = Math.round(((i) / total) * 100 + (p / total));
      onOverall(overall);
    });
    results.push(res);
    onOverall(Math.round(((i + 1) / total) * 100));
  }
  return results;
}

export async function logout({ redirect = true } = {}) {
  const base = getApiBase();
  try {
    // Attempt to revoke server-side refresh token; cookie will be cleared by server response
    await fetch(`${base}/api/auth/revoke-refresh`, { method: 'POST', credentials: 'include' });
  } catch (e) {
    // ignore errors — ensure client clears local state regardless
  }
  localStorage.removeItem('authToken');
  if (redirect) {
    try { window.location.href = '/'; } catch (e) {}
  }
}

export default apiFetch;
