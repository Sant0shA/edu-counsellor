import { useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { icon: 'dashboard', label: 'Dashboard', to: '/school', exact: true },
  { icon: 'group', label: 'Cohorts', to: '/school/cohorts', exact: false },
  { icon: 'person_search', label: 'Student Directory', to: null },
  { icon: 'assessment', label: 'Reports', to: null },
  { icon: 'settings', label: 'Settings', to: null },
];

export default function Sidebar({ schoolName }) {
  const location = useLocation();
  const navigate = useNavigate();

  function active(item) {
    if (!item.to) return false;
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  }

  function signOut() {
    localStorage.removeItem('cs_staff_auth');
    navigate('/school/login');
  }

  const initial = (schoolName || 'G').charAt(0).toUpperCase();

  return (
    <aside className="flex flex-col h-full w-full bg-slate-50 font-sora">
      {/* Branding */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xl shrink-0"
            style={{ background: '#00236f' }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">{schoolName || 'CareerShifu'}</p>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mt-0.5">Counselor Portal</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(item => {
          const isActive = active(item);
          const clickable = !!item.to;
          return (
            <button key={item.label}
              onClick={() => clickable && navigate(item.to)}
              disabled={!clickable}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-[#1E3A8A] shadow-sm ring-1 ring-slate-200'
                  : clickable
                    ? 'text-slate-600 hover:text-[#1E3A8A] hover:bg-white/70'
                    : 'text-slate-300 cursor-not-allowed'
              }`}>
              <span className="material-symbols-outlined" style={{
                fontSize: '20px',
                fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
              }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1">
        {/* New Entry CTA */}
        <button
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: '#00236f', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#001a52'}
          onMouseLeave={e => e.currentTarget.style.background = '#00236f'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Entry
        </button>

        {/* Help Center */}
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-600 hover:bg-white/70 rounded-lg text-sm font-medium transition-all">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
          Help Center
        </button>

        {/* Sign out */}
        <div className="border-t border-slate-200 pt-1 mt-1">
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
