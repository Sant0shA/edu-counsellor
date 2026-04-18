import { useState, useRef, useEffect } from 'react';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OTPVerify({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handleDigitChange(index, value) {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...digits];
      pasted.forEach((d, i) => { if (index + i < OTP_LENGTH) next[index + i] = d; });
      setDigits(next);
      const focusIdx = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) { setError('Enter all 6 digits.'); return; }
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid or expired code');
      }
      const data = await res.json();
      onVerified(data.userId);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
    setVerifying(false);
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendTimer(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend. Please try again.');
    }
    setResending(false);
  }

  return (
    <div style={{ padding: '40px 32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', width: '100%' }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px', fontWeight: 800,
          color: '#1f1b18', marginBottom: '10px', letterSpacing: '-0.3px',
        }}>
          Verify Your <span style={{ color: '#a53600' }}>Email</span>
        </h2>
        <p style={{ color: '#594139', fontSize: '14px', lineHeight: 1.6 }}>
          Enter the 6-digit code sent to
        </p>
        <p style={{ fontWeight: 700, color: '#1f1b18', fontSize: '14px', marginTop: '4px' }}>
          {email}
        </p>
      </div>

      {/* OTP inputs */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '24px', justifyContent: 'center' }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            placeholder="•"
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #a53600'}
            onBlur={(e) => e.target.style.boxShadow = d ? '0 0 0 2px #a53600' : '0 0 0 1px rgba(226,191,180,0.5)'}
            autoFocus={i === 0}
            style={{
              width: '44px', height: '54px',
              flexShrink: 0,
              textAlign: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '22px', fontWeight: 700,
              color: '#1f1b18',
              background: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: d ? '0 0 0 2px #a53600' : '0 0 0 1px rgba(226,191,180,0.5)',
              outline: 'none',
              transition: 'box-shadow 0.15s',
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#ba1a1a', textAlign: 'center', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={verifying || digits.join('').length < OTP_LENGTH}
        style={{
          width: '100%', padding: '16px',
          background: '#a53600', color: '#ffffff',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '16px', fontWeight: 700,
          borderRadius: '999px', border: 'none', cursor: 'pointer',
          marginBottom: '20px',
          opacity: (verifying || digits.join('').length < OTP_LENGTH) ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {verifying ? 'Verifying…' : 'Verify & Start →'}
      </button>

      {/* Resend row */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        {resendTimer > 0 ? (
          <span style={{ fontSize: '13px', color: '#594139' }}>Resend in {resendTimer}s</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '13px', color: '#594139' }}>Didn't receive a code?</span>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                fontSize: '13px', fontWeight: 700, color: '#a53600',
                background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline', opacity: resending ? 0.6 : 1,
              }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        )}
      </div>

      {/* Change email */}
      <button
        onClick={onBack}
        style={{
          fontSize: '13px', color: '#594139',
          background: 'none', border: 'none', cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Change email
      </button>

      {/* Footer gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(to right, #a53600, #fe9d7a, #007abe)',
        opacity: 0.2,
      }} />
    </div>
  );
}
