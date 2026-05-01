import { useEffect, useState } from 'react';
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

function ReportButton({ student }) {
  const [loading, setLoading] = useState(false);

  if (!student.report_queue_id) return null;

  if (student.report_status !== 'done') {
    return (
      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
        {student.report_status === 'pending' || student.report_status === 'generating' ? 'Generating…' : ''}
      </span>
    );
  }

  async function open() {
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

function NotesPanel({ userId }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await schoolApi.getNotes(userId).catch(() => ({ notes: [] }));
    setNotes(data.notes);
  }

  async function save(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await schoolApi.addNote(userId, draft.trim());
      setDraft('');
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-xl p-3 space-y-3">
      {notes === null && <p className="text-xs text-slate-400">Loading…</p>}
      {notes?.length > 0 && (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="flex gap-2.5">
              <div className="w-1 rounded-full bg-amber-300 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">{n.note}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {n.author} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={save} className="flex gap-2">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={notes?.length === 0 ? 'Add a note…' : 'Add another note…'}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white placeholder-slate-300" />
        <button type="submit" disabled={saving || !draft.trim()}
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-4 py-2 disabled:opacity-40 transition-colors">
          {saving ? '…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function StudentCard({ student, sameNameCount }) {
  const [notesOpen, setNotesOpen] = useState(false);

  const initials = getInitials(student.display_name);
  const gradient = avatarGradient(student.display_name);
  const disambiguator = sameNameCount > 1 && student.domains?.[0]?.name
    ? student.domains[0].name
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <span className="text-slate-700 text-lg font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-base font-semibold text-slate-900 leading-tight">{student.display_name}</p>
            {student.session_grade && (
              <span className="text-xs text-slate-400 shrink-0">{student.session_grade}</span>
            )}
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <ReportButton student={student} />
        <button onClick={() => setNotesOpen(v => !v)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
            notesOpen
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
          }`}
          title="Notes">
          <span className={`material-symbols-outlined ${notesOpen ? 'symbol-fill' : ''}`} style={{ fontSize: '16px' }}>
            sticky_note_2
          </span>
        </button>
      </div>

      {notesOpen && <NotesPanel userId={student.id} />}
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
    <div className="p-6 max-w-6xl mx-auto">
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
    </div>
  );
}
