export default function AdminLoading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Loading admin dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 220, height: 32 }} />
        <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 140, height: 22, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ flex: 1, height: 42, borderRadius: 10 }} />
          <div className="skeleton" style={{ width: 100, height: 42, borderRadius: 10 }} />
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="stat" style={{ padding: 14 }}>
            <div className="skeleton" style={{ width: 80, height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 60, height: 28 }} />
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="skeleton" style={{ width: 180, height: 22 }} />
          <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 10 }} />
      </div>
    </div>
  );
}

