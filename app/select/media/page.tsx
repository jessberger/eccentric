import { requireUserEmail } from '@/lib/session';
import { AppShell } from '@/components/app-shell';
import { PumpMedia } from '@/components/pump-media';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const email = await requireUserEmail();
  return <AppShell email={email}><PumpMedia /></AppShell>;
}
