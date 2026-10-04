'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import pdfLogo from '@/pics/pdf.png';
import lexwareLogo from '@/pics/lexware.png';
import { signOut } from '@/app/actions';
import { loadOfferBatch } from '@/app/offers/actions';
import { offerFields, offerGroups } from '@/lib/offer-groups';
import { OFFER_PAGE_SIZE, type Offer, type OfferLoadError } from '@/lib/offers';
import { LanguageSwitch, useLanguage } from './language';
import { MultiSelectFilter } from './multi-select-filter';
import { EditOfferDialog } from './edit-offer-dialog';
import { ReviseOfferDialog } from './revise-offer-dialog';
import { DeleteOfferDialog } from './delete-offer-dialog';

const highlightedFields = new Set(['offer_date', 'last_modified', 'medium', 'flow_rate', 'pump_stator', 'drive_power']);

const offerNumberOrder = new Intl.Collator('en', { numeric: true });
function compareOffers(a: Offer, b: Offer) {
  // Database DATE values use YYYY-MM-DD, so text order matches date order.
  const left = a.values.offer_date || a.values.last_modified || '';
  const right = b.values.offer_date || b.values.last_modified || '';
  return right.localeCompare(left) || offerNumberOrder.compare(b.values.offer_no || '', a.values.offer_no || '') || a.id.localeCompare(b.id);
}

const emptyOffer: Offer = { id: '', recordVersion: 1, revisionIndex: 0, values: {} };

