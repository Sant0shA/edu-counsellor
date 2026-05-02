import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

/* ─── Donut ring SVG ─── */
function DonutRing({ pct, size = 80, strokeWidth = 6, color = '#1e3a8a' }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Stat card ─── */
function StatCard({ icon, iconBg, iconColor, value, label }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 24, color: iconColor,
          fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}>
          {icon}
        </span>
      </div>
      <div>
        <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#0f172a', margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Cohort card ─── */
function CohortCard({ cohort }) {
  const navigate = useNavigate();
  const students = parseInt(cohort.student_count || 0);
  const reports = parseInt(cohort.report_count || 0);
  const pct = students > 0 ? Math.round((reports / students) * 100) : 0;
  const onTrack = pct >= 50;

  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,35,111,0.10)'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      {/* Top row: donut + name + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <DonutRing pct={pct} size={80} strokeWidth={7} color={onTrack ? '#15803d' : '#d97706'} />
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15,
            color: onTrack ? '#15803d' : '#d97706',
          }}>{pct}%</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>
            {cohort.name}
          </p>
          {students > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              padding: '4px 10px', borderRadius: 4,
              background: onTrack ? '#dcfce7' : '#fef9c3',
              color: onTrack ? '#15803d' : '#a16207',
              border: `1px solid ${onTrack ? '#bbf7d0' : '#fde68a'}`,
            }}>
              {onTrack ? 'ON TRACK' : 'ATTENTION NEEDED'}
            </span>
          )}
        </div>
      </div>

      {/* Mini stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 20,
      }}>
        {[
          { label: 'Students', value: students },
          { label: 'Reports', value: reports },
          { label: 'Complete', value: `${pct}%` },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: '#0f172a', margin: 0 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate(`/school/cohorts/${cohort.id}`)}
        style={{
          width: '100%', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 13,
          color: '#00236f', background: '#eef2ff',
          border: 'none', borderRadius: 10, padding: '11px 0', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.target.style.background = '#e0e7ff'}
        onMouseLeave={e => e.target.style.background = '#eef2ff'}
      >
        View Progress →
      </button>
    </div>
  );
}

/* ─── Dashboard page ─── */
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
  const overallPct = totalStudents > 0 ? Math.round((totalReports / totalStudents) * 100) : 0;

  return (
    <div style={{ padding: 32, minHeight: '100%', background: '#f8faff', boxSizing: 'border-box' }}>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: '#0f172a', margin: '0 0 4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Overview of all cohorts and student progress
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── Stat strip ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="group" iconBg="#eef2ff" iconColor="#4338ca" value={totalStudents} label="Total students" />
          <StatCard icon="task_alt" iconBg="#f0fdf4" iconColor="#15803d" value={totalReports} label="Reports ready" />
          <StatCard icon="trending_up" iconBg="#f0f9ff" iconColor="#0369a1" value={`${overallPct}%`} label="Overall completion" />
        </div>
      )}

      {/* ── Overall progress bar ── */}
      {!loading && totalStudents > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '20px 24px', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' }}>
                Overall Progress
              </span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1e3a8a' }}>
                {overallPct}%
              </span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: '#1e3a8a', borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>
              {totalReports} of {totalStudents} students have completed reports
            </p>
          </div>
        </div>
      )}

      {/* ── Cohorts section ── */}
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', margin: '0 0 16px' }}>
        Your Cohorts
      </p>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', height: 220 }} />
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 52, color: '#cbd5e1' }}>group</span>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#64748b', margin: '16px 0 4px' }}>
            No cohorts yet
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Ask your administrator to set up cohorts.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {cohorts.map(c => <CohortCard key={c.id} cohort={c} />)}
        </div>
      )}
    </div>
  );
}
