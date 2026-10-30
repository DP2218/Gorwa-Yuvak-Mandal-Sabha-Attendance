import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getGroups } from '@/lib/data';
import CreateGroupClient from '@/components/CreateGroupClient';

export const dynamic = 'force-dynamic';

export default async function CreateGroupPage() {
  if (!(await isAdmin())) {
    redirect('/admin/login');
  }

  const groups = await getGroups();

  // Find max SK number from existing groups
  let maxSk = 0;
  for (const g of groups) {
    const match = (g.code || '').match(/^SK\s*(\d+)$/i);
    if (match) {
      const num = Number(match[1]);
      if (num > maxSk) maxSk = num;
    }
  }

  const suggestedCode = `SK ${maxSk > 0 ? maxSk + 1 : 1}`;

  return (
    <CreateGroupClient
      suggestedCode={suggestedCode}
      existingGroups={groups}
    />
  );
}

