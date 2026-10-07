import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpSelector } from '@/components/pump-selector';

export const dynamic = 'force-dynamic';

export default async function SelectPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpSelector /></AppShell>;
}
