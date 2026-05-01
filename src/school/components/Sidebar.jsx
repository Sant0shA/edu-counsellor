import { useLocation, useNavigate } from 'react-router-dom';

function NavItem({ icon, label, active, onClick, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick || (() => navigate(to))}
      className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-3 pr-4'
          : 'text-slate-600 hover:bg-slate-100 pl-4 pr-4 border-l-4 border-transparent'
      }`}>
      <span className={`material-symbols-outlined ${active ? 'symbol-fill' : ''}`} style={{ fontSize: '20px' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const onDashboard = location.pathname === '/school';
  const onCohorts = location.pathname.startsWith('/school/cohorts');

  function signOut() {
    localStorage.removeItem('cs_staff_auth');
    navigate('/school/login');
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200 flex-col z-30">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">CS</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">CareerShifu</p>
            <p className="text-xs text-slate-400">Counselor Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon="dashboard" label="Dashboard" active={onDashboard} to="/school" />
        <NavItem icon="group" label="Cohorts" active={onCohorts} to="/school" />
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-200">
        <NavItem icon="logout" label="Sign out" active={false} onClick={signOut} />
      </div>
    </aside>
  );
}
