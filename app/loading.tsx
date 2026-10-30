export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Loading page">
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="skeleton" style={{ width: 180, height: 26, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 220, height: 16 }} />
          </div>
          <div className="skeleton" style={{ width: 140, height: 38, borderRadius: 10 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 100, height: 20, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10 }} />
      </div>

      <div className="skeleton" style={{ width: 120, height: 24, margin: '20px 0 12px' }} />
      <div className="grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 16, margin: 0 }}>
            <div className="skeleton" style={{ width: 60, height: 22, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton" style={{ width: 65, height: 16 }} />
              <div className="skeleton" style={{ width: 55, height: 16 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

