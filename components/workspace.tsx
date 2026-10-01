'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import { signOut } from '@/app/actions';
import { loadOffers } from '@/app/offers/actions';
import { offerFields, offerGroups } from '@/lib/offer-groups';
import { OFFER_PAGE_SIZE, type Offer, type OfferResult } from '@/lib/offers';
import { LanguageSwitch, useLanguage } from './language';

const copy = {
  en: { search: 'Search offers…', filters: 'Filters', clear: 'Clear filters', all: 'Contains…', inspect: 'Inspect', edit: 'Edit', revise: 'Revise', copy: 'Copy', new: 'New offer', close: 'Close', count: 'offers', empty: 'No matching offers.', noData: 'No offers are available.', previous: 'Previous', next: 'Next', logout: 'Sign out', signoutError: 'Sign-out failed. Please try again.', loading: 'Loading…', retry: 'Try again', login: 'Sign in', readOnly: 'Saving will be enabled in the next step.', errors: { auth: 'Your session has expired. Please sign in again.', configuration: 'The database connection is not configured.', schema: 'The offer table or its columns could not be found.', permission: 'Your account does not have permission to read these offers.', unavailable: 'Offers could not be loaded. Please try again.', invalid: 'Please shorten your search or filter text.' } },
  de: { search: 'Angebote suchen…', filters: 'Filter', clear: 'Filter zurücksetzen', all: 'Enthält…', inspect: 'Ansehen', edit: 'Bearbeiten', revise: 'Revidieren', copy: 'Kopieren', new: 'Neues Angebot', close: 'Schließen', count: 'Angebote', empty: 'Keine passenden Angebote.', noData: 'Keine Angebote verfügbar.', previous: 'Zurück', next: 'Weiter', logout: 'Abmelden', signoutError: 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.', loading: 'Wird geladen…', retry: 'Erneut versuchen', login: 'Anmelden', readOnly: 'Speichern wird im nächsten Schritt aktiviert.', errors: { auth: 'Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.', configuration: 'Die Datenbankverbindung ist nicht eingerichtet.', schema: 'Die Angebotstabelle oder ihre Spalten wurden nicht gefunden.', permission: 'Ihr Konto hat keine Leseberechtigung für diese Angebote.', unavailable: 'Angebote konnten nicht geladen werden. Bitte erneut versuchen.', invalid: 'Bitte kürzen Sie Ihren Such- oder Filtertext.' } },
};

function OfferDialog({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const { language } = useLanguage();
  const t = copy[language];
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  return <dialog ref={ref} className="offer-dialog" aria-labelledby="offer-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="offer-dialog-content">
      <header className="offer-dialog-header">
        <div><h2 id="offer-dialog-title">{t.inspect}{offer.values.offer_no ? ` · ${offer.values.offer_no}` : ''}</h2><p>{offer.values.customer_name || '—'}</p></div>
        <button type="button" className="dialog-close" aria-label={t.close} onClick={onClose} autoFocus>×</button>
      </header>
      <div className="offer-dialog-body">
        {offerGroups.map(group => <section className="detail-group" key={group.id} aria-labelledby={`detail-${group.id}`}>
          <h3 id={`detail-${group.id}`}>{group[language]}</h3>
          <dl className="detail-values">{group.fields.map(field => <div key={field.key}><dt>{field[language]}</dt><dd>{offer.values[field.key] || '—'}</dd></div>)}</dl>
        </section>)}
      </div>
      <footer className="offer-dialog-footer"><button type="button" className="outline-button" onClick={onClose}>{t.close}</button></footer>
    </div>
  </dialog>;
}

export function Workspace({ email, initialResult }: { email: string; initialResult: OfferResult }) {
  const { language } = useLanguage();
  const t = copy[language];
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<OfferResult>(initialResult);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [opened, setOpened] = useState<Offer | null>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify({ query, filters, page, retry });
  const settledKey = useRef(requestKey);
  const activeFilters = Object.entries(filters).filter(([, value]) => value.trim());
  const group = offerGroups.find(value => value.id === activeGroup);
  const pageCount = Math.max(1, Math.ceil(result.count / OFFER_PAGE_SIZE));

  useEffect(() => {
    if (requestKey === settledKey.current) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      let response: OfferResult;
      try { response = await loadOffers({ query, filters, page }); }
      catch { response = { offers: [], count: 0, error: 'unavailable' }; }
      if (!cancelled) { settledKey.current = requestKey; setResult(response); setLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [requestKey, query, filters, page]);

  function updateFilter(key: string, value: string) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); }
  function resetFilters() { setFilters({}); setQuery(''); setPage(1); }

  return <div className="workspace">
    <header className="workspace-header"><Image src={logo} alt="JESSBERGER" sizes="130px" /><div className="workspace-account"><LanguageSwitch /><span className="account-email">{email}</span><button className="text-button" disabled={pending} onClick={() => { setFailed(false); startTransition(async () => { const response = await signOut(); setFailed(response.failed); }); }}>{pending ? '…' : t.logout}</button></div></header>
    <main className="offers-main">
      {failed && <p role="alert" className="form-error">{t.signoutError}</p>}
      <div className="offers-toolbar">
        <label className="offer-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" maxLength={100} value={query} placeholder={t.search} aria-label={t.search} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label>
        <span className="offer-count" role="status">{loading ? t.loading : result.error ? '—' : `${result.count.toLocaleString(language)} ${t.count}`}</span>
        <span className="new-offer" title={t.readOnly}><button type="button" className="solid-button" disabled><span aria-hidden="true">+</span> {t.new}</button></span>
      </div>
      <section className="filter-area" aria-label={t.filters}>
        <div className="filter-groups">{offerGroups.map(item => {
          const count = item.fields.filter(field => filters[field.key]?.trim()).length;
          return <button key={item.id} type="button" className={`filter-group-button${activeGroup === item.id ? ' selected' : ''}`} aria-expanded={activeGroup === item.id} aria-controls={activeGroup === item.id ? `filters-${item.id}` : undefined} onClick={() => setActiveGroup(activeGroup === item.id ? null : item.id)}><span>{item[language]}</span><span className="filter-indicator">{count > 0 && <b>{count}</b>}<span aria-hidden="true">{activeGroup === item.id ? '−' : '+'}</span></span></button>;
        })}</div>
        {group && <div className="filter-panel" id={`filters-${group.id}`}>{group.fields.map(field => <label key={field.key} htmlFor={`filter-${field.key}`}><span>{field[language]}</span><input id={`filter-${field.key}`} type="text" maxLength={160} value={filters[field.key] ?? ''} placeholder={t.all} onChange={event => updateFilter(field.key, event.target.value)} /></label>)}</div>}
        {(activeFilters.length > 0 || query) && <div className="active-filters">{activeFilters.map(([key, value]) => <button type="button" key={key} onClick={() => updateFilter(key, '')} aria-label={`${t.clear}: ${offerFields.find(field => field.key === key)?.[language]}`}><span>{offerFields.find(field => field.key === key)?.[language]}: {value}</span><span aria-hidden="true">×</span></button>)}<button type="button" className="clear-filters" onClick={resetFilters}>{t.clear}</button></div>}
      </section>
      <div className="offer-list" aria-busy={loading}>
        {loading ? <div className="offers-empty">{t.loading}</div> : result.error ? <div className="offers-empty"><p role="alert">{t.errors[result.error]}</p>{result.error === 'auth' ? <a className="outline-button" href="/login">{t.login}</a> : <button type="button" className="outline-button" onClick={() => setRetry(value => value + 1)}>{t.retry}</button>}</div> : <>
          {result.offers.map(offer => <article className="offer-row" key={offer.id} aria-label={`${offer.values.offer_no || '—'} ${offer.values.customer_name || ''}`}>
            <div className="offer-boxes">{offerGroups.map(item => <section className={`offer-box offer-box-${item.id}`} key={item.id}>
              <h2>{item[language]}</h2>
              <dl>{item.fields.filter(field => field.preview).map(field => <div key={field.key}><dt>{field[language]}</dt><dd>{offer.values[field.key] || '—'}</dd></div>)}</dl>
            </section>)}</div>
            <div className="offer-actions"><button type="button" className="inspect-button" onClick={() => setOpened(offer)}>{t.inspect}</button>{(['edit', 'revise', 'copy'] as const).map(mode => <span key={mode} title={t.readOnly}><button type="button" disabled>{t[mode]}</button></span>)}</div>
          </article>)}
          {result.offers.length === 0 && <div className="offers-empty"><p>{query || activeFilters.length > 0 ? t.empty : t.noData}</p>{(query || activeFilters.length > 0) && <button type="button" className="outline-button" onClick={resetFilters}>{t.clear}</button>}</div>}
        </>}
      </div>
      {!result.error && pageCount > 1 && <nav className="offer-pagination" aria-label={language === 'de' ? 'Seiten' : 'Pages'}><button type="button" className="outline-button" disabled={loading || page === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>{t.previous}</button><span>{page} / {pageCount}</span><button type="button" className="outline-button" disabled={loading || page >= pageCount} onClick={() => setPage(value => value + 1)}>{t.next}</button></nav>}
    </main>
    {opened && <OfferDialog key={opened.id} offer={opened} onClose={() => setOpened(null)} />}
  </div>;
}
