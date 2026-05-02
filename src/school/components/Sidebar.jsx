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
    <aside style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: '#fff', fontFamily: 'Sora, sans-serif',
    }}>

      {/* Branding */}
      <div style={{ padding: '20px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#00236f', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, flexShrink: 0,
          }}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontWeight: 700, fontSize: 14, color: '#0f172a',
              margin: 0, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {schoolName || 'CareerShifu'}
            </p>
            <p style={{
              fontSize: 10, fontWeight: 700, color: '#94a3b8',
              letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0',
            }}>
              Counselor Portal
            </p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: '#94a3b8', textTransform: 'uppercase',
        margin: '0 16px 6px', paddingBottom: 6, borderBottom: '1px solid #f1f5f9',
      }}>
        Navigation
      </p>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const isActive = active(item);
          const clickable = !!item.to;
          return (
            <button
              key={item.label}
              onClick={() => clickable && navigate(item.to)}
              disabled={!clickable}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00236f' : clickable ? '#475569' : '#cbd5e1',
                background: isActive ? '#eef2ff' : 'transparent',
                cursor: clickable ? 'pointer' : 'not-allowed',
                transition: 'background 0.12s, color 0.12s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive && clickable) {
                  e.currentTarget.style.background = '#f5f7ff';
                  e.currentTarget.style.color = '#1e3a8a';
                }
              }}
              onMouseLeave={e => {
                if (!isActive && clickable) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: 20,
                color: isActive ? '#00236f' : clickable ? '#94a3b8' : '#cbd5e1',
                fontVariationSettings: isActive
                  ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '8px 10px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* New Entry CTA */}
        <button
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 600, color: '#fff', background: '#00236f',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#001a52'}
          onMouseLeave={e => e.currentTarget.style.background = '#00236f'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New Entry
        </button>

        {/* Help Center */}
        <button
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 500, color: '#64748b', background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8faff'; e.currentTarget.style.color = '#475569'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#94a3b8', flexShrink: 0 }}>help</span>
          Help Center
        </button>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', margin: '4px 2px' }} />

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 10, border: 'none',
            fontSize: 13, fontWeight: 500, color: '#64748b', background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#94a3b8', flexShrink: 0 }}>logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
