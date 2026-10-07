'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import { signOut } from '@/app/actions';
import { LanguageSwitch, useLanguage } from './language';
import { usePumpSelection } from './pump-selection';

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const pathname = usePathname();
  const { resetSelection } = usePumpSelection();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const screwActive = pathname === '/select' || pathname.startsWith('/select/');

  return <div className="workspace app-shell">
    <header className="workspace-header">
      <Link href="/" onNavigate={resetSelection} className="app-brand" aria-label={de ? 'Startseite' : 'Home'}><Image src={logo} alt="JESSBERGER" sizes="130px" priority /></Link>
      <div className="workspace-account"><LanguageSwitch /><span className="account-email">{email}</span>
        <button type="button" className="text-button" disabled={pending} onClick={() => {
          setFailed(false);
          resetSelection();
          startTransition(async () => { const response = await signOut(); setFailed(response.failed); });
        }}>{pending ? '…' : de ? 'Abmelden' : 'Sign out'}</button>
      </div>
    </header>
    <div className="app-body">
      <aside className="app-sidebar"><nav aria-label="Navigation">
        <Link href="/" onNavigate={resetSelection} prefetch={false} aria-current={pathname === '/' ? 'page' : undefined}>{de ? 'Startseite' : 'Home'}</Link>
        <Link href="/hand-pump" onNavigate={resetSelection} prefetch={false} aria-current={pathname === '/hand-pump' ? 'page' : undefined}>Hand Pump</Link>
        <Link href="/drum-pump" onNavigate={resetSelection} prefetch={false} aria-current={pathname === '/drum-pump' ? 'page' : undefined}>Drum Pump</Link>
        <div className="sidebar-pump-group">
          <Link href="/select" onNavigate={resetSelection} prefetch={false} className={screwActive ? 'sidebar-pump-active' : undefined}>Screw Pump</Link>
          {screwActive && <div className="sidebar-steps">
            <Link href="/select" prefetch={false} aria-current={pathname === '/select' ? 'page' : undefined}><span>{de ? 'Schritt 1' : 'Step 1'}</span><small>{de ? 'Ausführung / Fördermenge / Druck' : 'Type / Flow rate / Pressure'}</small></Link>
            <Link href="/select/media" prefetch={false} aria-current={pathname === '/select/media' ? 'page' : undefined}><span>{de ? 'Schritt 2' : 'Step 2'}</span><small>{de ? 'Viskosität / Abrasivität' : 'Viscosity / Abrasivity'}</small></Link>
          </div>}
        </div>
        <Link href="/offers" className="sidebar-offers" prefetch={false} aria-current={pathname === '/offers' ? 'page' : undefined}>{de ? 'Bestehende Angebote' : 'View existing offers'}</Link>
      </nav></aside>
      <div className="app-content">
        {failed && <p role="alert" className="form-error app-signout-error">{de ? 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.' : 'Sign-out failed. Please try again.'}</p>}
        {children}
      </div>
    </div>
  </div>;
}
