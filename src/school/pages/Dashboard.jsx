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
  const auth = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();

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

  const totalStudents = cohorts.reduce((s, c) => s + parseInt(c.student_count || 0), 0);
  const totalReports = cohorts.reduce((s, c) => s + parseInt(c.report_count || 0), 0);
  const pct = totalStudents > 0 ? Math.round((totalReports / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">CS</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{school?.name || 'CareerShifu'}</p>
              <p className="text-xs text-gray-400">{auth.name}</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('cs_staff_auth'); window.location.href = '/school/login'; }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Summary strip */}
        {!loading && totalStudents > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 mb-8 flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-400 mt-0.5">students</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <p className="text-2xl font-bold text-green-600">{totalReports}</p>
              <p className="text-xs text-gray-400 mt-0.5">reports ready</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-400">Overall completion</p>
                <p className="text-xs font-semibold text-indigo-600">{pct}%</p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cohorts</h2>
          <button onClick={() => setShowForm(v => !v)}
            className={`text-sm font-medium rounded-xl px-4 py-2 transition-colors ${
              showForm
                ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                : 'text-white bg-indigo-600 hover:bg-indigo-700'
            }`}>
            {showForm ? 'Cancel' : '+ New cohort'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Cohort name</label>
              <input type="text" value={form.name} required placeholder="e.g. Class 11 – Science A"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={form.bypass_otp}
                onChange={e => setForm(f => ({ ...f, bypass_otp: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600" />
              <span className="text-sm text-gray-600">Name-only sign-in (no email/OTP required)</span>
            </label>
            <button type="submit" disabled={saving}
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 py-2.5 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create cohort'}
            </button>
          </form>
        )}

        {/* Cohort list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500 font-medium">No cohorts yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first cohort to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cohorts.map(c => {
              const students = parseInt(c.student_count || 0);
              const reports = parseInt(c.report_count || 0);
              const p = students > 0 ? Math.round((reports / students) * 100) : 0;
              return (
                <Link key={c.id} to={`/school/cohorts/${c.id}`}
                  className="group flex items-center gap-5 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-indigo-200 hover:shadow-sm transition-all">

                  {/* Donut-style % */}
                  <div className="shrink-0 relative w-12 h-12">
                    <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#EEF0F8" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#6366f1" strokeWidth="3"
                        strokeDasharray={`${p * 0.942} 94.2`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {p}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {students} student{students !== 1 ? 's' : ''} · {reports} report{reports !== 1 ? 's' : ''} ready
                    </p>
                  </div>

                  <svg className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
