import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const supabase = await supabaseServer();
  let authenticated = false;
  if (supabase) {
    try { const { data, error } = await supabase.auth.getUser(); authenticated = !error && !!data.user; } catch {}
  }
  if (authenticated) redirect('/');
  return <LoginForm />;
}
