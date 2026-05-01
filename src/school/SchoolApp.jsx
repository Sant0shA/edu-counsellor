import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CohortDetail from './pages/CohortDetail';
import SetPassword from './pages/SetPassword';

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

export default function SchoolApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="set-password" element={<SetPassword portal="school" />} />
      <Route path="*" element={
        <AuthGuard>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="cohorts/:id" element={<CohortDetail />} />
            <Route path="*" element={<Navigate to="/school" replace />} />
          </Routes>
        </AuthGuard>
      } />
    </Routes>
  );
}
