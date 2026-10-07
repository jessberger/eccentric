import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpResults } from '@/components/pump-results';

export const dynamic = 'force-dynamic';

export default async function PumpPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpResults /></AppShell>;
}
