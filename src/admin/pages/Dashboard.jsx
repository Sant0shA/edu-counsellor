import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../utils/adminApi';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [schools, setSchools] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getSchools().then(d => setSchools(d.schools)).catch(e => setError(e.message));
  }, []);

  const totalStudents = schools?.reduce((s, x) => s + parseInt(x.student_count || 0), 0) ?? null;
  const activeSchools = schools?.filter(s => s.active).length ?? null;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active schools" value={activeSchools} />
        <StatCard label="Total schools" value={schools?.length} />
        <StatCard label="Students" value={totalStudents} sub="across all cohorts" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent schools</h2>
          <Link to="/admin/schools" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {schools?.slice(0, 5).map(s => (
            <Link key={s.id} to={`/admin/schools/${s.id}`}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-indigo-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.city || '—'} · {s.cohort_count} cohort{s.cohort_count !== 1 ? 's' : ''}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
            </Link>
          ))}
          {schools?.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No schools yet. <Link to="/admin/schools" className="text-indigo-600 hover:underline">Add one →</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
