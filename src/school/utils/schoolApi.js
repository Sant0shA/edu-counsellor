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
    window.location.href = '/school/login';
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

export const schoolApi = {
  login: (email, password) =>
    apiFetch('/api/staff/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getSchool: () => apiFetch('/api/counselor/school'),
  getCohorts: () => apiFetch('/api/counselor/cohorts'),
  createCohort: (body) => apiFetch('/api/counselor/cohorts', { method: 'POST', body: JSON.stringify(body) }),
  getStudents: (cohortId) => apiFetch(`/api/counselor/cohorts/${cohortId}/students`),

  getNotes: (userId) => apiFetch(`/api/counselor/students/${userId}/notes`),
  addNote: (userId, note) =>
    apiFetch(`/api/counselor/students/${userId}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
  updateNote: (noteId, note) =>
    apiFetch(`/api/counselor/notes/${noteId}`, { method: 'PUT', body: JSON.stringify({ note }) }),

  resetPasswordRequest: (email) =>
    apiFetch('/api/staff/auth/reset-password/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordConfirm: (token, password) =>
    apiFetch('/api/staff/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
};
