import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../utils/adminApi';

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', city: '', contact_email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getSchools().then(d => setSchools(d.schools)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await adminApi.createSchool(form);
      setSchools(prev => [data.school, ...prev]);
      setShowForm(false);
      setForm({ name: '', slug: '', city: '', contact_email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Schools</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 font-medium">
          {showForm ? 'Cancel' : '+ Add school'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New school</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School name *</label>
              <input type="text" value={form.name} required
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input type="text" value={form.slug} required
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input type="text" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact email</label>
              <input type="email" value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create school'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
      ) : (
        <div className="space-y-2">
          {schools.map(s => (
            <Link key={s.id} to={`/admin/schools/${s.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-indigo-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.city || '—'} · {s.cohort_count} cohort{s.cohort_count !== '1' ? 's' : ''} · {s.student_count} students</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
            </Link>
          ))}
          {schools.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">No schools yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
