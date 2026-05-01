import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

const GRADIENTS = [
  'from-violet-100 to-purple-200',
  'from-sky-100 to-blue-200',
  'from-emerald-100 to-teal-200',
  'from-rose-100 to-pink-200',
  'from-amber-100 to-orange-200',
  'from-indigo-100 to-violet-200',
  'from-cyan-100 to-sky-200',
  'from-fuchsia-100 to-purple-200',
];

function getInitials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(name) {
  return GRADIENTS[(name || '?').charCodeAt(0) % GRADIENTS.length];
}

function studentStatus(student) {
  if (student.report_status === 'done') return { label: 'Report Ready', cls: 'bg-indigo-50 text-indigo-600' };
  if (student.report_status === 'pending' || student.report_status === 'generating') return { label: 'Generating…', cls: 'bg-amber-50 text-amber-600' };
  if (student.headline) return { label: 'Assessed', cls: 'bg-sky-50 text-sky-600' };
  return { label: 'Pending', cls: 'bg-slate-100 text-slate-400' };
}

function ReportButton({ student, stopProp }) {
  const [loading, setLoading] = useState(false);

  if (!student.report_queue_id) return null;

  if (student.report_status !== 'done') {
    return (
      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
        {student.report_status === 'pending' || student.report_status === 'generating' ? 'Generating…' : ''}
      </span>
    );
  }

  async function open(e) {
    if (stopProp) e.stopPropagation();
    setLoading(true);
    try {
      const data = await schoolApi.getReportUrl(student.report_queue_id);
      window.open(data.url, '_blank', 'noopener');
    } catch {
      alert('Report not available. Try again shortly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={open} disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap">
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>open_in_new</span>
      {loading ? '…' : 'Report'}
    </button>
  );
}

const NOTE_TAGS = ['Academic', 'Social-Emotional', 'College Prep'];

function StudentModal({ student, onClose }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const status = studentStatus(student);

  useEffect(() => {
    loadNotes();
    setTimeout(() => inputRef.current?.focus(), 100);
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [student.id]);

  async function loadNotes() {
    const data = await schoolApi.getNotes(student.id).catch(() => ({ notes: [] }));
    setNotes(data.notes);
  }

  async function save(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await schoolApi.addNote(student.id, draft.trim());
      setDraft('');
      loadNotes();
    } finally {
      setSaving(false);
    }
  }

  function insertTag(tag) {
    setDraft(d => d ? `${d} #${tag}` : `#${tag} `);
    inputRef.current?.focus();
  }

  const lastNote = notes?.length > 0 ? notes[notes.length - 1] : null;
  const lastEntryDate = lastNote
    ? new Date(lastNote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)' }}>

      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            {/* Icon avatar */}
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '24px' }}>person</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 font-sora leading-tight">{student.display_name}</h2>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
              </div>
              {student.headline ? (
                <p className="text-xs text-slate-400 italic mt-1 leading-snug">"{student.headline}"</p>
              ) : (
                <p className="text-xs text-slate-300 italic mt-1">Assessment not yet completed</p>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        </div>

        {/* ── Counselor Notes section ── */}
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#1E3A8A]" style={{ fontSize: '16px' }}>description</span>
              <span className="text-sm font-semibold text-[#1E3A8A] font-sora">Counselor Notes</span>
            </div>
            {lastEntryDate && (
              <span className="text-xs text-slate-400">Last Entry: {lastEntryDate}</span>
            )}
          </div>

          {/* Notes list or empty state */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 overflow-y-auto" style={{ minHeight: '120px', maxHeight: '180px' }}>
            {notes === null && (
              <div className="flex items-center justify-center h-28">
                <p className="text-sm text-slate-400">Loading…</p>
              </div>
            )}

            {notes?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <span className="material-symbols-outlined text-[#1E3A8A]/30" style={{ fontSize: '32px' }}>edit_note</span>
                <p className="text-sm font-medium text-slate-500 mt-2">No notes yet. Add your first observation below</p>
                <p className="text-xs text-slate-400 mt-1">Document progress, behavioral changes, or intervention steps.</p>
              </div>
            )}

            {notes?.length > 0 && (
              <div className="p-3 space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="flex gap-2.5 bg-white border border-slate-100 rounded-lg px-3 py-2.5">
                    <div className="w-0.5 rounded-full bg-indigo-300 shrink-0 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{n.note}</p>
                      <p className="text-xs text-slate-400 mt-1">
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
        <div className="px-6 pb-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">New Observation</p>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Write an observation, action item, or follow-up…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white placeholder-slate-300 resize-none leading-relaxed"
            />
            <span className="absolute bottom-3 right-3 text-[10px] text-slate-300 flex items-center gap-1 pointer-events-none">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>sync</span>
              Auto-saving enabled
            </span>
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {NOTE_TAGS.map(tag => (
            <button key={tag} type="button" onClick={() => insertTag(tag)}
              className="text-xs font-medium text-slate-500 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-full px-3 py-1.5 transition-colors">
              + {tag}
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>history</span>
            View History
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#00236f] hover:bg-[#001a52] rounded-xl px-5 py-2 disabled:opacity-40 transition-colors font-sora">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>save</span>
              {saving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentCard({ student, sameNameCount, onClick }) {
  const initials = getInitials(student.display_name);
  const gradient = avatarGradient(student.display_name);
  const disambiguator = sameNameCount > 1 && student.domains?.[0]?.name
    ? student.domains[0].name
    : null;
  const status = studentStatus(student);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer group">

      {/* Avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <span className="text-slate-700 text-lg font-bold font-sora">{initials}</span>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-base font-semibold text-slate-900 group-hover:text-indigo-700 leading-tight transition-colors font-sora">
            {student.display_name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {student.session_grade && (
              <span className="text-xs text-slate-400">{student.session_grade}</span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
          </div>
          {disambiguator && (
            <p className="text-xs text-slate-400 mt-0.5">{disambiguator}</p>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="flex-1">
        {student.headline ? (
          <p className="text-sm text-slate-500 italic leading-snug">"{student.headline}"</p>
        ) : (
          <p className="text-xs text-slate-300 italic">Assessment not completed</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div onClick={e => e.stopPropagation()}>
          <ReportButton student={student} stopProp />
        </div>
        <span className="text-xs text-slate-300 group-hover:text-indigo-400 transition-colors">
          View profile →
        </span>
      </div>
    </div>
  );
}

export default function CohortDetail() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [cohortName, setCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    Promise.all([schoolApi.getStudents(id), schoolApi.getCohorts()])
      .then(([d, cd]) => {
        setStudents(d.students);
        const cohort = cd.cohorts.find(c => String(c.id) === String(id));
        setCohortName(cohort?.name || `Cohort ${id}`);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const nameCount = students.reduce((acc, s) => {
    acc[s.display_name] = (acc[s.display_name] || 0) + 1;
    return acc;
  }, {});

  const filtered = students.filter(s =>
    !search || (s.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const reportCount = students.filter(s => s.report_status === 'done').length;
  const assessedCount = students.filter(s => s.headline).length;
  const pct = students.length > 0 ? Math.round((reportCount / students.length) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-full bg-slate-50">
      {/* Page header */}
      <div className="mb-6">
        <Link to="/school" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors font-medium mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          All cohorts
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-sora">
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
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-semibold text-indigo-600 font-sora">{pct}%</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {/* Search */}
      {students.length > 6 && (
        <div className="relative mb-5">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" style={{ fontSize: '18px' }}>search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm placeholder-slate-300" />
        </div>
      )}

      {/* Student grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                sameNameCount={nameCount[s.display_name] || 1}
                onClick={() => setSelectedStudent(s)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-slate-400">
              {search ? `No students matching "${search}"` : 'No students in this cohort yet.'}
            </div>
          )}
        </>
      )}

      {/* Student modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
