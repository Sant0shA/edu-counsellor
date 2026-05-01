import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

function StatBadge({ value, label, color = 'text-gray-900' }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{school?.name || 'CareerShifu'}</p>
            <p className="text-xs text-gray-400">Welcome, {auth.name}</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem('cs_staff_auth'); window.location.href = '/school/login'; }}
          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors">
          Sign out
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Stats strip */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-5 flex items-center justify-around mb-8">
            <StatBadge value={cohorts.length} label="Cohorts" />
            <div className="w-px h-8 bg-gray-100" />
            <StatBadge value={totalStudents} label="Students" color="text-indigo-600" />
            <div className="w-px h-8 bg-gray-100" />
            <StatBadge value={totalReports} label="Reports ready" color="text-green-600" />
            <div className="w-px h-8 bg-gray-100" />
            <StatBadge
              value={totalStudents > 0 ? `${Math.round((totalReports / totalStudents) * 100)}%` : '—'}
              label="Completion" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Cohorts</h2>
          <button onClick={() => setShowForm(v => !v)}
            className="text-sm bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-700 font-medium transition-colors">
            {showForm ? 'Cancel' : '+ New cohort'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cohort name</label>
              <input type="text" value={form.name} required placeholder="e.g. Class 11 – Science A"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.bypass_otp}
                onChange={e => setForm(f => ({ ...f, bypass_otp: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600" />
              <span className="text-sm text-gray-700">Name-only entry — no email OTP required</span>
            </label>
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create cohort'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map(c => {
              const students = parseInt(c.student_count || 0);
              const reports = parseInt(c.report_count || 0);
              const pct = students > 0 ? Math.round((reports / students) * 100) : 0;
              return (
                <Link key={c.id} to={`/school/cohorts/${c.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{c.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{students} student{students !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>{reports} report{reports !== 1 ? 's' : ''} ready</span>
                      <span>{students - reports} pending</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-indigo-600 font-medium group-hover:underline">View students →</p>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && cohorts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-sm font-medium text-gray-700">No cohorts yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first cohort to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
