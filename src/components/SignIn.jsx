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
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(31,27,24,0.1)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Card */}
        <div className="w-full max-w-md bg-surface-container-low rounded-lg shadow-[0_40px_60px_-15px_rgba(31,27,24,0.12)] border border-outline-variant/10 overflow-hidden relative">

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors z-10"
          >
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
              {/* Branding header */}
              <div className="pt-10 pb-6 px-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-fixed mb-6">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '32px' }}
                  >
                    map
                  </span>
                </div>
                <h1
                  className="text-3xl font-extrabold text-on-surface tracking-tight mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Sign In
                </h1>
                <p className="text-on-surface-variant font-medium leading-relaxed">
                  Continue your personalised career mapping.
                </p>
              </div>

              {/* Form content */}
              <div className="px-10 pb-10 space-y-6">
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-on-surface-variant ml-1"
                    htmlFor="signin-email"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'rgba(89,65,57,0.6)', fontSize: '20px' }}
                      >
                        mail
                      </span>
                    </div>
                    <input
                      id="signin-email"
                      className="block w-full pl-11 pr-4 py-4 bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200 text-on-surface placeholder:text-on-surface-variant/40"
                      type="email"
                      placeholder="me@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm" style={{ color: '#ba1a1a' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={sending}
                  onClick={handleSend}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 px-6 rounded-full font-bold text-lg shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group transition-all duration-300 active:scale-95 disabled:opacity-60"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {sending ? 'Sending…' : (
                    <>
                      Continue
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '20px' }}>arrow_forward</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-outline-variant/20" />
                  <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/40">
                    Security First
                  </span>
                  <div className="flex-grow border-t border-outline-variant/20" />
                </div>

                {/* Privacy note */}
                <div className="p-5 bg-surface-container-highest/50 rounded-2xl border border-outline-variant/10">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '20px' }}>
                      shield_person
                    </span>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      We do not capture personal information, only your email to ensure fair usage of this application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer gradient */}
              <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary-container to-tertiary-container opacity-20" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
