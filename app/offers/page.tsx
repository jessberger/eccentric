import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { Workspace } from '@/components/workspace';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const supabase = await supabaseServer();
  if (!supabase) redirect('/login');
  let email: string | null = null;
  try { const { data, error } = await supabase.auth.getUser(); if (!error && data.user && !data.user.is_anonymous) email = data.user.email ?? null; } catch {}
  if (!email) redirect('/login');
  return <Workspace email={email} />;
}
