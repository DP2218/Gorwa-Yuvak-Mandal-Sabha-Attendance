import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { isValidIsoDate } from '@/lib/dates';
import { getActiveSabhaDate } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

// GET /api/attendance/stats?date=YYYY-MM-DD
// Public fast endpoint for live refreshing the homepage dashboard counts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawDate = searchParams.get('date');
  const date = rawDate && isValidIsoDate(rawDate) ? rawDate : await getActiveSabhaDate();

  try {
    const [yuvaksRes, attendanceRes] = await Promise.all([
      db().from('yuvaks').select('id, group_id'),
      db().from('attendance').select('yuvak_id').eq('session_date', date),
    ]);

    const yuvaks = yuvaksRes.data ?? [];
    const attendance = attendanceRes.data ?? [];

    const presentSet = new Set(attendance.map((r) => r.yuvak_id));
    const totalYuvaks = yuvaks.length;
    const totalPresent = yuvaks.filter((y) => presentSet.has(y.id)).length;
    const pct = totalYuvaks ? Math.round((totalPresent / totalYuvaks) * 100) : 0;

    const groupPresentCounts: Record<number, number> = {};
    for (const y of yuvaks) {
      if (y.group_id) {
        if (!(y.group_id in groupPresentCounts)) {
          groupPresentCounts[y.group_id] = 0;
        }
        if (presentSet.has(y.id)) {
          groupPresentCounts[y.group_id] += 1;
        }
      }
    }

    return NextResponse.json({
      date,
      totalPresent,
      totalYuvaks,
      pct,
      groupPresentCounts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch attendance stats' }, { status: 500 });
  }
}
