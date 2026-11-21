import { redirect } from 'next/navigation';

export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; group?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.date) params.set('date', sp.date);
  if (sp.group) params.set('group', sp.group);
  const q = params.toString();
  redirect(q ? `/admin?${q}` : '/admin');
}

