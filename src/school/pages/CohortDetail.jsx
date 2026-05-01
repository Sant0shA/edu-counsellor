import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

/* ─── Avatar colours ─── */
const AVATAR_COLORS = [
  { bg: '#0e7490', text: '#fff' }, // cyan
  { bg: '#1e3a8a', text: '#fff' }, // navy
  { bg: '#7c3aed', text: '#fff' }, // violet
  { bg: '#0d9488', text: '#fff' }, // teal
  { bg: '#b45309', text: '#fff' }, // amber
  { bg: '#be185d', text: '#fff' }, // pink
  { bg: '#047857', text: '#fff' }, // emerald
  { bg: '#4338ca', text: '#fff' }, // indigo
];
function avatarColor(name) { return AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length]; }
function initials(name) {
  const p = (name || '?').trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/* ─── Status ─── */
function statusOf(s) {
  if (s.report_status === 'done')
    return { label: 'ON TRACK', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
  if (s.report_status === 'pending' || s.report_status === 'generating')
    return { label: 'GENERATING', bg: '#fef9c3', color: '#a16207', border: '#fde68a' };
  if (s.headline)
    return { label: 'ASSESSED', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' };
  return { label: 'PENDING', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
}

/* ─── ReportButton (outlined) ─── */
function ReportButton({ student }) {
  const [busy, setBusy] = useState(false);
  if (!student.report_queue_id || student.report_status !== 'done') return null;

  async function open(e) {
    e.stopPropagation();
    setBusy(true);
    try {
      const d = await schoolApi.getReportUrl(student.report_queue_id);
      window.open(d.url, '_blank', 'noopener');
    } catch { alert('Report not available. Try again shortly.'); }
    finally { setBusy(false); }
  }

  return (
    <button onClick={open} disabled={busy} style={{
      fontSize: 13, fontWeight: 600, color: '#00236f',
      background: '#fff', border: '1.5px solid #00236f',
      borderRadius: 8, padding: '8px 16px', cursor: busy ? 'wait' : 'pointer',
      whiteSpace: 'nowrap', opacity: busy ? 0.6 : 1,
    }}>
      {busy ? '…' : 'Report'}
    </button>
  );
}

/* ─── StudentCard ─── */
function StudentCard({ student, onClick }) {
  const ini = initials(student.display_name);
  const ac = avatarColor(student.display_name);
  const st = statusOf(student);
  const hasReport = student.report_queue_id && student.report_status === 'done';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,35,111,0.10)'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      {/* Avatar + name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 99,
          background: ac.bg, color: ac.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15,
          flexShrink: 0,
        }}>{ini}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {student.display_name}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
              padding: '3px 8px', borderRadius: 4,
              background: st.bg, color: st.color,
              border: `1px solid ${st.border}`,
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>{st.label}</span>
          </div>
          {student.session_grade && (
            <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>{student.session_grade}</p>
          )}
        </div>
      </div>

      {/* Headline */}
      <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 1.55, margin: 0, flex: 1, minHeight: 40 }}>
        {student.headline
          ? `"${student.headline}"`
          : <span style={{ color: '#cbd5e1', fontStyle: 'normal' }}>Assessment not completed</span>
        }
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClick}
          style={{
            flex: 1, fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
            color: '#fff', background: '#00236f',
            border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer',
          }}
          onMouseEnter={e => e.target.style.background = '#001a52'}
          onMouseLeave={e => e.target.style.background = '#00236f'}
        >
          View Profile
        </button>
        {hasReport && <ReportButton student={student} />}
      </div>
    </div>
  );
}

/* ─── StudentModal (portal, inline styles) ─── */
const TAGS = ['Academic', 'Social-Emotional', 'College Prep'];

