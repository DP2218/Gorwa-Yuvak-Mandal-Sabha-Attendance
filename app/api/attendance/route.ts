import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { isValidIsoDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Run close to Supabase DB region (Mumbai/Singapore)
export const preferredRegion = ['bom1'];

// POST { yuvak_id, session_date: "YYYY-MM-DD", present: boolean }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const yuvakId = Number(body?.yuvak_id);
  const date = typeof body?.session_date === 'string' ? body.session_date : '';
  if (!Number.isInteger(yuvakId) || yuvakId <= 0 || !isValidIsoDate(date)) {
    return NextResponse.json({ error: 'Invalid yuvak or date' }, { status: 400 });
  }

  // Single fast statement: no extra SELECT before upsert/delete
  if (body?.present === true) {
    const { error } = await db()
      .from('attendance')
      .upsert(
        { session_date: date, yuvak_id: yuvakId },
        { onConflict: 'yuvak_id,session_date', ignoreDuplicates: true }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db()
      .from('attendance')
      .delete()
      .match({ session_date: date, yuvak_id: yuvakId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Purge any stale cached pages so returning to dashboard or admin shows latest counts immediately
  try {
    revalidatePath('/', 'page');
    revalidatePath('/admin', 'page');
  } catch {}

  return NextResponse.json({ ok: true, yuvak_id: yuvakId, present: body?.present === true });
}

