import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CohortDetail from './pages/CohortDetail';
import SetPassword from './pages/SetPassword';
import Sidebar from './components/Sidebar';
import { schoolApi } from './utils/schoolApi';

function AuthGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cs_staff_auth');
      if (!saved) { navigate('/school/login', { replace: true }); return; }
      const { role } = JSON.parse(saved);
      if (role !== 'counselor') {
        localStorage.removeItem('cs_staff_auth');
        navigate('/school/login', { replace: true });
      }
    } catch {
      navigate('/school/login', { replace: true });
    }
  }, [location.pathname]);

  const saved = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();
  if (saved.role !== 'counselor') return null;
  return children;
}

function TopHeader() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();
  const initial = (auth.name || 'C').charAt(0).toUpperCase();

  return (
    <header style={{
      zIndex: 10, background: '#fff', borderBottom: '1px solid #e2e8f0',
      padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, fontFamily: 'Sora, sans-serif',
    }}>
      {/* Search */}
      <div className="hidden sm:block" style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
        }}>search</span>
        <input
          type="text"
          placeholder="Search students, cohorts…"
          style={{
            width: 272, background: '#f8faff', border: '1px solid #e2e8f0',
            borderRadius: 10, paddingLeft: 36, paddingRight: 16,
            paddingTop: 8, paddingBottom: 8, fontSize: 13, color: '#334155',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#a5b4fc'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button style={{
          width: 32, height: 32, borderRadius: 99, border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748b', cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
        </button>

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 99,
            background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#00236f',
          }}>{initial}</div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{auth.name}</p>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const location = useLocation();
  const onDashboard = location.pathname === '/school';
  const onCohorts = location.pathname.startsWith('/school/cohorts');

  function Item({ icon, label, to, active }) {
    return (
      <Link to={to} className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        <span className={`material-symbols-outlined ${active ? 'symbol-fill' : ''}`} style={{ fontSize: '22px' }}>{icon}</span>
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-bottom">
      <Item icon="home" label="Home" to="/school" active={onDashboard} />
      <Item icon="group" label="Cohorts" to="/school" active={onCohorts} />
      <Item icon="search" label="Search" to="/school" active={false} />
      <Item icon="person" label="Me" to="/school" active={false} />
    </nav>
  );
}

function Layout({ children }) {
  const [school, setSchool] = useState(null);

  useEffect(() => {
    schoolApi.getSchool().then(d => setSchool(d.school)).catch(() => {});
  }, []);

  return (
    /* fixed inset-0 flex escapes #root's display:flex/justify-content:center from the student app */
    <div className="fixed inset-0 flex font-body" style={{ zIndex: 1, background: '#f8faff' }}>
      {/* Sidebar column — desktop only */}
      <div className="hidden md:flex flex-col" style={{ width: 240, flexShrink: 0, borderRight: '1px solid #e2e8f0' }}>
        <Sidebar schoolName={school?.name} />
      </div>
      {/* Main column — no overflow here so fixed portals stay viewport-relative */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export default function SchoolApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="set-password" element={<SetPassword portal="school" />} />
      <Route path="*" element={
        <AuthGuard>
          <Layout>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="cohorts/:id" element={<CohortDetail />} />
              <Route path="*" element={<Navigate to="/school" replace />} />
            </Routes>
          </Layout>
        </AuthGuard>
      } />
    </Routes>
  );
}
