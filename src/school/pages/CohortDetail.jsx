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

function StudentModal({ student, onClose }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const initials = getInitials(student.display_name);
  const gradient = avatarGradient(student.display_name);

  useEffect(() => {
    loadNotes();
    // focus input after mount
    setTimeout(() => inputRef.current?.focus(), 100);

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>

      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
              <span className="text-slate-700 text-xl font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{student.display_name}</h2>
              {student.session_grade && (
                <p className="text-sm text-slate-400 mt-0.5">{student.session_grade}</p>
              )}
              {student.headline && (
                <p className="text-sm text-slate-500 italic mt-2 leading-snug">"{student.headline}"</p>
              )}
              {!student.headline && (
                <p className="text-xs text-slate-300 italic mt-2">Assessment not yet completed</p>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 mt-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>

          {student.report_queue_id && (
            <div className="mt-4">
              <ReportButton student={student} stopProp={false} />
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Counselor Notes</p>

          {notes === null && (
            <p className="text-sm text-slate-400">Loading…</p>
          )}

          {notes?.length === 0 && (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-slate-200" style={{ fontSize: '40px' }}>edit_note</span>
              <p className="text-sm text-slate-400 mt-2">No notes yet</p>
              <p className="text-xs text-slate-300 mt-0.5">Add your first observation below</p>
            </div>
          )}

          {notes?.length > 0 && (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <div className="w-1 rounded-full bg-amber-400 shrink-0 mt-0.5" />
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

        {/* Add note form */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <form onSubmit={save} className="space-y-2">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Write an observation, action item, or follow-up…"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white placeholder-slate-300 resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={saving || !draft.trim()}
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 py-2.5 disabled:opacity-40 transition-colors">
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </form>
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

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer group">

      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <span className="text-slate-700 text-lg font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-base font-semibold text-slate-900 group-hover:text-indigo-700 leading-tight transition-colors">
            {student.display_name}
          </p>
          {student.session_grade && (
            <span className="text-xs text-slate-400">{student.session_grade}</span>
          )}
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
            <h1 className="text-2xl font-bold text-slate-900">
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
              <span className="text-sm font-semibold text-indigo-600">{pct}%</span>
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
