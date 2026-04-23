import SignOutChip from './SignOutChip';

export default function Returning({ daysRemaining, userEmail, onViewResults, onSignOut }) {
  return (
    <div className="screen" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 24px',
      textAlign: 'center', gap: '24px', position: 'relative',
    }}>
      {onSignOut && (
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <SignOutChip email={userEmail} onSignOut={onSignOut} />
        </div>
      )}

      <span className="logo-text" style={{ fontSize: '18px', color: '#a53600', fontWeight: 800 }}>CareerShifu</span>

      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: '#ffdbcf', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{
          color: '#a53600', fontSize: '36px', fontVariationSettings: "'FILL' 1",
        }}>task_alt</span>
      </div>

      <div style={{ maxWidth: '320px' }}>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px', fontWeight: 800,
          color: '#1f1b18', marginBottom: '12px', letterSpacing: '-0.3px',
        }}>
          Assessment complete
        </h1>
        <p style={{ color: '#594139', fontSize: '15px', lineHeight: 1.7, marginBottom: '8px' }}>
          You've already completed your free CareerShifu assessment this month.
        </p>
        {daysRemaining != null && (
          <p style={{ color: '#a53600', fontSize: '14px', fontWeight: 600 }}>
            Your results are valid for {daysRemaining} more day{daysRemaining !== 1 ? 's' : ''}.
          </p>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={onViewResults}
        style={{ marginTop: '8px' }}
      >
        View my results →
      </button>

      <p style={{ fontSize: '13px', color: '#9a7b72', maxWidth: '280px', lineHeight: 1.6 }}>
        One free assessment per 30 days. Your report is still available to download.
      </p>

      <a
        href={`https://wa.me/919004493138?text=${encodeURIComponent('Hi, I just completed the CareerShifu assessment and have a question.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed', bottom: '24px', right: '20px', zIndex: 9999,
          width: '52px', height: '52px', borderRadius: '50%', background: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)', textDecoration: 'none',
        }}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.83 1.782 6.862L2 30l7.338-1.762A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.844-1.606l-.418-.248-4.354 1.046 1.074-4.24-.272-.436A11.46 11.46 0 0 1 4.5 16C4.5 9.596 9.596 4.5 16 4.5S27.5 9.596 27.5 16 22.404 27.5 16 27.5zm6.29-8.476c-.344-.172-2.036-1.004-2.352-1.118-.316-.114-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.452-.536-2.766-1.708-1.022-.912-1.712-2.038-1.912-2.382-.2-.344-.022-.53.15-.702.156-.154.344-.4.516-.6.172-.2.23-.344.344-.574.114-.23.058-.43-.028-.602-.086-.172-.776-1.872-1.062-2.562-.28-.672-.564-.58-.776-.59l-.66-.012c-.23 0-.602.086-.916.43-.316.344-1.204 1.176-1.204 2.868s1.232 3.326 1.404 3.556c.172.23 2.424 3.702 5.872 5.19.82.354 1.46.566 1.96.724.822.262 1.572.224 2.164.136.66-.098 2.036-.832 2.322-1.634.286-.802.286-1.49.2-1.634-.084-.144-.314-.23-.658-.402z"/>
        </svg>
      </a>
    </div>
  );
}
