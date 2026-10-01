'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import logo from '@/pics/logo.jpg';
import { signOut } from '@/app/actions';
import { offerFields, offerGroups } from '@/lib/offer-groups';
import { initialOffers, revisionLabel, type Offer } from '@/lib/offers';
import { LanguageSwitch, useLanguage } from './language';

type Mode = 'inspect' | 'edit' | 'revise' | 'copy' | 'new';
type OpenOffer = { mode: Mode; offer: Offer };
const copy = {
  en: { search: 'Search offers…', filters: 'Filters', clear: 'Clear filters', all: 'All values', inspect: 'Inspect', edit: 'Edit', revise: 'Revise', copy: 'Copy', new: 'New offer', close: 'Close', cancel: 'Cancel', apply: 'Apply to preview', preview: 'Preview', previewHint: 'Sample data. Changes last until the page is reloaded.', count: 'offers', empty: 'No matching offers.', revision: 'Revision', previous: 'Previous', next: 'Next', logout: 'Sign out', signoutError: 'Sign-out failed. Please try again.', dialogNote: 'Preview only. Changes are not saved to Supabase.' },
  de: { search: 'Angebote suchen…', filters: 'Filter', clear: 'Filter zurücksetzen', all: 'Alle Werte', inspect: 'Ansehen', edit: 'Bearbeiten', revise: 'Revidieren', copy: 'Kopieren', new: 'Neues Angebot', close: 'Schließen', cancel: 'Abbrechen', apply: 'In Vorschau übernehmen', preview: 'Vorschau', previewHint: 'Beispieldaten. Änderungen bleiben bis zum Neuladen der Seite erhalten.', count: 'Angebote', empty: 'Keine passenden Angebote.', revision: 'Revision', previous: 'Zurück', next: 'Weiter', logout: 'Abmelden', signoutError: 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.', dialogNote: 'Nur Vorschau. Änderungen werden nicht in Supabase gespeichert.' },
};

function OfferDialog({ item, onClose, onApply }: { item: OpenOffer; onClose: () => void; onApply: (offer: Offer, mode: Mode) => void }) {
  const { language } = useLanguage();
  const t = copy[language];
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(item.offer);
  const editing = item.mode !== 'inspect';
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  return <dialog ref={ref} className="offer-dialog" aria-labelledby="offer-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); if (editing) onApply(draft, item.mode); }}>
      <header className="offer-dialog-header">
        <div><h2 id="offer-dialog-title">{t[item.mode]}{draft.values.offer_no ? ` · ${draft.values.offer_no}` : ''}{draft.revision ? ` ${draft.revision}` : ''}</h2><p>{draft.values.customer_name || '—'}</p></div>
        <button type="button" className="dialog-close" aria-label={t.close} onClick={onClose} autoFocus>×</button>
      </header>
      <div className="offer-dialog-body">
        {offerGroups.map(group => <section className="detail-group" key={group.id} aria-labelledby={`detail-${group.id}`}>
          <h3 id={`detail-${group.id}`}>{group[language]}</h3>
          {editing ? <div className="detail-inputs">{group.fields.map(field => <label key={field.key} htmlFor={`edit-${field.key}`}><span>{field[language]}</span><textarea id={`edit-${field.key}`} rows={field.key === 'file_name_on_lexware' || field.key === 'medium' ? 2 : 1} value={draft.values[field.key] ?? ''} onChange={event => setDraft(current => ({ ...current, values: { ...current.values, [field.key]: event.target.value } }))} /></label>)}</div>
            : <dl className="detail-values">{group.fields.map(field => <div key={field.key}><dt>{field[language]}</dt><dd>{draft.values[field.key] || '—'}</dd></div>)}</dl>}
        </section>)}
      </div>
      <footer className="offer-dialog-footer">
        {editing && <p>{t.dialogNote}</p>}
        <div><button type="button" className="outline-button" onClick={onClose}>{editing ? t.cancel : t.close}</button>{editing && <button type="submit" className="solid-button">{t.apply}</button>}</div>
      </footer>
    </form>
  </dialog>;
}

export function Workspace({ email }: { email: string }) {
  const { language } = useLanguage();
  const t = copy[language];
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [opened, setOpened] = useState<OpenOffer | null>(null);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState(false);
  const pageSize = 20;
  const activeFilters = Object.entries(filters).filter(([, value]) => value.trim());
  const filtered = useMemo(() => {
    const contains = (value: string, match: string) => value.toLocaleLowerCase().includes(match.trim().toLocaleLowerCase());
    return offers.filter(offer => (!query.trim() || contains([...Object.values(offer.values), offer.revision].join(' '), query)) && Object.entries(filters).every(([key, value]) => !value.trim() || contains(offer.values[key] ?? '', value)));
  }, [offers, query, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePage = Math.min(page, pageCount);
  const visible = filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const group = offerGroups.find(value => value.id === activeGroup);

  function updateFilter(key: string, value: string) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); }
  function resetFilters() { setFilters({}); setQuery(''); setPage(1); }
  function open(mode: Mode, source?: Offer) {
    setNotice(false);
    if (source && (mode === 'inspect' || mode === 'edit')) { setOpened({ mode, offer: { ...source, values: { ...source.values } } }); return; }
    const id = crypto.randomUUID();
    const values: Record<string, string> = source ? { ...source.values } : {};
    let revision = '';
    let family = id;
    if (mode === 'revise' && source) {
      family = source.family;
      const used = new Set(offers.filter(offer => offer.family === family).map(offer => offer.revision));
      let index = 1;
      while (used.has(revisionLabel(index))) index++;
      revision = revisionLabel(index);
    } else {
      for (const key of offerGroups[0].fields.map(field => field.key)) values[key] = '';
    }
    values.offer_date = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    setOpened({ mode, offer: { id, family, revision, values } });
  }

  function apply(offer: Offer, mode: Mode) {
    setOffers(previous => mode === 'edit' ? previous.map(existing => existing.id === offer.id ? offer : existing) : [offer, ...previous]);
    resetFilters(); setOpened(null); setNotice(true);
  }

  return <div className="workspace">
    <header className="workspace-header"><Image src={logo} alt="JESSBERGER" sizes="130px" /><div className="workspace-account"><LanguageSwitch /><span className="account-email">{email}</span><button className="text-button" disabled={pending} onClick={() => { setFailed(false); startTransition(async () => { const result = await signOut(); setFailed(result.failed); }); }}>{pending ? '…' : t.logout}</button></div></header>
    <main className="offers-main">
      {failed && <p role="alert" className="form-error">{t.signoutError}</p>}
      <div className="offers-toolbar">
        <label className="offer-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" value={query} placeholder={t.search} aria-label={t.search} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label>
        <span className="preview-tag" title={t.previewHint}>{t.preview}</span>
        <span className="offer-count" role="status">{filtered.length} {t.count}</span>
        <button type="button" className="solid-button new-offer" onClick={() => open('new')}><span aria-hidden="true">+</span> {t.new}</button>
      </div>
      <section className="filter-area" aria-label={t.filters}>
        <div className="filter-groups">{offerGroups.map(item => {
          const count = item.fields.filter(field => filters[field.key]?.trim()).length;
          return <button key={item.id} type="button" className={`filter-group-button${activeGroup === item.id ? ' selected' : ''}`} aria-expanded={activeGroup === item.id} aria-controls={activeGroup === item.id ? `filters-${item.id}` : undefined} onClick={() => setActiveGroup(activeGroup === item.id ? null : item.id)}><span>{item[language]}</span><span className="filter-indicator">{count > 0 && <b>{count}</b>}<span aria-hidden="true">{activeGroup === item.id ? '−' : '+'}</span></span></button>;
        })}</div>
        {group && <div className="filter-panel" id={`filters-${group.id}`}>{group.fields.map(field => <label key={field.key} htmlFor={`filter-${field.key}`}><span>{field[language]}</span><input id={`filter-${field.key}`} type="text" value={filters[field.key] ?? ''} placeholder={t.all} onChange={event => updateFilter(field.key, event.target.value)} list={`values-${field.key}`} /><datalist id={`values-${field.key}`}>{Array.from(new Set(offers.map(offer => offer.values[field.key]).filter(Boolean))).sort().map(value => <option key={value} value={value} />)}</datalist></label>)}</div>}
        {(activeFilters.length > 0 || query) && <div className="active-filters">{activeFilters.map(([key, value]) => <button type="button" key={key} onClick={() => updateFilter(key, '')} aria-label={`${t.clear}: ${offerFields.find(field => field.key === key)?.[language]}`}><span>{offerFields.find(field => field.key === key)?.[language]}: {value}</span><span aria-hidden="true">×</span></button>)}<button type="button" className="clear-filters" onClick={resetFilters}>{t.clear}</button></div>}
      </section>
      {notice && <p className="preview-notice" role="status">{t.dialogNote}</p>}
      <div className="offer-list">
        {visible.map(offer => <article className="offer-row" key={offer.id} aria-label={`${offer.values.offer_no || '—'} ${offer.revision} ${offer.values.customer_name || ''}`}>
          <div className="offer-boxes">{offerGroups.map(item => <section className={`offer-box offer-box-${item.id}`} key={item.id}>
            <h2>{item[language]}{item.id === 'customer' && offer.revision && <span className="revision-badge" title={t.revision}>{offer.revision}</span>}</h2>
            <dl>{item.fields.filter(field => field.preview).map(field => <div key={field.key}><dt>{field[language]}</dt><dd>{offer.values[field.key] || '—'}</dd></div>)}</dl>
          </section>)}</div>
          <div className="offer-actions">{(['inspect', 'edit', 'revise', 'copy'] as const).map(mode => <button type="button" key={mode} className={mode === 'inspect' ? 'inspect-button' : ''} onClick={() => open(mode, offer)}>{t[mode]}</button>)}</div>
        </article>)}
        {visible.length === 0 && <div className="offers-empty"><p>{t.empty}</p>{(query || activeFilters.length > 0) && <button type="button" className="outline-button" onClick={resetFilters}>{t.clear}</button>}</div>}
      </div>
      {pageCount > 1 && <nav className="offer-pagination" aria-label={language === 'de' ? 'Seiten' : 'Pages'}><button type="button" className="outline-button" disabled={visiblePage === 1} onClick={() => setPage(visiblePage - 1)}>{t.previous}</button><span>{visiblePage} / {pageCount}</span><button type="button" className="outline-button" disabled={visiblePage === pageCount} onClick={() => setPage(visiblePage + 1)}>{t.next}</button></nav>}
    </main>
    {opened && <OfferDialog key={`${opened.mode}-${opened.offer.id}`} item={opened} onClose={() => setOpened(null)} onApply={apply} />}
  </div>;
}
