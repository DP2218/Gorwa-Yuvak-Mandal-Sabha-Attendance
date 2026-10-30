export default function GroupLoading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Loading group attendance">
      <div className="skeleton" style={{ width: 90, height: 18, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: 120, height: 32, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: 180, height: 18, marginBottom: 16 }} />

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 10 }} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 150, height: 28 }} />
          <div className="skeleton" style={{ width: 220, height: 16 }} />
        </div>
      </div>

      <div className="list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: 14,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 56,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div>
                <div className="skeleton" style={{ width: 160, height: 18, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: 100, height: 14 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

