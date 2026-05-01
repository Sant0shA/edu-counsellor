import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

function ReportButton({ student }) {
  const [loading, setLoading] = useState(false);

  if (!student.report_queue_id) return null;

  if (student.report_status !== 'done') {
    return (
      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
        {student.report_status === 'pending' || student.report_status === 'generating'
          ? 'Generating…' : ''}
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
      className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3 py-1 transition-colors disabled:opacity-50 whitespace-nowrap">
      {loading ? '…' : '↗ Report'}
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
    <div className="px-5 pb-4 pt-1 border-t border-gray-50 space-y-3">
      {notes === null && <p className="text-xs text-gray-400">Loading…</p>}
      {notes?.length > 0 && (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="flex gap-3">
              <div className="w-1 rounded-full bg-amber-300 shrink-0" />
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                <p className="text-xs text-gray-400 mt-0.5">
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
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 placeholder-gray-400" />
        <button type="submit" disabled={saving || !draft.trim()}
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 disabled:opacity-40 transition-colors">
          {saving ? '…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function StudentRow({ student, sameNameCount }) {
  const [notesOpen, setNotesOpen] = useState(false);

  // Show one domain descriptor only when there's a name collision
  const disambiguator = sameNameCount > 1 && student.domains?.[0]?.name
    ? student.domains[0].name
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="px-5 py-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-indigo-700 text-sm font-bold">
            {(student.display_name || '?').charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{student.display_name}</p>
            {student.session_grade && (
              <span className="text-xs text-gray-400">{student.session_grade}</span>
            )}
          </div>

          {student.headline ? (
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              <span className="italic">"{student.headline}"</span>
            </p>
          ) : (
            <p className="text-xs text-gray-300 mt-0.5 italic">Assessment not completed</p>
          )}

          {disambiguator && (
            <p className="text-xs text-gray-400 mt-1">{disambiguator}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          <ReportButton student={student} />
          <button onClick={() => setNotesOpen(v => !v)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
              notesOpen
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200'
            }`}
            title="Notes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      {notesOpen && <NotesPanel userId={student.id} />}
    </div>
  );
}

export default function CohortDetail() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    schoolApi.getStudents(id)
      .then(d => setStudents(d.students))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Count how many students share each name (for disambiguation)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/school" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Cohorts
          </Link>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {loading ? '—' : `${students.length} students`}
              </h1>
              {!loading && students.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {assessedCount} assessed · {reportCount} with report
                </p>
              )}
            </div>
            {!loading && students.length > 0 && (
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-indigo-600">{pct}%</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {students.length > 6 && (
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm placeholder-gray-300" />
          </div>
        )}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              </div>
            </div>
          ))
        ) : (
          <>
            {filtered.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                sameNameCount={nameCount[s.display_name] || 1}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-sm text-gray-400">
                {search ? `No students matching "${search}"` : 'No students in this cohort yet.'}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
