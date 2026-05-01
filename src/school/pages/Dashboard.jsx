import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

export default function SchoolDashboard() {
  const [school, setSchool] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bypass_otp: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([schoolApi.getSchool(), schoolApi.getCohorts()])
      .then(([s, c]) => { setSchool(s.school); setCohorts(c.cohorts); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await schoolApi.createCohort(form);
      setCohorts(prev => [data.cohort, ...prev]);
      setShowForm(false);
      setForm({ name: '', bypass_otp: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{school?.name || 'CareerShifu'}</p>
          <p className="text-xs text-gray-400">Counselor portal</p>
        </div>
        <button onClick={() => { localStorage.removeItem('cs_staff_auth'); window.location.href = '/school/login'; }}
          className="text-xs text-gray-400 hover:underline">Sign out</button>
      </header>

      <main className="p-5 max-w-lg mx-auto">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-base font-semibold text-gray-900">Your cohorts</h2>
          <button onClick={() => setShowForm(v => !v)}
            className="text-sm bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 font-medium">
            {showForm ? 'Cancel' : '+ New cohort'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cohort name</label>
              <input type="text" value={form.name} required placeholder="e.g. Class 11 – A"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.bypass_otp} onChange={e => setForm(f => ({ ...f, bypass_otp: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">Name-only entry (no OTP)</span>
            </label>
            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create cohort'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {cohorts.map(c => {
            const pct = c.student_count > 0 ? Math.round((c.report_count / c.student_count) * 100) : 0;
            return (
              <Link key={c.id} to={`/school/cohorts/${c.id}`}
                className="block bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.student_count} students</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{pct}%</p>
                    <p className="text-xs text-gray-400">with report</p>
                  </div>
                </div>
                {c.student_count > 0 && (
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
          {cohorts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No cohorts yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create your first cohort to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
