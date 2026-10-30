export default function AdminGroupLoading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Loading group details">
      <div className="skeleton" style={{ width: 110, height: 18, marginBottom: 12 }} />

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="skeleton" style={{ width: 100, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 220, height: 20 }} />
          </div>
          <div className="skeleton" style={{ width: 180, height: 42, borderRadius: 10 }} />
        </div>
        <div className="stats" style={{ margin: '16px 0 0' }}>
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="skeleton" style={{ width: 150, height: 24 }} />
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: 240, borderRadius: 10 }} />
      </div>
    </div>
  );
}

