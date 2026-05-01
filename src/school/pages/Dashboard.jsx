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

function CohortCard({ cohort }) {
  const navigate = useNavigate();
  const students = parseInt(cohort.student_count || 0);
  const reports = parseInt(cohort.report_count || 0);
  const pct = students > 0 ? Math.round((reports / students) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <DonutRing pct={pct} size={80} strokeWidth={6} color="#6366f1" />
          <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-indigo-600 font-sora">
            {pct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-slate-900 leading-tight font-sora">{cohort.name}</p>
          {students > 0 && (
            <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
              pct >= 50
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {pct >= 50 ? 'On Track' : 'Attention Needed'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
        {[
          { label: 'Students', value: students },
          { label: 'Reports', value: reports },
          { label: 'Complete', value: `${pct}%` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold text-slate-800 font-sora">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(`/school/cohorts/${cohort.id}`)}
        className="w-full text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-3 transition-colors font-sora">
        View Progress →
      </button>
    </div>
  );
}

export default function SchoolDashboard() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    schoolApi.getCohorts()
      .then(c => setCohorts(c.cohorts))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = cohorts.reduce((s, c) => s + parseInt(c.student_count || 0), 0);
  const totalReports = cohorts.reduce((s, c) => s + parseInt(c.report_count || 0), 0);
  const pct = totalStudents > 0 ? Math.round((totalReports / totalStudents) * 100) : 0;

  return (
    <div className="p-8 min-h-full bg-slate-50">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Stat strip */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined symbol-fill text-indigo-600" style={{ fontSize: '26px' }}>group</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 font-sora">{totalStudents}</p>
              <p className="text-sm text-slate-400 mt-0.5">Total students</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined symbol-fill text-emerald-600" style={{ fontSize: '26px' }}>task_alt</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 font-sora">{totalReports}</p>
              <p className="text-sm text-slate-400 mt-0.5">Reports ready</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            <div className="relative shrink-0">
              <DonutRing pct={pct} size={56} strokeWidth={5} color="#7c3aed" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-700">
                {pct}%
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 font-sora">{pct}%</p>
              <p className="text-sm text-slate-400 mt-0.5">Overall completion</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Your Cohorts</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-56" />
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-24">
          <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '56px' }}>group</span>
          <p className="text-base text-slate-500 font-semibold mt-4 font-sora">No cohorts yet</p>
          <p className="text-sm text-slate-400 mt-1">Ask your administrator to set up cohorts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cohorts.map(c => <CohortCard key={c.id} cohort={c} />)}
        </div>
      )}
    </div>
  );
}
