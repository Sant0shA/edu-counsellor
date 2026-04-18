import { useState } from 'react';
import OTPVerify from './OTPVerify';

export default function SignIn({ onClose, onVerified }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send code');
      }
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setSending(false);
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(31,27,24,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '440px',
        background: '#fcf2ed',
        borderRadius: '16px',
        boxShadow: '0 40px 60px -15px rgba(31,27,24,0.12)',
        border: '1px solid rgba(226,191,180,0.1)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', background: 'none', border: 'none',
          cursor: 'pointer', color: '#594139',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>

        {otpSent ? (
          <OTPVerify
            email={email.trim().toLowerCase()}
            onVerified={onVerified}
            onBack={() => setOtpSent(false)}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '40px 40px 24px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#ffdbcf', marginBottom: '24px',
              }}>
                <span className="material-symbols-outlined" style={{
                  color: '#a53600', fontSize: '32px',
                  fontVariationSettings: "'FILL' 1",
                }}>map</span>
              </div>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '28px', fontWeight: 800,
                color: '#1f1b18', marginBottom: '8px', letterSpacing: '-0.3px',
              }}>Sign In</h1>
              <p style={{ color: '#594139', fontSize: '15px', lineHeight: 1.6 }}>
                Continue your personalised career mapping.
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: '0 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '13px', fontWeight: 600,
                  color: '#594139', marginBottom: '8px',
                }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px', color: 'rgba(89,65,57,0.5)',
                  }}>mail</span>
                  <input
                    id="signin-email"
                    type="email"
                    placeholder="me@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                    style={{
                      width: '100%', padding: '14px 14px 14px 44px',
                      background: '#ffffff', border: '1px solid rgba(226,191,180,0.5)',
                      borderRadius: '12px', fontSize: '15px', color: '#1f1b18',
                      outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {error && <p style={{ fontSize: '13px', color: '#ba1a1a' }}>{error}</p>}

              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  width: '100%', padding: '16px',
                  background: '#a53600', color: '#ffffff',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px', fontWeight: 700,
                  borderRadius: '999px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending…' : (<>Continue <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span></>)}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(226,191,180,0.3)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(89,65,57,0.4)', textTransform: 'uppercase' }}>Security First</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(226,191,180,0.3)' }} />
              </div>

              {/* Privacy note */}
              <div style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(234,225,220,0.5)',
                border: '1px solid rgba(226,191,180,0.2)',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <span className="material-symbols-outlined" style={{ color: '#a53600', fontSize: '20px', flexShrink: 0 }}>shield_person</span>
                <p style={{ fontSize: '13px', color: '#594139', lineHeight: 1.6, margin: 0 }}>
                  We do not capture personal information, only your email to ensure fair usage of this application.
                </p>
              </div>
            </div>

            {/* Footer gradient */}
            <div style={{
              height: '4px',
              background: 'linear-gradient(to right, #a53600, #fe9d7a, #007abe)',
              opacity: 0.2,
            }} />
          </>
        )}
      </div>
    </div>
  );
}