const copy = {
  en: { search: 'Search offers…', filters: 'Filters', clear: 'Clear filters', all: 'Contains…', inspect: 'Inspect', edit: 'Edit', revise: 'Revise', copy: 'Copy', new: 'New offer', close: 'Close', count: 'offers', empty: 'No matching offers.', noData: 'No offers are available.', previous: 'Previous', next: 'Next', logout: 'Sign out', signoutError: 'Sign-out failed. Please try again.', refresh: 'Refresh', loading: 'Loading…', retry: 'Try again', login: 'Sign in', readOnly: 'Saving will be enabled in the next step.', errors: { auth: 'Your session has expired. Please sign in again.', configuration: 'The database connection is not configured.', schema: 'The offer table or its columns could not be found.', permission: 'Your account does not have permission to read these offers.', unavailable: 'Offers could not be loaded. Please try again.', invalid: 'Please shorten your search or filter text.' } },
  de: { search: 'Angebote suchen…', filters: 'Filter', clear: 'Filter zurücksetzen', all: 'Enthält…', inspect: 'Ansehen', edit: 'Bearbeiten', revise: 'Revidieren', copy: 'Kopieren', new: 'Neues Angebot', close: 'Schließen', count: 'Angebote', empty: 'Keine passenden Angebote.', noData: 'Keine Angebote verfügbar.', previous: 'Zurück', next: 'Weiter', logout: 'Abmelden', signoutError: 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.', refresh: 'Aktualisieren', loading: 'Wird geladen…', retry: 'Erneut versuchen', login: 'Anmelden', readOnly: 'Speichern wird im nächsten Schritt aktiviert.', errors: { auth: 'Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.', configuration: 'Die Datenbankverbindung ist nicht eingerichtet.', schema: 'Die Angebotstabelle oder ihre Spalten wurden nicht gefunden.', permission: 'Ihr Konto hat keine Leseberechtigung für diese Angebote.', unavailable: 'Angebote konnten nicht geladen werden. Bitte erneut versuchen.', invalid: 'Bitte kürzen Sie Ihren Such- oder Filtertext.' } },
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

export function Workspace({ email }: { email: string }) {
  const { language } = useLanguage();
  const t = copy[language];
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<OfferLoadError | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [opened, setOpened] = useState<Offer | null>(null);
  const [revising, setRevising] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);
  const [newOffer, setNewOffer] = useState(false);
  const [copying, setCopying] = useState<Offer | null>(null);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const activeFilters = Object.entries(filters).filter(([, values]) => values.length > 0);
  const group = offerGroups.find(value => value.id === activeGroup);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null); setOffers([]); setOpened(null); setEditing(null); setRevising(null); setDeleting(null); setCopying(null); setNewOffer(false);
    setProgress({ loaded: 0, total: 0 }); setPage(1);
    async function loadAll() {
      const collected: Offer[] = [];
      const ids = new Set<string>();
      let cursor: string | null = null;
      let expected: number | null = null;
      try {
        do {
          const batch = await loadOfferBatch(cursor);
          if (cancelled) return;
          if (batch.error) { setError(batch.error); setLoading(false); return; }
          if (expected === null) expected = batch.remaining;
          // Never publish an incomplete cache if the dataset changes during loading.
          if (collected.length + batch.remaining !== expected) throw new Error('Dataset changed');
          for (const offer of batch.offers) {
            if (ids.has(offer.id)) throw new Error('Duplicate batch');
            ids.add(offer.id); collected.push(offer);
          }
          if (batch.nextCursor && batch.nextCursor === cursor) throw new Error('Cursor did not advance');
          cursor = batch.nextCursor;
          setProgress({ loaded: collected.length, total: expected });
        } while (cursor);
        if (collected.length !== expected) throw new Error('Incomplete dataset');
        collected.sort(compareOffers);
        if (!cancelled) { setOffers(collected); setLoading(false); }
      } catch { if (!cancelled) { setError('unavailable'); setLoading(false); } }
    }
    void loadAll();
    return () => { cancelled = true; };
  }, [retry]);

  const options = useMemo(() => {
    const order = new Intl.Collator(language, { numeric: true });
    return Object.fromEntries(offerFields.map(field => [field.key, Array.from(new Set(offers.map(offer => offer.values[field.key] ?? ''))).sort(order.compare)]));
  }, [offers, language]);
  const indexed = useMemo(() => offers.map(offer => ({ offer, text: Object.values(offer.values).join(' ').toLocaleLowerCase() })), [offers]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const selections = Object.entries(filters).filter(([, values]) => values.length > 0).map(([key, values]) => ({ key, values: new Set(values) }));
    return indexed.filter(({ offer, text }) => (!term || text.includes(term)) && selections.every(({ key, values }) => values.has(offer.values[key] ?? ''))).map(({ offer }) => offer);
  }, [indexed, query, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / OFFER_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * OFFER_PAGE_SIZE, currentPage * OFFER_PAGE_SIZE);
  function updateFilter(key: string, values: string[]) { setFilters(previous => ({ ...previous, [key]: values })); setPage(1); }
  function resetFilters() { setFilters({}); setQuery(''); setPage(1); }
  function applySavedOffer(saved: Offer) {
    setOffers(previous => {
      const updated = [...previous.filter(offer => offer.id !== saved.id), saved];
      return updated.sort(compareOffers);
    });
    setEditing(null);
    if (revising || copying || newOffer) { setNewOffer(false); setRevising(null); setCopying(null); setFilters({}); setQuery(saved.values.offer_no); setPage(1); }
  }

  return <div className="workspace">
    <header className="workspace-header"><Image src={logo} alt="JESSBERGER" sizes="130px" /><div className="workspace-account"><LanguageSwitch /><span className="account-email">{email}</span><button className="text-button" disabled={pending} onClick={() => { setFailed(false); startTransition(async () => { const response = await signOut(); setFailed(response.failed); }); }}>{pending ? '…' : t.logout}</button></div></header>
    <main className="offers-main">
      {failed && <p role="alert" className="form-error">{t.signoutError}</p>}
      <div className="offers-toolbar">
        <label className="offer-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" disabled={loading || !!error} maxLength={100} value={query} placeholder={t.search} aria-label={t.search} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label>
        <span className="offer-count" role="status">{loading ? `${t.loading} ${progress.loaded.toLocaleString(language)} / ${progress.total.toLocaleString(language)}` : error ? '—' : `${filtered.length.toLocaleString(language)} ${t.count}`}</span>
        <button type="button" className="outline-button" disabled={loading} onClick={() => setRetry(value => value + 1)}>{t.refresh}</button>
        <button type="button" className="outline-button" disabled={!query && activeFilters.length === 0} onClick={resetFilters}>{t.clear}</button>
        <span className="new-offer"><button type="button" className="solid-button" disabled={loading || !!error} onClick={() => setNewOffer(true)}><span aria-hidden="true">+</span> {t.new}</button></span>
      </div>
      <section className="filter-area" aria-label={t.filters}>
        <div className="filter-groups">{offerGroups.map(item => {
          const count = item.fields.filter(field => filters[field.key]?.length).length;
          return <button key={item.id} type="button" className={`filter-group-button${activeGroup === item.id ? ' selected' : ''}`} aria-expanded={activeGroup === item.id} aria-controls={activeGroup === item.id ? `filters-${item.id}` : undefined} onClick={() => setActiveGroup(activeGroup === item.id ? null : item.id)}><span>{item[language]}</span><span className="filter-indicator">{count > 0 && <b>{count}</b>}<span aria-hidden="true">{activeGroup === item.id ? '−' : '+'}</span></span></button>;
        })}</div>
        {group && <div className="filter-panel" id={`filters-${group.id}`}>{group.fields.map(field => <MultiSelectFilter key={field.key} label={field[language]} options={options[field.key] ?? []} selected={filters[field.key] ?? []} disabled={loading || !!error} onChange={values => updateFilter(field.key, values)} />)}</div>}
      </section>
      <div className="offer-list" aria-busy={loading}>
        {loading ? <div className="offers-empty">{t.loading}</div> : error ? <div className="offers-empty"><p role="alert">{t.errors[error]}</p>{error === 'auth' ? <a className="outline-button" href="/login">{t.login}</a> : <button type="button" className="outline-button" onClick={() => setRetry(value => value + 1)}>{t.retry}</button>}</div> : <>
          {visible.map(offer => <article className="offer-row" key={offer.id} aria-label={`${offer.values.offer_no || '—'} ${offer.values.customer_name || ''}`}>
            <div className="offer-boxes">{offerGroups.map(item => <section className={`offer-box offer-box-${item.id}`} key={item.id}>
              <h2>{item[language]}</h2>
              <dl>{item.fields.filter(field => field.preview).map(field => <div key={field.key} className={highlightedFields.has(field.key) ? 'offer-field-highlight' : undefined}><dt>{field[language]}</dt><dd>{offer.values[field.key] || '—'}</dd></div>)}</dl>
            </section>)}</div>
            <div className="offer-actions"><button type="button" className="inspect-button" onClick={() => setOpened(offer)}>{t.inspect}</button><button type="button" onClick={() => setEditing(offer)}>{t.edit}</button><button type="button" onClick={() => setRevising(offer)}>{t.revise}</button><button type="button" onClick={() => setCopying(offer)}>{t.copy}</button>
              <div className="offer-print-actions" role="group" aria-label={language === 'de' ? 'Drucken' : 'Print'}>
                <button type="button" className="offer-print-button" disabled aria-label="Print PDF" title={language === 'de' ? 'PDF – wird im nächsten Schritt aktiviert' : 'PDF – available in the next step'}><Image src={pdfLogo} alt="" width={22} height={22} /><span>Print</span></button>
                <button type="button" className="offer-print-button" disabled aria-label="Print Lexware" title={language === 'de' ? 'Lexware – wird später aktiviert' : 'Lexware – available later'}><Image src={lexwareLogo} alt="" width={22} height={22} /><span>Print</span></button>
              </div><button type="button" className="delete-offer-button" onClick={() => setDeleting(offer)}>{language === 'de' ? 'Löschen' : 'Delete'}</button></div>
          </article>)}
          {filtered.length === 0 && <div className="offers-empty"><p>{query || activeFilters.length > 0 ? t.empty : t.noData}</p>{(query || activeFilters.length > 0) && <button type="button" className="outline-button" onClick={resetFilters}>{t.clear}</button>}</div>}
        </>}
      </div>
      {!loading && !error && pageCount > 1 && <nav className="offer-pagination" aria-label={language === 'de' ? 'Seiten' : 'Pages'}><button type="button" className="outline-button" disabled={loading || currentPage === 1} onClick={() => setPage(Math.max(1, currentPage - 1))}>{t.previous}</button><span>{currentPage} / {pageCount}</span><button type="button" className="outline-button" disabled={loading || currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>{t.next}</button></nav>}
    </main>
    {deleting && <DeleteOfferDialog key={deleting.id} offer={deleting} onClose={() => setDeleting(null)} onDeleted={id => { setOffers(previous => previous.filter(offer => offer.id !== id)); setDeleting(null); }} />}
    {opened && <OfferDialog key={opened.id} offer={opened} onClose={() => setOpened(null)} />}
    {revising && <ReviseOfferDialog key={revising.id} offer={revising} onClose={() => setRevising(null)} onSaved={applySavedOffer} />}
    {newOffer && <EditOfferDialog key="new-offer" offer={emptyOffer} newOffer onClose={() => setNewOffer(false)} onSaved={applySavedOffer} />}
    {copying && <EditOfferDialog key={`copy-${copying.id}`} offer={copying} copy onClose={() => setCopying(null)} onSaved={applySavedOffer} />}
    {editing && <EditOfferDialog key={`${editing.id}-${editing.recordVersion}`} offer={editing} onClose={() => setEditing(null)} onSaved={applySavedOffer} />}
  </div>;
}
