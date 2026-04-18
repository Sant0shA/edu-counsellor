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
    if (code.length < OTP_LENGTH) {
      setError('Enter all 6 digits.');
      return;
    }
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
    <div className="px-8 py-10 flex flex-col items-center">
      {/* Decorative blob */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: 'rgba(255,219,207,0.2)', filter: 'blur(48px)', marginRight: '-4rem', marginTop: '-4rem' }}
      />

      {/* Header */}
      <div className="text-center mb-8 w-full">
        <h2
          className="font-extrabold text-3xl text-on-surface tracking-tight mb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Verify Your <span className="text-primary">Email</span>
        </h2>
        <p className="text-on-surface-variant leading-relaxed">
          Enter the 6-digit code sent to
        </p>
        <p className="font-bold text-on-surface text-sm mt-1">{email}</p>
      </div>

      {/* OTP form */}
      <form onSubmit={handleVerify} className="w-full space-y-8">
        <div className="flex justify-between gap-2 w-full">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className="w-full h-14 text-center text-2xl font-bold text-on-surface bg-surface-container-lowest rounded-xl focus:outline-none transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                border: 'none',
                boxShadow: d ? '0 0 0 2px #a53600' : '0 0 0 1px rgba(226,191,180,0.4)',
              }}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px #a53600'}
              onBlur={e => e.target.style.boxShadow = d ? '0 0 0 2px #a53600' : '0 0 0 1px rgba(226,191,180,0.4)'}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              placeholder="•"
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex flex-col items-center gap-5">
          <button
            type="submit"
            disabled={verifying || digits.join('').length < OTP_LENGTH}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-full text-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {verifying ? 'Verifying…' : 'Verify & Start →'}
          </button>

          <div className="flex items-center gap-2">
            {resendTimer > 0 ? (
              <span className="text-on-surface-variant text-sm">Resend in {resendTimer}s</span>
            ) : (
              <>
                <span className="text-on-surface-variant text-sm">Didn't receive a code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary font-bold text-sm hover:underline underline-offset-4 disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-on-surface-variant text-sm underline underline-offset-4"
          >
            Change email
          </button>
        </div>
      </form>

      {/* Footer gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 opacity-20" style={{ background: 'linear-gradient(to right, #a53600, #fe9d7a, #007abe)' }} />
    </div>
  );
}
