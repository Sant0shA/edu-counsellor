export default function Returning({ daysRemaining, onViewResults }) {
  return (
    <div className="screen" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 24px',
      textAlign: 'center', gap: '24px',
    }}>
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
    </div>
  );
}
