'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AddYuvakForm from './AddYuvakForm';
import type { Group, Yuvak } from '@/lib/data';

type Props = {
  groups: (Group & { count: number; presentCount?: number })[];
  yuvaks: Pick<Yuvak, 'id' | 'name' | 'group_id' | 'mobile' | 'serial_no'>[];
  date: string;
};

export default function HomeClient({ groups, yuvaks: initial, date }: Props) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return list.filter((y) => y.name.toLowerCase().includes(s) || (y.mobile ?? '').includes(s)).slice(0, 30);
  }, [list, q]);

  const noMatch = q.trim().length >= 2 && results.length === 0;

  return (
    <>
      {/* Desktop Find a yuvak Card */}
      <div className="card desktop-only">
        <h2>Find a yuvak</h2>
        <div className="field">
          <label htmlFor="find">Type a name or mobile number</label>
          <input
            id="find"
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowAdd(false); }}
            autoComplete="off"
            placeholder="e.g. PATEL ARTH"
          />
        </div>

        {results.length > 0 && (
          <div className="list">
            {results.map((y) => {
              const g = groupById.get(y.group_id ?? -1);
              return (
                <Link key={y.id} href={`/group/${y.group_id}?date=${date}&focus=${y.id}`} prefetch={true} className="yrow" style={{ textDecoration: 'none' }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="name">{y.name}</span>
                    <span className="meta">{g ? `${g.code}` : 'No group'} {y.mobile ? `· ${y.mobile}` : ''}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {noMatch && !showAdd && (
          <div style={{ marginTop: 12 }}>
            <p className="muted">&ldquo;{q.trim()}&rdquo; is not in the list.</p>
            <button className="btn" type="button" onClick={() => setShowAdd(true)}>Add &ldquo;{q.trim()}&rdquo; as a new yuvak</button>
          </div>
        )}

        {showAdd && (
          <div style={{ marginTop: 12 }}>
            <AddYuvakForm
              groups={groups}
              initialName={q.trim()}
              onAdded={(y: Yuvak) => {
                setList((prev) => [...prev, { id: y.id, name: y.name, group_id: y.group_id, mobile: y.mobile, serial_no: null }]);
                setAdded(`${y.name} saved. Open their group to mark attendance.`);
                setShowAdd(false);
                setQ('');
              }}
            />
          </div>
        )}
        {added && <div className="success" role="status" style={{ marginTop: 12 }}>{added}</div>}
      </div>

      {/* Mobile Find a yuvak Card (matches mockup) */}
      <div className="mobile-only mobile-find-card">
        <div className="mobile-find-header">
          <div className="mobile-icon-box" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C5B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="mobile-find-titles">
            <h2 className="mobile-find-heading">Find a yuvak</h2>
            <div className="mobile-find-sub">Type a name or mobile number</div>
          </div>
        </div>

        <div className="mobile-search-wrapper">
          <svg className="mobile-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="find-mobile"
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowAdd(false); }}
            autoComplete="off"
            placeholder="e.g. PATEL ARTH"
            className="mobile-search-input"
          />
        </div>

        {results.length > 0 && (
          <div className="list" style={{ marginTop: 12 }}>
            {results.map((y) => {
              const g = groupById.get(y.group_id ?? -1);
              return (
                <Link key={y.id} href={`/group/${y.group_id}?date=${date}&focus=${y.id}`} prefetch={true} className="yrow" style={{ textDecoration: 'none' }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="name">{y.name}</span>
                    <span className="meta">{g ? `${g.code}` : 'No group'} {y.mobile ? `· ${y.mobile}` : ''}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {noMatch && !showAdd && (
          <div style={{ marginTop: 12 }}>
            <p className="muted">&ldquo;{q.trim()}&rdquo; is not in the list.</p>
            <button className="btn" type="button" onClick={() => setShowAdd(true)}>Add &ldquo;{q.trim()}&rdquo; as a new yuvak</button>
          </div>
        )}

        {showAdd && (
          <div style={{ marginTop: 12 }}>
            <AddYuvakForm
              groups={groups}
              initialName={q.trim()}
              onAdded={(y: Yuvak) => {
                setList((prev) => [...prev, { id: y.id, name: y.name, group_id: y.group_id, mobile: y.mobile, serial_no: null }]);
                setAdded(`${y.name} saved. Open their group to mark attendance.`);
                setShowAdd(false);
                setQ('');
              }}
            />
          </div>
        )}
        {added && <div className="success" role="status" style={{ marginTop: 12 }}>{added}</div>}
      </div>

      {/* Desktop Groups Section */}
      <div className="desktop-only">
        <h2 style={{ margin: '20px 0 10px' }}>Groups</h2>
        <div className="grid">
          {groups.map((g) => (
            <Link key={g.id} href={`/group/${g.id}?date=${date}`} prefetch={true} className="card" style={{ textDecoration: 'none', color: 'inherit', margin: 0 }}>
              <strong style={{ fontSize: '1.1rem' }}>{g.code}</strong>
              <div className="muted" style={{ marginTop: 4 }}>{g.leader_name ?? '-'}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.92rem' }}>
                <span>{g.count} yuvaks</span>
                {g.presentCount !== undefined && (
                  <span style={{ fontWeight: 600, color: g.presentCount > 0 ? '#15803d' : 'var(--muted)' }}>
                    {g.presentCount} present
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Groups Section (matches mockup) */}
      <div className="mobile-only">
        <h2 className="mobile-groups-heading">Groups</h2>
        <div className="mobile-groups-list">
          {groups.map((g) => {
            const hasPresent = (g.presentCount ?? 0) > 0;
            return (
              <Link
                key={g.id}
                href={`/group/${g.id}?date=${date}`}
                prefetch={true}
                className="mobile-group-card"
              >
                <div className="mobile-group-icon-box" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9C5B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="mobile-group-main">
                  <div className="mobile-group-code">{g.code}</div>
                  <div className="mobile-group-leader">{g.leader_name ? g.leader_name.toUpperCase() : '-'}</div>
                  <div className="mobile-group-count">{g.count} yuvaks</div>
                </div>
                <div className="mobile-group-status">
                  <span className={`mobile-group-pill ${hasPresent ? 'present' : 'zero'}`}>
                    {g.presentCount ?? 0} present
                  </span>
                  <svg className="mobile-group-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
