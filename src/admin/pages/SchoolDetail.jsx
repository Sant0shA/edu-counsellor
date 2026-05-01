import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../utils/adminApi';

function CohortCard({ cohort }) {
  const url = `${window.location.origin}?cohort=${cohort.access_token}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{cohort.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{cohort.student_count} students · {cohort.bypass_otp ? 'Name-only entry' : 'OTP sign-in'}</p>
          <p className="text-xs text-gray-400 truncate mt-1 font-mono">{url}</p>
        </div>
        <button onClick={copy} className="shrink-0 text-xs text-indigo-600 hover:underline">
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

export default function SchoolDetail() {
  const { id } = useParams();
  const [school, setSchool] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [tab, setTab] = useState('cohorts');
  const [loading, setLoading] = useState(true);
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortForm, setCohortForm] = useState({ name: '', bypass_otp: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminApi.getSchool(id), adminApi.getCohorts(id)])
      .then(([s, c]) => { setSchool(s.school); setCohorts(c.cohorts); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreateCohort(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await adminApi.createCohort(id, cohortForm);
      setCohorts(prev => [data.cohort, ...prev]);
      setShowCohortForm(false);
      setCohortForm({ name: '', bypass_otp: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  if (!school) return <div className="p-6 text-sm text-red-600">{error || 'School not found'}</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-1">
        <Link to="/admin/schools" className="text-xs text-gray-400 hover:underline">← Schools</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{school.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{school.city || '—'} · {school.contact_email || '—'}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${school.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {school.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {['cohorts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t} ({cohorts.length})
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span />
        <button onClick={() => setShowCohortForm(v => !v)}
          className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 font-medium">
          {showCohortForm ? 'Cancel' : '+ Add cohort'}
        </button>
      </div>

      {showCohortForm && (
        <form onSubmit={handleCreateCohort} className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">New cohort</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cohort name *</label>
            <input type="text" value={cohortForm.name} required placeholder="e.g. Class 11 – A"
              onChange={e => setCohortForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={cohortForm.bypass_otp}
              onChange={e => setCohortForm(f => ({ ...f, bypass_otp: e.target.checked }))}
              className="rounded" />
            <span className="text-sm text-gray-700">Name-only entry (no OTP required)</span>
          </label>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create cohort'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {cohorts.map(c => <CohortCard key={c.id} cohort={c} />)}
        {cohorts.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">No cohorts yet.</p>}
      </div>
    </div>
  );
}
