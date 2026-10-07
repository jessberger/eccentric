import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpModels } from '@/components/pump-models';

export const dynamic = 'force-dynamic';

export default async function SelectionSummaryPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpModels completed /></AppShell>;
}
