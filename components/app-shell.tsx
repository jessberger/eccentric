'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import { signOut } from '@/app/actions';
import { LanguageSwitch, useLanguage } from './language';

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const links = [
    { href: '/', label: de ? 'Startseite' : 'Home' },
    { href: '/select', label: de ? 'Neues Angebot' : 'Start an offer' },
    { href: '/offers', label: de ? 'Bestehende Angebote' : 'View existing offers' },
  ];

  return <div className="workspace app-shell">
    <header className="workspace-header">
      <Link href="/" className="app-brand" aria-label={de ? 'Startseite' : 'Home'}><Image src={logo} alt="JESSBERGER" sizes="130px" priority /></Link>
      <div className="workspace-account"><LanguageSwitch /><span className="account-email">{email}</span>
        <button type="button" className="text-button" disabled={pending} onClick={() => {
          setFailed(false);
          startTransition(async () => { const response = await signOut(); setFailed(response.failed); });
        }}>{pending ? '…' : de ? 'Abmelden' : 'Sign out'}</button>
      </div>
    </header>
    <div className="app-body">
      <aside className="app-sidebar"><nav aria-label="Navigation">
        {links.map(link => <Link key={link.href} href={link.href} prefetch={false} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}
      </nav></aside>
      <div className="app-content">
        {failed && <p role="alert" className="form-error app-signout-error">{de ? 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.' : 'Sign-out failed. Please try again.'}</p>}
        {children}
      </div>
    </div>
  </div>;
}
