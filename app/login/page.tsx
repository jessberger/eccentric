import { redirect } from 'next/navigation';
import { supabaseServer, authConfig } from '@/lib/supabase';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const supabase = await supabaseServer();
  let authenticated = false;
  if (supabase) {
    try { const { data, error } = await supabase.auth.getUser(); authenticated = !error && !!data.user; } catch {}
  }
  if (authenticated) redirect('/offers');
  return <LoginForm configured={!!authConfig()} />;
}
