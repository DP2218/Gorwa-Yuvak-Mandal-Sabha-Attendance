import HomeClient from '@/components/HomeClient';
import { getActiveSabhaDate, getAllYuvaks, getAttendanceForDate, getGroups, getSabhaDay } from '@/lib/data';
import { formatDate, WEEKDAYS } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [groups, yuvaks, sabhaDay, activeDate] = await Promise.all([
    getGroups(),
    getAllYuvaks(),
    getSabhaDay(),
    getActiveSabhaDate(),
  ]);
  const date = activeDate;
  const present = await getAttendanceForDate(date);
  const totalPresent = yuvaks.filter((y) => present.has(y.id)).length;
  const pct = yuvaks.length ? Math.round((totalPresent / yuvaks.length) * 100) : 0;

  const counts = new Map<number, number>();
  const groupPresent = new Map<number, number>();
  for (const y of yuvaks) {
    if (y.group_id) {
      counts.set(y.group_id, (counts.get(y.group_id) ?? 0) + 1);
      if (present.has(y.id)) {
        groupPresent.set(y.group_id, (groupPresent.get(y.group_id) ?? 0) + 1);
      }
    }
  }

  const sabhaDayLabel = WEEKDAYS.includes(sabhaDay) ? sabhaDay[0].toUpperCase() + sabhaDay.slice(1) : sabhaDay;

  return (
    <div className="wrap">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 6px' }}>Sabha Attendance</h1>
            <p className="muted" style={{ margin: 0 }}>
              Sabha day: <strong style={{ color: 'inherit' }}>{sabhaDayLabel}</strong>
              {' · '}Marking for <strong style={{ color: 'inherit' }}>{formatDate(date)}</strong>
            </p>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            background: 'var(--card-hover, rgba(0,0,0,0.03))',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '8px 14px',
            whiteSpace: 'nowrap',
          }}>
            <span className="muted" style={{ fontSize: '0.88rem' }}>Present:</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--ink)' }}>{totalPresent}</strong>
            <span className="muted" style={{ fontSize: '0.88rem' }}>of {yuvaks.length}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginLeft: 2 }}>({pct}%)</span>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>
          Choose a group below, or search for a yuvak. Change the date on the group page if needed.
        </p>
      </div>
      <HomeClient
        date={date}
        groups={groups.map((g) => ({
          ...g,
          count: counts.get(g.id) ?? 0,
          presentCount: groupPresent.get(g.id) ?? 0,
        }))}
        yuvaks={yuvaks.map((y) => ({ id: y.id, name: y.name, group_id: y.group_id, mobile: y.mobile, serial_no: y.serial_no }))}
      />
    </div>
  );
}
