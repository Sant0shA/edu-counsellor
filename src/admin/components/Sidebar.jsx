import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const auth = (() => { try { return JSON.parse(localStorage.getItem('cs_staff_auth') || '{}'); } catch { return {}; } })();

  function signOut() {
    localStorage.removeItem('cs_staff_auth');
    navigate('/admin/login');
  }

  const links = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/schools', label: 'Schools' },
    ...(auth.role === 'admin' ? [{ to: '/admin/staff', label: 'Staff' }] : []),
  ];

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">CareerShifu</p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{auth.role} · {auth.name}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-100">
        <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
          Sign out
        </button>
      </div>
    </aside>
  );
}
