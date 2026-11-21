import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { isValidIsoDate } from '@/lib/dates';
import { getActiveSabhaDate, getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = ['bom1', 'sin1'];

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawDate = searchParams.get('date');
  const date = rawDate && isValidIsoDate(rawDate) ? rawDate : await getActiveSabhaDate();
  const year = Number(date.slice(0, 4));

  const data = await getDashboardData(date, year);

  return NextResponse.json({
    date,
    stats: {
      totalPresent: data.totalPresent,
      totalYuvaks: data.totalYuvaks,
      pct: data.pct,
      heldDates: data.heldDates,
    },
    groupSummary: data.groupSummary,
  });
}

