import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

function DomainChips({ domains }) {
  if (!domains) return null;
  const list = Array.isArray(domains) ? domains : [];
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.slice(0, 3).map((d, i) => (
        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
          {d.name}
        </span>
      ))}
    </div>
  );
}

function ReportBadge({ status }) {
  if (status === 'done') return <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 font-medium">Report ready</span>;
  if (status === 'pending' || status === 'generating') return <span className="text-xs bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 font-medium">Generating…</span>;
  return <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">No report</span>;
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

  if (notes === null) return (
    <button onClick={load} className="text-xs text-indigo-600 hover:underline mt-2">
      Load notes
    </button>
  );

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="space-y-2 mb-3">
        {notes.map(n => (
          <div key={n.id} className="bg-amber-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-700">{n.note}</p>
            <p className="text-xs text-gray-400 mt-1">{n.author} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-xs text-gray-400">No notes yet.</p>}
      </div>
      <form onSubmit={addNote} className="flex gap-2">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a note…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button type="submit" disabled={saving || !draft.trim()}
          className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50">
          {saving ? '…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

function StudentRow({ student }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{student.display_name}</p>
            {student.session_grade && <span className="text-xs text-gray-400">Grade {student.session_grade}</span>}
            <ReportBadge status={student.report_status} />
          </div>
          {student.headline && (
            <p className="text-xs text-gray-500 mt-1 italic">"{student.headline}"</p>
          )}
          <DomainChips domains={student.domains} />
        </div>
        <button onClick={() => setExpanded(v => !v)} className="shrink-0 text-xs text-gray-400 hover:text-indigo-600 mt-0.5">
          {expanded ? 'Hide notes ▲' : 'Notes ▼'}
        </button>
      </div>
      {expanded && <NotesPanel userId={student.id} />}
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
    !search || s.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const reportCount = students.filter(s => s.report_status === 'done').length;
  const assessedCount = students.filter(s => s.headline).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <Link to="/school" className="text-xs text-gray-400 hover:underline">← Cohorts</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-base font-semibold text-gray-900">
            {students.length > 0 ? `${students.length} students` : 'Students'}
          </h1>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>{assessedCount} assessed</span>
            <span>{reportCount} with report</span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {students.length > 5 && (
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        )}

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => <StudentRow key={s.id} student={s} />)}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">{search ? 'No match.' : 'No students in this cohort yet.'}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
