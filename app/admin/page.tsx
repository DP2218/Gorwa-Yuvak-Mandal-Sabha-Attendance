import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import {
  getDashboardData,
  getSabhaSettings,
} from '@/lib/data';
import { formatDate, isValidIsoDate, mostRecentSabhaDate, sabhaDates, todayIST } from '@/lib/dates';
import { LogoutButton, SabhaDayForm } from '@/components/AdminControls';
import AdminDownloads from '@/components/AdminDownloads';
import AdminDashboardLive from '@/components/AdminDashboardLive';
import AdminRetryButton from '@/components/AdminRetryButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; group?: string }>;
}) {
  if (!(await isAdmin())) redirect('/admin/login');
  const sp = await searchParams;

  let sabhaSettings;
  try {
    sabhaSettings = await getSabhaSettings();
  } catch (err: any) {
    console.error('Failed to load sabha settings:', err);
    sabhaSettings = { sabha_day: 'friday' as const, date_mode: 'auto' as const, manual_date: null };
  }

  const sabhaDay = sabhaSettings.sabha_day;
  const today = todayIST();
  const activeDate = sabhaSettings.date_mode === 'manual' && sabhaSettings.manual_date
    ? sabhaSettings.manual_date
    : mostRecentSabhaDate(sabhaDay, today);

  const date = sp.date && isValidIsoDate(sp.date) ? sp.date : activeDate;
  const year = Number(date.slice(0, 4));
  const dateOptions = sabhaDates(year, sabhaDay);
  if (!dateOptions.includes(date)) dateOptions.push(date);
  if (!dateOptions.includes(activeDate)) dateOptions.push(activeDate);
  dateOptions.sort();

  // Fast parallel server fetch with error boundary
  let dashboardData: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let loadError: string | null = null;

  try {
    dashboardData = await getDashboardData(date, year);
  } catch (err: any) {
    console.error('Dashboard data load error:', err);
    loadError = err?.message || 'Database query timed out or failed';
  }

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Attendance dashboard</h1>
        <LogoutButton />
      </div>

      <div className="card">
        <h2>Sabha settings</h2>
        <SabhaDayForm
          currentDay={sabhaSettings.sabha_day}
          currentMode={sabhaSettings.date_mode}
          currentManualDate={sabhaSettings.manual_date}
          today={today}
        />
        <p className="muted" style={{ marginBottom: 0, marginTop: 14 }}>
          The sabha day is Friday by default. Choose the date attendance is marked for, or leave it on Auto. You can always pick any other date on a group page for a special sabha.
        </p>
      </div>

      <form method="get" className="card row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label htmlFor="date">Sabha date</label>
          <select id="date" name="date" defaultValue={date}>
            {dateOptions.map((d) => (
              <option key={d} value={d}>{formatDate(d)}</option>
            ))}
          </select>
        </div>
        <button className="btn ghost" type="submit">Show</button>
      </form>

      {/* Error state with clear Retry button instead of hanging skeleton */}
      {loadError || !dashboardData ? (
        <div className="card" role="alert" style={{ borderLeft: '4px solid #ef4444', padding: '20px' }}>
          <h2 style={{ color: '#b91c1c', margin: '0 0 8px' }}>Unable to load attendance data</h2>
          <p className="muted" style={{ margin: '0 0 16px' }}>
            {loadError || 'Unable to connect to database'}. Please check your connection and try again.
          </p>
          <AdminRetryButton />
        </div>
      ) : (
        <>
          {/* Live dashboard stats & group breakdown with SSR first paint and quiet background auto-refresh */}
          <AdminDashboardLive
            date={date}
            formattedDate={formatDate(date)}
            year={year}
            initialStats={{
              totalPresent: dashboardData.totalPresent,
              totalYuvaks: dashboardData.totalYuvaks,
              pct: dashboardData.pct,
              heldDates: dashboardData.heldDates,
            }}
            initialGroupSummary={dashboardData.groupSummary}
          />

          <div className="card">
            <h2>Downloads (open in Excel)</h2>
            <AdminDownloads
              defaultDate={date}
              year={year}
              sabhaDay={sabhaDay}
              dateOptions={dateOptions}
              groups={dashboardData.groups.map((g) => ({ id: g.id, code: g.code }))}
              csvDateHref={`/api/admin/export?date=${date}`}
              csvYearHref={`/api/admin/export?year=${year}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
