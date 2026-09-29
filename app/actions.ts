'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';

export type LoginState = { error?: 'invalid' | 'unavailable' | 'rate' | 'unconfirmed' };

export async function signIn(_previous: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password || email.length > 254 || password.length > 1024) return { error: 'invalid' };
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { error: 'unavailable' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return { error: 'rate' };
      if (error.code === 'email_not_confirmed') return { error: 'unconfirmed' };
      return { error: error.status && error.status >= 500 ? 'unavailable' : 'invalid' };
    }
  } catch { return { error: 'unavailable' }; }
  redirect('/offers');
}

export async function signOut(): Promise<{ failed: boolean }> {
  try {
    const supabase = await supabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) return { failed: true };
    }
  } catch { return { failed: true }; }
  redirect('/login');
}
