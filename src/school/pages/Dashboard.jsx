import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

function DonutRing({ pct, size = 80, strokeWidth = 4, color = '#6366f1' }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={center} cy={center} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ icon, label, value, iconBg, iconColor, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      {children || (
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined symbol-fill ${iconColor}`} style={{ fontSize: '22px' }}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function CohortCard({ cohort }) {
  const navigate = useNavigate();
  const students = parseInt(cohort.student_count || 0);
  const reports = parseInt(cohort.report_count || 0);
  const pct = students > 0 ? Math.round((reports / students) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0">
          <DonutRing pct={pct} size={72} strokeWidth={5} color="#6366f1" />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
            {pct}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900 leading-tight">{cohort.name}</p>
          {students > 0 && (
            <span className={`mt-1.5 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
              pct >= 50
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {pct >= 50 ? 'On Track' : 'Attention Needed'}
            </span>
          )}
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {[
          { label: 'Students', value: students },
          { label: 'Reports', value: reports },
          { label: 'Complete', value: `${pct}%` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(`/school/cohorts/${cohort.id}`)}
        className="w-full text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-2.5 transition-colors">
        View Progress →
      </button>
    </div>
  );
}

export default function SchoolDashboard() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bypass_otp: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    schoolApi.getCohorts()
      .then(c => setCohorts(c.cohorts))
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
    <div className="p-6 max-w-5xl mx-auto min-h-full bg-slate-50">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Stat cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon="group" label="Total students" value={totalStudents}
            iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard icon="assessment" label="Reports ready" value={totalReports}
            iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <DonutRing pct={pct} size={48} strokeWidth={4} color="#7c3aed" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-700">
                {pct}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pct}%</p>
              <p className="text-xs text-slate-400 mt-0.5">Overall completion</p>
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Cohorts</h2>
        <button onClick={() => setShowForm(v => !v)}
          className={`text-sm font-medium rounded-xl px-4 py-2 transition-colors ${
            showForm
              ? 'text-slate-500 bg-slate-100 hover:bg-slate-200'
              : 'text-white bg-indigo-600 hover:bg-indigo-700'
          }`}>
          {showForm ? 'Cancel' : '+ New cohort'}
        </button>
      </div>

      {/* New cohort form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Cohort name</label>
            <input type="text" value={form.name} required placeholder="e.g. Class 11 – Science A"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.bypass_otp}
              onChange={e => setForm(f => ({ ...f, bypass_otp: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600" />
            <span className="text-sm text-slate-600">Name-only sign-in (no email/OTP required)</span>
          </label>
          <button type="submit" disabled={saving}
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 py-2.5 disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create cohort'}
          </button>
        </form>
      )}

      {/* Cohort grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '48px' }}>group</span>
          <p className="text-sm text-slate-500 font-medium mt-3">No cohorts yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first cohort to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohorts.map(c => <CohortCard key={c.id} cohort={c} />)}
        </div>
      )}
    </div>
  );
}
