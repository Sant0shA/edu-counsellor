import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../utils/adminApi';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminApi.login(email, password);
      if (!['admin', 'manager'].includes(data.role)) {
        setError('Access denied. Use /school for counselor login.');
        return;
      }
      localStorage.setItem('cs_staff_auth', JSON.stringify({ token: data.token, role: data.role, name: data.name }));
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.resetPasswordRequest(email);
      setResetSent(true);
    } catch {
      setResetSent(true); // don't leak whether email exists
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">CareerShifu Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Platform management portal</p>
        </div>

        {showReset ? (
          resetSent ? (
            <div className="text-center">
              <p className="text-sm text-gray-700">If that email exists, a reset link has been sent.</p>
              <button onClick={() => { setShowReset(false); setResetSent(false); }} className="mt-4 text-sm text-indigo-600 hover:underline">
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-gray-500 hover:underline">
                Back to login
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" onClick={() => setShowReset(true)} className="w-full text-sm text-gray-400 hover:text-gray-600 hover:underline">
              Forgot password?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
