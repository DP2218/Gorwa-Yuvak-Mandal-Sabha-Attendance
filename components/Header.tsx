'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {/* Mobile Header: banner + navigation buttons directly below it */}
      <div className="mobile-only mobile-header-section">
        <div className="mobile-temple-banner">
          <Link href="/" prefetch={true} style={{ display: 'block', textDecoration: 'none' }} aria-label="Gorwa Yuvak Mandal Attendance Home">
            <img
              src="/header-banner.png"
              alt="Gorwa Yuvak Mandal - Attendance Portal"
              width={1024}
              height={480}
              className="mobile-header-banner-img"
            />
          </Link>
        </div>

        {/* Dashboard & Admin buttons right below the header banner */}
        <nav className="mobile-header-nav" aria-label="Mobile Navigation">
          <Link
            href="/"
            prefetch={true}
            className={`mobile-header-btn ${!isAdmin ? 'active' : 'inactive'}`}
            aria-current={!isAdmin ? 'page' : undefined}
          >
            <svg className="mobile-btn-icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z" />
            </svg>
            <span className="mobile-btn-label">Dashboard</span>
          </Link>
          <Link
            href="/admin"
            prefetch={true}
            className={`mobile-header-btn ${isAdmin ? 'active' : 'inactive'}`}
            aria-current={isAdmin ? 'page' : undefined}
          >
            <svg className="mobile-btn-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <circle cx="18" cy="15" r="2.5" />
              <path d="M18 11.5v1.2" />
              <path d="M18 17.3v1.2" />
              <path d="M15.1 13.6l1 0.6" />
              <path d="M19.9 16.4l1 0.6" />
              <path d="M15.1 16.4l1 -0.6" />
              <path d="M19.9 13.6l1 -0.6" />
            </svg>
            <span className="mobile-btn-label">Admin</span>
          </Link>
        </nav>
      </div>

      {/* Desktop Website Topbar: visible only on desktop (website view) */}
      <header className="topbar desktop-only">
        <div className="wrap topbar-wrap">
          <Link href="/" prefetch={true} className="brand-link" aria-label="Gorwa Yuvak Mandal Attendance Home">
            <img
              src="/gym-logo-clean.png"
              alt="Gorwa Yuvak Mandal logo"
              width={44}
              height={44}
              className="brand-logo"
            />
            <span className="brand-title">Gorwa Yuvak Mandal Attendance Portal</span>
          </Link>
          <nav className="topbar-nav" aria-label="Main Navigation">
            <Link
              href="/"
              prefetch={true}
              className={`nav-link ${isHome ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              prefetch={true}
              className={`nav-link ${isAdmin ? 'active' : ''}`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
