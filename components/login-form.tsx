'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import logo from '@/pics/logo.jpg';
import { signIn, type LoginState } from '@/app/actions';
import { LanguageSwitch, useLanguage } from './language';

const copy = {
  de: { email: 'E-Mail-Adresse', password: 'Passwort', show: 'Passwort anzeigen', hide: 'Passwort ausblenden', submit: 'Anmelden', busy: 'Anmeldung läuft …', invalid: 'E-Mail-Adresse oder Passwort ist nicht korrekt.', unavailable: 'Die Anmeldung ist derzeit nicht möglich. Bitte versuchen Sie es erneut.', rate: 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.', unconfirmed: 'Ihr Konto ist noch nicht freigeschaltet. Bitte wenden Sie sich an Ihren Administrator.' },
  en: { email: 'Email address', password: 'Password', show: 'Show password', hide: 'Hide password', submit: 'Sign in', busy: 'Signing in …', invalid: 'The email address or password is incorrect.', unavailable: 'Sign-in is currently unavailable. Please try again.', rate: 'Too many sign-in attempts. Please wait a moment.', unconfirmed: 'Your account has not been activated. Please contact your administrator.' },
};

export function LoginForm() {
  const { language } = useLanguage();
  const t = copy[language];
  const [state, action, pending] = useActionState(signIn, {} as LoginState);
  const [visible, setVisible] = useState(false);
  return <div className="login-page">
    <header className="login-top"><LanguageSwitch /></header>
    <main className="login-main">
      <section className="login-card" aria-label={t.submit}>
        <div className="brand"><Image src={logo} alt="JESSBERGER pumps and systems" priority sizes="260px" /><p>Eccentric screw pumps</p></div>
        <form action={action} className="login-form" aria-busy={pending}>
          <div className="field"><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="username" placeholder="name@jesspumpen.de" required maxLength={254} disabled={pending} autoCapitalize="none" spellCheck={false} /></div>
          <div className="field"><label htmlFor="password">{t.password}</label><div className="password-input"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} disabled={pending} /><button className="eye-button" type="button" aria-label={visible ? t.hide : t.show} aria-pressed={visible} onClick={() => setVisible(!visible)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg></button></div></div>
          {state.error && <p className="form-error" role="alert">{t[state.error]}</p>}
          <button className="primary-button" type="submit" disabled={pending}><span>{pending ? t.busy : t.submit}</span>{pending ? <span className="spinner" aria-hidden="true"/> : <span aria-hidden="true">→</span>}</button>
        </form>
      </section>
    </main>
  </div>;
}
