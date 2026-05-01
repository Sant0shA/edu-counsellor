import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schools from './pages/Schools';
import SchoolDetail from './pages/SchoolDetail';
import Staff from './pages/Staff';
import SetPassword from './pages/SetPassword';

function AuthGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cs_staff_auth');
      if (!saved) { navigate('/admin/login', { replace: true }); return; }
      const { role } = JSON.parse(saved);
      if (!['admin', 'manager'].includes(role)) {
        localStorage.removeItem('cs_staff_auth');
        navigate('/admin/login', { replace: true });
      }
    } catch {
      navigate('/admin/login', { replace: true });
    }
  }, [location.pathname]);

  const saved = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();
  if (!['admin', 'manager'].includes(saved.role)) return null;
  return children;
}

function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="set-password" element={<SetPassword portal="admin" />} />
      <Route path="*" element={
        <AuthGuard>
          <Layout>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="schools/:id" element={<SchoolDetail />} />
              <Route path="staff" element={<Staff />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Layout>
        </AuthGuard>
      } />
    </Routes>
  );
}
