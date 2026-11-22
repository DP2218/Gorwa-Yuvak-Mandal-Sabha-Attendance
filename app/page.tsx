import HomeClient from '@/components/HomeClient';
import { getAllYuvaks, getAttendanceForDate, getGroups, getSabhaSettings } from '@/lib/data';
import { formatDate, mostRecentSabhaDate, todayIST, WEEKDAYS } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

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
      <HomeClient
        date={date}
        sabhaDayLabel={sabhaDayLabel}
        formattedDate={formatDate(date)}
        initialTotalPresent={totalPresent}
        initialTotalYuvaks={yuvaks.length}
        initialPct={pct}
        groups={groups.map((g) => ({
          ...g,
          count: counts.get(g.id) ?? 0,
          presentCount: groupPresent.get(g.id) ?? 0,
        }))}
        yuvaks={yuvaks.map((y) => ({
          id: y.id,
          name: y.name,
          group_id: y.group_id,
          mobile: y.mobile,
          serial_no: y.serial_no,
        }))}
      />
    </div>
  );
}
