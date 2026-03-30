const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAdminUsers(token) {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load users');
  return data;
}

export async function fetchAdminUserDetail(token, userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load user');
  return data.user;
}

export async function fetchAdminStats(token) {
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load stats');
  return data.stats;
}

export async function sendAdminNotification(token, { userId, message }) {
  const res = await fetch(`${API_BASE}/admin/notifications`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to send');
  return data;
}