function StudentModal({ student, onClose }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  const st = statusOf(student);
  const ac = avatarColor(student.display_name);
  const ini = initials(student.display_name);

  useEffect(() => {
    load();
    setTimeout(() => ref.current?.focus(), 80);
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [student.id]);

  async function load() {
    const d = await schoolApi.getNotes(student.id).catch(() => ({ notes: [] }));
    setNotes(d.notes);
  }
  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    try { await schoolApi.addNote(student.id, draft.trim()); setDraft(''); load(); }
    finally { setSaving(false); }
  }
  function insertTag(t) { setDraft(d => d ? `${d} #${t}` : `#${t} `); ref.current?.focus(); }

  const last = notes?.length ? notes[notes.length - 1] : null;
  const lastDate = last ? new Date(last.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      background: 'rgba(15,23,42,0.5)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%', maxWidth: 500,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: ac.bg, color: ac.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15,
              flexShrink: 0,
            }}>{ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                  {student.display_name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  padding: '3px 10px', borderRadius: 4,
                  background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                }}>{st.label}</span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
                {student.headline ? `"${student.headline}"` : 'Assessment not yet completed'}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 99, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        {/* Counselor Notes */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1e3a8a' }}>description</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#1e3a8a' }}>Counselor Notes</span>
            </div>
            {lastDate && <span style={{ fontSize: 12, color: '#94a3b8' }}>Last Entry: {lastDate}</span>}
          </div>
          <div style={{
            background: '#f0f4ff', borderRadius: 12,
            minHeight: 110, maxHeight: 160, overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            {notes === null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 110 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</span>
              </div>
            )}
            {notes?.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 110, padding: '20px 16px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#93c5fd', marginBottom: 8 }}>edit_note</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', margin: 0 }}>No notes yet. Add your first observation below</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Document progress, behavioral changes, or intervention steps.</p>
              </div>
            )}
            {notes?.length > 0 && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(n => (
                  <div key={n.id} style={{
                    background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
                    padding: '10px 14px', display: 'flex', gap: 10,
                  }}>
                    <div style={{ width: 3, borderRadius: 99, background: '#818cf8', flexShrink: 0, alignSelf: 'stretch' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: 0 }}>{n.note}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {n.author} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Observation */}
        <div style={{ padding: '0 24px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            New Observation
          </p>
          <div style={{ position: 'relative' }}>
            <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
              placeholder="Write an observation, action item, or follow-up…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                padding: '12px 14px 28px', fontSize: 14, color: '#334155',
                resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#a5b4fc'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <span style={{
              position: 'absolute', bottom: 10, right: 12,
              fontSize: 11, color: '#cbd5e1',
              display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>sync</span>
              Auto-saving enabled
            </span>
          </div>
        </div>

        {/* Tags */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => insertTag(t)} style={{
              fontSize: 12, fontWeight: 500, color: '#475569',
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 99, padding: '5px 14px', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#a5b4fc'; e.target.style.color = '#4f46e5'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
            >+ {t}</button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: '#475569',
            background: '#fff', border: '1.5px solid #e2e8f0',
            borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>history</span>
            View History
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={{
              fontSize: 13, fontWeight: 500, color: '#64748b',
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px',
            }}>Cancel</button>
            <button onClick={save} disabled={saving || !draft.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
              color: '#fff', background: saving || !draft.trim() ? '#94a3b8' : '#00236f',
              border: 'none', borderRadius: 10, padding: '9px 20px',
              cursor: saving || !draft.trim() ? 'not-allowed' : 'pointer',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── CohortDetail page ─── */
const STATUS_OPTIONS = ['All Status', 'ON TRACK', 'ASSESSED', 'GENERATING', 'PENDING'];

export default function CohortDetail() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [cohortName, setCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([schoolApi.getStudents(id), schoolApi.getCohorts()])
      .then(([d, cd]) => {
        setStudents(d.students);
        const c = cd.cohorts.find(c => String(c.id) === String(id));
        setCohortName(c?.name || `Cohort ${id}`);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const reportCount = students.filter(s => s.report_status === 'done').length;
  const assessedCount = students.filter(s => s.headline).length;
  const pct = students.length > 0 ? Math.round((reportCount / students.length) * 100) : 0;

  const filtered = students.filter(s => {
    const matchSearch = !search || (s.display_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || statusOf(s).label === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: 32, minHeight: '100%', background: '#f8faff', boxSizing: 'border-box' }}>

      {/* ── Breadcrumb ── */}
      <Link to="/school" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 20,
        fontWeight: 500,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        All Cohorts
      </Link>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: '#0f172a', margin: '0 0 8px' }}>
            {loading ? '—' : cohortName}
          </h1>
          {!loading && students.length > 0 && (
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4, color: '#94a3b8' }}>group</span>
              {students.length} Active Students
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
              {assessedCount} Assessed
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
              {reportCount} Reports Ready
            </p>
          )}
        </div>

        {/* Progress block */}
        {!loading && students.length > 0 && (
          <div style={{ minWidth: 220, textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Cohort Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', marginBottom: 6 }}>
              <div style={{ width: 160, height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#1e3a8a', borderRadius: 99 }} />
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#1e3a8a' }}>{pct}%</span>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              Goal: All students complete assessment by end of term
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Filter bar ── */}
      {!loading && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
            }}>search</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter students by name, level, or status…"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                fontSize: 13, color: '#334155',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#a5b4fc'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{
              fontSize: 13, fontWeight: 500, color: '#334155',
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '10px 14px', cursor: 'pointer', outline: 'none',
            }}
          >
            {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>

          {/* Sort label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: '#334155',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '10px 14px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#94a3b8' }}>sort</span>
            Sort: Name
          </div>
        </div>
      )}

      {/* ── Student grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', height: 200, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(s => (
              <StudentCard key={s.id} student={s} onClick={() => setSelected(s)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontSize: 14 }}>
              {search || statusFilter !== 'All Status'
                ? 'No students match this filter.'
                : 'No students in this cohort yet.'}
            </div>
          )}
        </>
      )}

      {selected && <StudentModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
