import { useEffect, useState } from 'react';
import { adminApi } from '../utils/adminApi';

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', counselor: 'Counselor' };
const ROLE_COLORS = { admin: 'bg-purple-50 text-purple-700', manager: 'bg-blue-50 text-blue-700', counselor: 'bg-green-50 text-green-700' };

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'counselor', school_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([adminApi.getStaff(), adminApi.getSchools()])
      .then(([s, sc]) => { setStaff(s.staff); setSchools(sc.schools); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const body = { ...form, school_id: form.school_id ? parseInt(form.school_id) : null };
      const data = await adminApi.createStaff(body);
      setStaff(prev => [data.staff, ...prev]);
      setSuccess(`Account created for ${form.email}. Setup email sent.`);
      setShowForm(false);
      setForm({ email: '', name: '', role: 'counselor', school_id: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 font-medium">
          {showForm ? 'Cancel' : '+ Invite staff'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">{success}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New staff account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input type="text" value={form.name} required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="counselor">Counselor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === 'counselor' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
                <select value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— select school —</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create & send invite'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.email}{s.school_name ? ` · ${s.school_name}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[s.role]}`}>
                  {ROLE_LABELS[s.role]}
                </span>
                {!s.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactive</span>}
              </div>
            </div>
          ))}
          {staff.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No staff yet.</p>}
        </div>
      )}
    </div>
  );
}
