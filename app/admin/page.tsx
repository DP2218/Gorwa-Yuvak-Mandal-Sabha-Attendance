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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; group?: string }>;
}) {
  if (!(await isAdmin())) redirect('/admin/login');
  const sp = await searchParams;

  const sabhaSettings = await getSabhaSettings();
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

  // Parallel server fetch of real present/absent data so page arrives pre-filled on first paint
  const {
    groups,
    totalPresent,
    totalYuvaks,
    pct,
    heldDates,
    groupSummary,
  } = await getDashboardData(date, year);

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

      {/* Live dashboard stats & group breakdown with SSR first paint and quiet background auto-refresh */}
      <AdminDashboardLive
        date={date}
        formattedDate={formatDate(date)}
        year={year}
        initialStats={{
          totalPresent,
          totalYuvaks,
          pct,
          heldDates,
        }}
        initialGroupSummary={groupSummary}
      />

      <div className="card">
        <h2>Downloads (open in Excel)</h2>
        <AdminDownloads
          defaultDate={date}
          year={year}
          sabhaDay={sabhaDay}
          dateOptions={dateOptions}
          groups={groups.map((g) => ({ id: g.id, code: g.code }))}
          csvDateHref={`/api/admin/export?date=${date}`}
          csvYearHref={`/api/admin/export?year=${year}`}
        />
      </div>
    </div>
  );
}
