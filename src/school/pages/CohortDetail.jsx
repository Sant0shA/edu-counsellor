import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

const DOMAIN_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function DomainChips({ domains }) {
  if (!Array.isArray(domains)) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {domains.slice(0, 3).map((d, i) => (
        <span key={i} className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${DOMAIN_COLORS[i % DOMAIN_COLORS.length]}`}>
          {d.name}
        </span>
      ))}
    </div>
  );
}

function ReportButton({ student }) {
  const [loading, setLoading] = useState(false);

  if (student.report_status !== 'done') {
    return (
      <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${
        student.report_status === 'pending' || student.report_status === 'generating'
          ? 'bg-amber-50 text-amber-600'
          : 'bg-gray-100 text-gray-400'
      }`}>
        {student.report_status === 'pending' || student.report_status === 'generating' ? 'Generating…' : 'No report'}
      </span>
    );
  }

  if (!student.report_queue_id) return (
    <span className="text-xs rounded-full px-2.5 py-1 font-medium bg-green-50 text-green-600">Report ready</span>
  );

  async function openReport() {
    setLoading(true);
    try {
      const data = await schoolApi.getReportUrl(student.report_queue_id);
      window.open(data.url, '_blank', 'noopener');
    } catch {
      alert('Report not available yet. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={openReport} disabled={loading}
      className="text-xs rounded-full px-2.5 py-1 font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-60 flex items-center gap-1">
      {loading ? '…' : '↗ View report'}
    </button>
  );
}

function NotesPanel({ userId }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await schoolApi.getNotes(userId).catch(() => ({ notes: [] }));
    setNotes(data.notes);
  }

  async function addNote(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await schoolApi.addNote(userId, draft.trim());
      setDraft('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (notes === null) {
    return (
      <button onClick={load} className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline font-medium mt-1">
        Load notes
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
              <p className="text-xs text-gray-400 mt-1">{n.author} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addNote} className="flex gap-2">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={notes.length === 0 ? 'Add a note about this student…' : 'Add another note…'}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        <button type="submit" disabled={saving || !draft.trim()}
          className="text-sm bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors">
          {saving ? '…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function StudentRow({ student }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-indigo-600 text-sm font-semibold">
              {student.display_name?.charAt(0) || '?'}
            </span>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{student.display_name}</p>
              {student.session_grade && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                  {student.session_grade}
                </span>
              )}
            </div>

            {student.headline ? (
              <p className="text-sm text-gray-500 mt-0.5 italic">"{student.headline}"</p>
            ) : (
              <p className="text-xs text-gray-300 mt-0.5 italic">Not assessed yet</p>
            )}

            {student.domains && (
              <div className="mt-2">
                <DomainChips domains={student.domains} />
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <ReportButton student={student} />
            <button onClick={() => setExpanded(v => !v)}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">
              {expanded ? 'Hide notes ▲' : 'Notes ▼'}
            </button>
          </div>
        </div>

        {expanded && <NotesPanel userId={student.id} />}
      </div>
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

  const filtered = students.filter(s =>
    !search || (s.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const reportCount = students.filter(s => s.report_status === 'done').length;
  const assessedCount = students.filter(s => s.headline).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/school" className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors">
            ← Back to cohorts
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {loading ? 'Loading…' : `${students.length} students`}
            </h1>
            {!loading && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <span className="font-semibold text-gray-900">{assessedCount}</span>
                  <span className="text-gray-400 ml-1">assessed</span>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="text-center">
                  <span className="font-semibold text-green-600">{reportCount}</span>
                  <span className="text-gray-400 ml-1">with report</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Search */}
        {students.length > 0 && (
          <div className="relative mb-5">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students by name…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
                ×
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 bg-gray-100 rounded-full w-20" />
                      <div className="h-5 bg-gray-100 rounded-full w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => <StudentRow key={s.id} student={s} />)}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500">{search ? `No students matching "${search}"` : 'No students in this cohort yet.'}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
