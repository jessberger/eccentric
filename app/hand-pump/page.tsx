import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpSoon } from '@/components/pump-soon';

export const dynamic = 'force-dynamic';

export default async function HandPumpPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpSoon name="Hand Pump" /></AppShell>;
}
