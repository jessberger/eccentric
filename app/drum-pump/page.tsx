import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpSoon } from '@/components/pump-soon';

export const dynamic = 'force-dynamic';

export default async function DrumPumpPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpSoon name="Drum Pump" /></AppShell>;
}
