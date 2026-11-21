'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GroupSummaryItem } from '@/lib/data';

type Props = {
  date: string;
  formattedDate: string;
  year: number;
  initialStats: {
    totalPresent: number;
    totalYuvaks: number;
    pct: number;
    heldDates: number;
  };
  initialGroupSummary: GroupSummaryItem[];
};

export default function AdminDashboardLive({
  date,
  formattedDate,
  year,
  initialStats,
  initialGroupSummary,
}: Props) {
  const [stats, setStats] = useState(initialStats);
  const [groupSummary, setGroupSummary] = useState(initialGroupSummary);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      // Quiet background refresh - skip if tab is in background
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(`/api/admin/stats?date=${encodeURIComponent(date)}`, {
          cache: 'no-store',
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.stats) {
            setStats(data.stats);
          }
          if (Array.isArray(data?.groupSummary)) {
            setGroupSummary(data.groupSummary);
          }
        }
      } catch {
        // Quiet background polling: quietly ignore network errors without interrupting UI
      }
    };

    // Quiet refresh every 20 seconds
    const interval = setInterval(poll, 20000);

    const onVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [date]);

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="muted">Date</span>
          <b style={{ fontSize: '1.1rem' }}>{formattedDate}</b>
        </div>
        <div className="stat">
          <span className="muted">Present</span>
          <b>{stats.totalPresent}</b>
        </div>
        <div className="stat">
          <span className="muted">Yuvaks in list</span>
          <b>{stats.totalYuvaks}</b>
        </div>
        <div className="stat">
          <span className="muted">Attendance</span>
          <b>{stats.pct}%</b>
        </div>
        <div className="stat">
          <span className="muted">Sabha dates with attendance in {year}</span>
          <b>{stats.heldDates}</b>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>By group on {formattedDate}</h2>
          <Link
            href="/admin/group/create"
            prefetch={true}
            className="btn ghost"
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.88rem' }}
          >
            + Create New SK
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Leader</th>
                <th>Present</th>
                <th>In list</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {groupSummary.map(({ g, total, present: p }) => (
                <tr key={g.id}>
                  <td>
                    <Link href={`/admin/group/${g.id}?date=${date}`} prefetch={true}>
                      {g.code}
                    </Link>
                  </td>
                  <td>{g.leader_name ?? '-'}</td>
                  <td>{p}</td>
                  <td>{total}</td>
                  <td>{total ? Math.round((p / total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

