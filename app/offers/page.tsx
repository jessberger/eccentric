import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { Workspace } from '@/components/workspace';

export default async function OffersPage() {
  const supabase = await supabaseServer();
  if (!supabase) redirect('/login');
  let email: string | null = null;
  try { const { data, error } = await supabase.auth.getUser(); if (!error && data.user) email = data.user.email ?? null; } catch {}
  if (!email) redirect('/login');
  return <Workspace email={email} />;
}
