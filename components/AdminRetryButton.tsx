'use client';

export default function AdminRetryButton() {
  return (
    <button
      type="button"
      className="btn"
      onClick={() => window.location.reload()}
      style={{ padding: '8px 18px', fontSize: '0.95rem' }}
    >
      Retry Loading
    </button>
  );
}

