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

function TopHeader({ schoolName }) {
  const auth = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();
  const initial = (auth.name || 'C').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center md:hidden">
          <span className="text-white text-xs font-bold">CS</span>
        </div>
        <p className="text-sm font-semibold text-slate-800">{schoolName || 'CareerShifu'}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <p className="text-sm text-slate-500 hidden sm:block">{auth.name}</p>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-700 text-sm font-bold">{initial}</span>
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
    /* fixed inset-0 escapes #root's display:flex / justify-content:center from the student app */
    <div className="fixed inset-0 overflow-y-auto bg-slate-100 font-body" style={{ zIndex: 0 }}>
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-full">
        <TopHeader schoolName={school?.name} />
        <main className="flex-1 pb-20 md:pb-0">
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
