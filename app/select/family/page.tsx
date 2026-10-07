import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpFamilies } from '@/components/pump-families';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpFamilies /></AppShell>;
}
