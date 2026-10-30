import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { todayIST } from '@/lib/dates';

export const dynamic = 'force-dynamic';

function cleanDigits(val: unknown): string | null {
  if (typeof val !== 'string' && typeof val !== 'number') return null;
  const digits = String(val).replace(/\D/g, '');
  return digits || null;
}

function parseBirthDate(val: unknown): { isoDate: string | null; error?: string } {
  if (!val || typeof val !== 'string' || !val.trim()) {
    return { isoDate: null };
  }
  const s = val.trim();
  let iso = '';
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    iso = s;
  } else {
    const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }
  }

  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { isoDate: null, error: 'Invalid birth date format. Use dd-mm-yyyy or yyyy-mm-dd' };
  }

  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    return { isoDate: null, error: 'Invalid birth date' };
  }

  const today = todayIST();
  if (iso > today) {
    return { isoDate: null, error: 'Birth date cannot be in the future' };
  }

  return { isoDate: iso };
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 1. Validate Group Code
  const rawCode = typeof body.code === 'string' ? body.code : '';
  const code = rawCode.replace(/\s+/g, ' ').trim();
  if (!code || code.length > 50) {
    return NextResponse.json({ error: 'Group code is required (e.g. SK 13)' }, { status: 400 });
  }

  // Check uniqueness of group code
  const { data: existingGroup, error: existingErr } = await db()
    .from('groups')
    .select('id, code')
    .ilike('code', code)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (existingGroup) {
    return NextResponse.json({ error: `Group with code "${code}" already exists.` }, { status: 400 });
  }

  // 2. Validate Leader Name
  const rawLeader = body.leaderName !== undefined ? body.leaderName : body.leader_name;
  const leaderName = typeof rawLeader === 'string' && rawLeader.trim()
    ? rawLeader.replace(/\s+/g, ' ').trim().slice(0, 150)
    : null;

  // 3. Determine sort order
  let sortOrder = 99;
  const skMatch = code.match(/^SK\s*(\d+)$/i);
  if (skMatch) {
    sortOrder = Number(skMatch[1]);
  } else {
    const { data: maxGroup } = await db()
      .from('groups')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxGroup?.sort_order ?? 0) + 1;
  }

  // 4. Validate initial yuvak if provided
  const yuvakData = body.yuvak && typeof body.yuvak === 'object' ? body.yuvak : null;
  let parsedYuvak: {
    formId: string | null;
    name: string;
    birthDate: string | null;
    mobile: string | null;
    whatsapp: string | null;
    homePhone: string | null;
    education: string | null;
    address: string | null;
  } | null = null;

  if (yuvakData && typeof yuvakData.name === 'string' && yuvakData.name.trim()) {
    const cleanedName = yuvakData.name.replace(/\s+/g, ' ').trim();
    if (cleanedName.length < 2 || cleanedName.length > 120) {
      return NextResponse.json({ error: 'Yuvak name must be between 2 and 120 characters' }, { status: 400 });
    }

    const rawFormId = yuvakData.formId !== undefined ? yuvakData.formId : yuvakData.form_id;
    const formId = typeof rawFormId === 'string' && rawFormId.trim()
      ? rawFormId.trim().slice(0, 50)
      : null;

    let birthDate: string | null = null;
    const rawBirthDate = yuvakData.birthDate !== undefined ? yuvakData.birthDate : yuvakData.birth_date;
    if (rawBirthDate) {
      const parsed = parseBirthDate(rawBirthDate);
      if (parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      birthDate = parsed.isoDate;
    }

    let mobile: string | null = null;
    const rawMobile = yuvakData.mobile !== undefined ? yuvakData.mobile : undefined;
    if (rawMobile) {
      const mobileDigits = cleanDigits(rawMobile);
      if (mobileDigits) {
        if (mobileDigits.length !== 10) {
          return NextResponse.json({ error: 'Mobile number must be exactly 10 digits' }, { status: 400 });
        }

        // Duplicate check
        const { data: duplicates } = await db()
          .from('yuvaks')
          .select('id, name, group_id')
          .eq('mobile', mobileDigits);

        if (duplicates && duplicates.length > 0 && !body.overrideDuplicateMobile && !yuvakData.overrideDuplicateMobile) {
          const dup = duplicates[0];
          let groupCode = 'other group';
          if (dup.group_id) {
            const { data: g } = await db().from('groups').select('code').eq('id', dup.group_id).maybeSingle();
            if (g?.code) groupCode = g.code;
          }
          return NextResponse.json(
            {
              warning: `Mobile number ${mobileDigits} is already registered for ${dup.name} (${groupCode}).`,
              duplicateYuvak: { id: dup.id, name: dup.name, groupCode },
              canOverride: true,
            },
            { status: 409 }
          );
        }
        mobile = mobileDigits;
      }
    }

    let whatsapp: string | null = null;
    const rawWhatsapp = yuvakData.whatsapp !== undefined ? yuvakData.whatsapp : undefined;
    if (rawWhatsapp) {
      const whatsappDigits = cleanDigits(rawWhatsapp);
      if (whatsappDigits) {
        if (whatsappDigits.length !== 10) {
          return NextResponse.json({ error: 'WhatsApp number must be exactly 10 digits' }, { status: 400 });
        }
        whatsapp = whatsappDigits;
      }
    }

    let homePhone: string | null = null;
    const rawHomePhone = yuvakData.homePhone !== undefined ? yuvakData.homePhone : yuvakData.home_phone;
    if (rawHomePhone) {
      const homeDigits = cleanDigits(rawHomePhone);
      if (homeDigits) {
        if (homeDigits.length !== 10) {
          return NextResponse.json({ error: 'Home phone must be exactly 10 digits' }, { status: 400 });
        }
        homePhone = homeDigits;
      }
    }

    const education = typeof yuvakData.education === 'string' && yuvakData.education.trim()
      ? yuvakData.education.trim().slice(0, 200)
      : null;

    const address = typeof yuvakData.address === 'string' && yuvakData.address.trim()
      ? yuvakData.address.trim().slice(0, 500)
      : null;

    parsedYuvak = {
      formId,
      name: cleanedName,
      birthDate,
      mobile,
      whatsapp,
      homePhone,
      education,
      address,
    };
  }

  // 5. Insert new group into database
  const nowIso = new Date().toISOString();
  let createdGroup: { id: number; code: string; leader_name: string | null; sort_order: number } | null = null;

  const { data: insertGroupData, error: insertGroupErr } = await db()
    .from('groups')
    .insert({
      code,
      leader_name: leaderName,
      sort_order: sortOrder,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (insertGroupErr) {
    // Fallback if updated_at/created_at column isn't migrated
    const { data: fallbackGroupData, error: fallbackGroupErr } = await db()
      .from('groups')
      .insert({
        code,
        leader_name: leaderName,
        sort_order: sortOrder,
      })
      .select('*')
      .single();

    if (fallbackGroupErr) {
      return NextResponse.json({ error: fallbackGroupErr.message }, { status: 500 });
    }
    createdGroup = fallbackGroupData;
  } else {
    createdGroup = insertGroupData;
  }

  if (!createdGroup) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }

  // 6. Insert yuvak if details were filled
  let createdYuvak: unknown = null;
  if (parsedYuvak) {
    const yuvakPayload = {
      group_id: createdGroup.id,
      serial_no: 1,
      form_id: parsedYuvak.formId,
      name: parsedYuvak.name,
      birth_date: parsedYuvak.birthDate,
      mobile: parsedYuvak.mobile,
      whatsapp: parsedYuvak.whatsapp,
      home_phone: parsedYuvak.homePhone,
      education: parsedYuvak.education,
      address: parsedYuvak.address,
      remarks: null,
      source: 'added',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: yData, error: yErr } = await db()
      .from('yuvaks')
      .insert(yuvakPayload)
      .select('*')
      .single();

    if (yErr) {
      // Fallback without timestamps if schema differs
      const { data: fallbackYData } = await db()
        .from('yuvaks')
        .insert({
          group_id: createdGroup.id,
          serial_no: 1,
          form_id: parsedYuvak.formId,
          name: parsedYuvak.name,
          birth_date: parsedYuvak.birthDate,
          mobile: parsedYuvak.mobile,
          whatsapp: parsedYuvak.whatsapp,
          home_phone: parsedYuvak.homePhone,
          education: parsedYuvak.education,
          address: parsedYuvak.address,
          remarks: null,
          source: 'added',
        })
        .select('*')
        .single();
      createdYuvak = fallbackYData;
    } else {
      createdYuvak = yData;
    }
  }

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/admin');
  } catch {
    // safe fallback
  }

  return NextResponse.json({
    ok: true,
    group: createdGroup,
    yuvak: createdYuvak,
  });
}

