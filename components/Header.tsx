import Link from 'next/link';

export default function Header() {
  return (
    <header className="topbar">
      <div className="wrap topbar-wrap">
        <Link href="/" prefetch={true} className="brand-link" aria-label="Gorwa Yuvak Mandal Attendance Home">
          <img
            src="/icon-192.png"
            alt="Gorwa Yuvak Mandal logo"
            width={44}
            height={44}
            className="brand-logo"
          />
          <span className="brand-title">Gorwa Yuvak Mandal Attendance Portal</span>
        </Link>
        <nav className="topbar-nav" aria-label="Main Navigation">
          <Link href="/" prefetch={true} className="nav-link">Dashboard</Link>
          <Link href="/admin" prefetch={true} className="nav-link">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

