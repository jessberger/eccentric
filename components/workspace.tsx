'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import { signOut } from '@/app/actions';
import { LanguageSwitch, useLanguage } from './language';

export function Workspace({ email }: { email: string }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return <div className="workspace">
    <header className="workspace-header"><Image src={logo} alt="JESSBERGER" sizes="150px" /><span className="workspace-product">ECCENTRIC</span><div className="workspace-account"><LanguageSwitch/><span className="account-email">{email}</span><button className="text-button" disabled={pending} onClick={() => { setFailed(false); startTransition(async () => { const result = await signOut(); setFailed(result.failed); }); }}>{pending ? '…' : de ? 'Abmelden' : 'Sign out'}</button></div></header>
    <main className="workspace-main"><p className="eyebrow">{de ? 'ARBEITSBEREICH' : 'WORKSPACE'}</p><h1>{de ? 'Angebote' : 'Quotations'}</h1>{failed && <p role="alert" className="form-error">{de ? 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.' : 'Sign-out failed. Please try again.'}</p>}<section className="empty-state"><span className="empty-icon" aria-hidden="true">▤</span><h2>{de ? 'Ihr Zugang ist eingerichtet.' : 'Your access is ready.'}</h2><p>{de ? 'Die Angebotsverwaltung wird im nächsten Schritt eingerichtet.' : 'Quotation management will be added in the next step.'}</p></section></main>
  </div>;
}
