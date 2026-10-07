import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase';

export async function requireUserEmail(): Promise<string> {
  const supabase = await supabaseServer();
  let email: string | null = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user && !data.user.is_anonymous) email = data.user.email ?? null;
    } catch { /* Redirect when the session cannot be verified. */ }
  }
  if (!email) redirect('/login');
  return email;
}
