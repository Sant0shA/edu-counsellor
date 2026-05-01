import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

/* ─── helpers ─── */
const GRADIENTS = [
  'from-violet-100 to-purple-200', 'from-sky-100 to-blue-200',
  'from-emerald-100 to-teal-200',  'from-rose-100 to-pink-200',
  'from-amber-100 to-orange-200',  'from-indigo-100 to-violet-200',
  'from-cyan-100 to-sky-200',      'from-fuchsia-100 to-purple-200',
];
function initials(name) {
  const p = (name || '?').trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function gradient(name) { return GRADIENTS[(name || '?').charCodeAt(0) % GRADIENTS.length]; }
function statusOf(s) {
  if (s.report_status === 'done') return { label: 'Report Ready', bg: '#eef2ff', color: '#4338ca' };
  if (s.report_status === 'pending' || s.report_status === 'generating') return { label: 'Generating…', bg: '#fffbeb', color: '#d97706' };
  if (s.headline) return { label: 'Assessed', bg: '#e0f2fe', color: '#0369a1' };
  return { label: 'Pending', bg: '#f1f5f9', color: '#94a3b8' };
}

/* ─── ReportButton ─── */
function ReportButton({ student, stopProp }) {
  const [busy, setBusy] = useState(false);
  if (!student.report_queue_id || student.report_status !== 'done') return null;
  async function open(e) {
    if (stopProp) e.stopPropagation();
    setBusy(true);
    try { const d = await schoolApi.getReportUrl(student.report_queue_id); window.open(d.url, '_blank', 'noopener'); }
    catch { alert('Report not available. Try again shortly.'); }
    finally { setBusy(false); }
  }
  return (
    <button onClick={open} disabled={busy}
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
      {busy ? '…' : 'Report'}
    </button>
  );
}

/* ─── StudentModal ─── */
const TAGS = ['Academic', 'Social-Emotional', 'College Prep'];

function StudentModal({ student, onClose }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  const st = statusOf(student);

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
  function tag(t) { setDraft(d => d ? `${d} #${t}` : `#${t} `); ref.current?.focus(); }

  const last = notes?.length ? notes[notes.length - 1] : null;
  const lastDate = last ? new Date(last.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const modal = (
    /* full-screen backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(15,23,42,0.5)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }}>
      {/* modal card */}
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#94a3b8' }}>person</span>
            </div>
            {/* name + badge + headline */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                  {student.display_name}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 10px',
                  borderRadius: 99, background: st.bg, color: st.color,
                }}>
                  {st.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
                {student.headline ? `"${student.headline}"` : 'Assessment not yet completed'}
              </p>
            </div>
            {/* close */}
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 99, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        {/* ── Counselor Notes ── */}
        <div style={{ padding: '0 24px 16px' }}>
          {/* section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1e3a8a' }}>description</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: '#1e3a8a' }}>
                Counselor Notes
              </span>
            </div>
            {lastDate && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Last Entry: {lastDate}</span>
            )}
          </div>

          {/* notes box */}
          <div style={{
            background: '#f0f4ff',
            borderRadius: 12,
            minHeight: 110,
            maxHeight: 160,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {notes === null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 110 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</span>
              </div>
            )}
            {notes?.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 110, padding: '20px 16px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#93c5fd', marginBottom: 8 }}>edit_note</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', margin: 0 }}>
                  No notes yet. Add your first observation below
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Document progress, behavioral changes, or intervention steps.
                </p>
              </div>
            )}
            {notes?.length > 0 && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(n => (
                  <div key={n.id} style={{
                    background: '#fff', borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    padding: '10px 14px',
                    display: 'flex', gap: 10,
                  }}>
                    <div style={{ width: 3, borderRadius: 99, background: '#818cf8', flexShrink: 0, alignSelf: 'stretch' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
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

        {/* ── New Observation ── */}
        <div style={{ padding: '0 24px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            New Observation
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={ref}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Write an observation, action item, or follow-up…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                padding: '12px 14px 28px',
                fontSize: 14, color: '#334155',
                resize: 'none', outline: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#a5b4fc'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <span style={{
              position: 'absolute', bottom: 10, right: 12,
              fontSize: 11, color: '#cbd5e1',
              display: 'flex', alignItems: 'center', gap: 3,
              pointerEvents: 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>sync</span>
              Auto-saving enabled
            </span>
          </div>
        </div>

        {/* ── Tags ── */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => tag(t)} style={{
              fontSize: 12, fontWeight: 500,
              color: '#475569', background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 99, padding: '5px 14px',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#a5b4fc'; e.target.style.color = '#4f46e5'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
            >
              + {t}
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
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
            }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving || !draft.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600,
              color: '#fff', background: saving || !draft.trim() ? '#94a3b8' : '#00236f',
              border: 'none', borderRadius: 10, padding: '9px 20px', cursor: saving || !draft.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ─── StudentCard ─── */
function StudentCard({ student, sameNameCount, onClick }) {
  const ini = initials(student.display_name);
  const grad = gradient(student.display_name);
  const st = statusOf(student);
  const disamb = sameNameCount > 1 && student.domains?.[0]?.name ? student.domains[0].name : null;

  return (
    <div onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: '#334155' }}>{ini}</span>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 leading-tight transition-colors" style={{ fontFamily: 'Sora,sans-serif' }}>
            {student.display_name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {student.session_grade && <span className="text-xs text-slate-400">{student.session_grade}</span>}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </div>
          {disamb && <p className="text-xs text-slate-400 mt-0.5">{disamb}</p>}
        </div>
      </div>
      <div className="flex-1">
        {student.headline
          ? <p className="text-sm text-slate-500 italic leading-snug">"{student.headline}"</p>
          : <p className="text-xs text-slate-300 italic">Assessment not completed</p>
        }
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div onClick={e => e.stopPropagation()}><ReportButton student={student} stopProp /></div>
        <span className="text-xs text-slate-300 group-hover:text-indigo-400 transition-colors">View profile →</span>
      </div>
    </div>
  );
}

/* ─── CohortDetail page ─── */
export default function CohortDetail() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [cohortName, setCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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

  const nameCount = students.reduce((a, s) => { a[s.display_name] = (a[s.display_name] || 0) + 1; return a; }, {});
  const filtered = students.filter(s => !search || (s.display_name || '').toLowerCase().includes(search.toLowerCase()));
  const reportCount = students.filter(s => s.report_status === 'done').length;
  const assessedCount = students.filter(s => s.headline).length;
  const pct = students.length > 0 ? Math.round((reportCount / students.length) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-full bg-slate-50">
      <div className="mb-6">
        <Link to="/school" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          All cohorts
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 24, color: '#0f172a', margin: 0 }}>
              {loading ? '—' : cohortName}
            </h1>
            {!loading && students.length > 0 && (
              <p className="text-sm text-slate-400 mt-1">
                {students.length} student{students.length !== 1 ? 's' : ''} · {assessedCount} assessed · {reportCount} with report
              </p>
            )}
          </div>
          {!loading && students.length > 0 && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, color: '#4338ca' }}>{pct}%</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {students.length > 6 && (
        <div className="relative mb-5">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" style={{ fontSize: 18 }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm placeholder-slate-300" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-44" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <StudentCard key={s.id} student={s} sameNameCount={nameCount[s.display_name] || 1} onClick={() => setSelected(s)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-slate-400">
              {search ? `No students matching "${search}"` : 'No students in this cohort yet.'}
            </div>
          )}
        </>
      )}

      {selected && <StudentModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
