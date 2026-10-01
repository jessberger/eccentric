import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { Workspace } from '@/components/workspace';
import { loadOffers } from './actions';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const supabase = await supabaseServer();
  if (!supabase) redirect('/login');
  let email: string | null = null;
  try { const { data, error } = await supabase.auth.getUser(); if (!error && data.user) email = data.user.email ?? null; } catch {}
  if (!email) redirect('/login');
  const initialResult = await loadOffers({ query: '', filters: {}, page: 1 });
  return <Workspace email={email} initialResult={initialResult} />;
}
