import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolApi } from '../utils/schoolApi';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await schoolApi.login(email, password);
      if (data.role !== 'counselor') {
        setError('This portal is for counselors. Admins log in at /admin.');
        return;
      }
      localStorage.setItem('cs_staff_auth', JSON.stringify({
        token: data.token, role: data.role, name: data.name, schoolId: data.schoolId,
      }));
      navigate('/school');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    try { await schoolApi.resetPasswordRequest(email); } finally {
      setResetSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-indigo-700 flex-col justify-between p-12">
        <div>
          <p className="text-white text-xl font-bold tracking-tight">CareerShifu</p>
          <p className="text-violet-200 text-sm mt-1">School Counselor Portal</p>
        </div>
        <div>
          <p className="text-white text-2xl font-semibold leading-snug">
            Every student has a direction.<br />Help them find it.
          </p>
          <p className="text-violet-200 text-sm mt-3 leading-relaxed">
            View your students' AI-generated career assessments, track progress across cohorts, and add notes for each student — all in one place.
          </p>
        </div>
        <p className="text-violet-300 text-xs">© 2026 CareerShifu</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-lg font-bold text-gray-900 lg:hidden">CareerShifu</p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-1">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Counselor account</p>
          </div>

          {showReset ? (
            resetSent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800 font-medium">Reset link sent</p>
                  <p className="text-sm text-green-700 mt-1">Check your email — if the address is registered, a link is on its way.</p>
                </div>
                <button onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-sm text-indigo-600 hover:underline font-medium">← Back to sign in</button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
                <button type="button" onClick={() => setShowReset(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700">← Back to sign in</button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  placeholder="you@school.edu"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => setShowReset(true)}
                    className="text-xs text-indigo-600 hover:underline">Forgot password?</button>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
