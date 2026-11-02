import HomeClient from '@/components/HomeClient';
import { getAllYuvaks, getAttendanceForDate, getGroups, getSabhaSettings } from '@/lib/data';
import { formatDate, mostRecentSabhaDate, todayIST, WEEKDAYS } from '@/lib/dates';

export default async function HomePage() {
  const [groups, yuvaks, settings] = await Promise.all([
    getGroups(),
    getAllYuvaks(),
    getSabhaSettings(),
  ]);

  const sabhaDay = settings.sabha_day;
  const date = settings.date_mode === 'manual' && settings.manual_date
    ? settings.manual_date
    : mostRecentSabhaDate(sabhaDay, todayIST());

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
      {/* Desktop Sabha Attendance Card */}
      <div className="card desktop-only">
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

      {/* Mobile Sabha Attendance Card (matches mockup) */}
      <div className="mobile-only mobile-sabha-card">
        <div className="mobile-sabha-header">
          <div className="mobile-icon-box" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C5B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="14" r="1.2" fill="#9C5B23" />
              <circle cx="12" cy="14" r="1.2" fill="#9C5B23" />
              <circle cx="16" cy="14" r="1.2" fill="#9C5B23" />
              <circle cx="8" cy="18" r="1.2" fill="#9C5B23" />
              <circle cx="12" cy="18" r="1.2" fill="#9C5B23" />
            </svg>
          </div>
          <div className="mobile-sabha-titles">
            <h2 className="mobile-sabha-heading">Sabha Attendance</h2>
            <div className="mobile-sabha-info">
              Sabha day: <strong>{sabhaDayLabel}</strong>
            </div>
            <div className="mobile-sabha-info">
              Marking for <strong>{formatDate(date)}</strong>
            </div>
          </div>
        </div>

        <div className="mobile-present-strip">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9C5B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div className="mobile-present-content">
            <span className="mobile-present-label">Present:</span>{' '}
            <strong className="mobile-present-count">{totalPresent}</strong>{' '}
            <span className="mobile-present-total">of {yuvaks.length} ({pct}%)</span>
          </div>
        </div>

        <p className="mobile-sabha-footer">
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
