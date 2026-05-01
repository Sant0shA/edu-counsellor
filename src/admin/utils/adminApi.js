function staffHeaders() {
  try {
    const saved = localStorage.getItem('cs_staff_auth');
    if (!saved) return {};
    const { token } = JSON.parse(saved);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

function handle401(res) {
  if (res.status === 401) {
    try { localStorage.removeItem('cs_staff_auth'); } catch {}
    window.location.href = '/admin/login';
    return true;
  }
  return false;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...staffHeaders(), ...(opts.headers || {}) },
  });
  if (handle401(res)) throw new Error('Unauthorized');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const adminApi = {
  login: (email, password) =>
    apiFetch('/api/staff/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getSchools: () => apiFetch('/api/admin/schools'),
  createSchool: (body) => apiFetch('/api/admin/schools', { method: 'POST', body: JSON.stringify(body) }),
  getSchool: (id) => apiFetch(`/api/admin/schools/${id}`),
  updateSchool: (id, body) => apiFetch(`/api/admin/schools/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getCohorts: (schoolId) => apiFetch(`/api/admin/schools/${schoolId}/cohorts`),
  createCohort: (schoolId, body) =>
    apiFetch(`/api/admin/schools/${schoolId}/cohorts`, { method: 'POST', body: JSON.stringify(body) }),
  updateCohort: (id, body) => apiFetch(`/api/admin/cohorts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getStaff: () => apiFetch('/api/admin/staff'),
  createStaff: (body) => apiFetch('/api/admin/staff', { method: 'POST', body: JSON.stringify(body) }),
  updateStaff: (id, body) => apiFetch(`/api/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  resetPasswordRequest: (email) =>
    apiFetch('/api/staff/auth/reset-password/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordConfirm: (token, password) =>
    apiFetch('/api/staff/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
