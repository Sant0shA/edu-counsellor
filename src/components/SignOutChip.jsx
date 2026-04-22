import { useState } from 'react';

export default function SignOutChip({ email, onSignOut, style = {} }) {
  const [hovered, setHovered] = useState(false);
  const initial = email ? email[0].toUpperCase() : '?';

  return (
    <button
      type="button"
      onClick={onSignOut}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Signed in as ${email || 'unknown'}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '5px 12px 5px 5px',
        borderRadius: '999px',
        border: '1px solid rgba(226,191,180,0.5)',
        background: hovered ? 'rgba(165,54,0,0.07)' : 'rgba(252,242,237,0.85)',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        borderColor: hovered ? 'rgba(165,54,0,0.3)' : 'rgba(226,191,180,0.5)',
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: '#ffdbcf', color: '#a53600',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 800, flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {initial}
      </div>
      <span style={{
        fontSize: '12px', fontWeight: 600,
        color: hovered ? '#a53600' : '#594139',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'color 0.15s',
        letterSpacing: '0.01em',
      }}>
        Sign out
      </span>
    </button>
  );
}
