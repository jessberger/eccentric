"use client";

import { useEffect, useRef, useState } from 'react';
import { loadRevisionContext } from '@/app/offers/actions';
import type { Offer, RevisionContext } from '@/lib/offers';
import { useLanguage } from './language';
import { EditOfferDialog } from './edit-offer-dialog';

export function ReviseOfferDialog({ offer, onClose, onSaved }: { offer: Offer; onClose: () => void; onSaved: (offer: Offer) => void }) {
  const [draft, setDraft] = useState<{ source: Offer; offerNo: string } | null>(null);
  return draft ? <EditOfferDialog offer={draft.source} revision={{ offerNo: draft.offerNo }} onClose={onClose} onSaved={onSaved} />
    : <RevisionNumberDialog offer={offer} onClose={onClose} onContinue={(context, offerNo) => setDraft({ source: context.source, offerNo })} />;
}

function RevisionNumberDialog({ offer, onClose, onContinue }: { offer: Offer; onClose: () => void; onContinue: (context: RevisionContext, number: string) => void }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const dialog = useRef<HTMLDialogElement>(null);
  const [context, setContext] = useState<RevisionContext | null>(null);
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setContext(null); setError('');
    async function load() {
      try {
        const result = await loadRevisionContext(offer.id);
        if (cancelled) return;
        if (result.error) { setError(result.error); return; }
        setContext(result.context); setNumber(result.context.suggestedOfferNo);
      } catch { if (!cancelled) setError('unavailable'); }
    }
    void load();
    return () => { cancelled = true; };
  }, [offer.id, retry]);
  const suffix = context && number.startsWith(context.baseOfferNo + '_') ? number.slice(context.baseOfferNo.length + 1) : '';
  const index = /^[A-Z]{1,7}$/.test(suffix) ? [...suffix].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) : 0;
  const exists = context?.relatedOffers.some(item => item.offerNo === number);
  const valid = index > 0 && index <= 2147483646 && !exists;
  return <dialog ref={dialog} className="offer-dialog revision-dialog" aria-labelledby="revision-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <form className="offer-dialog-content" onSubmit={event => { event.preventDefault(); if (context && valid) onContinue(context, number); }}>
      <header className="offer-dialog-header"><h2 id="revision-title">{de ? 'Zugehörige Angebote' : 'Related offers'}</h2><button type="button" className="dialog-close" onClick={onClose} aria-label={de ? 'Schließen' : 'Close'} autoFocus>×</button></header>
      <div className="revision-body">
        {!context && !error && <p role="status">{de ? 'Wird geladen…' : 'Loading…'}</p>}
        {error && <><p className="form-error" role="alert">{error === 'auth' ? (de ? 'Bitte erneut anmelden.' : 'Please sign in again.') : (de ? 'Angebote konnten nicht geladen werden.' : 'Offers could not be loaded.')}</p><button type="button" className="outline-button" onClick={() => setRetry(n => n + 1)}>{de ? 'Erneut versuchen' : 'Try again'}</button></>}
        {context && <><ul>{context.relatedOffers.map(item => <li key={item.id}>{item.offerNo}</li>)}</ul>
          <label htmlFor="revision-number">{de ? 'Vorgeschlagene Angebotsnummer' : 'Suggested offer number'}</label>
          <input id="revision-number" value={number} required onChange={event => setNumber(event.target.value)} aria-invalid={!valid} />
          {!valid && <p className="form-error" role="alert">{exists ? (de ? 'Diese Nummer existiert bereits.' : 'This number already exists.') : (de ? `Verwenden Sie ${context.baseOfferNo}_A, _B, _C …` : `Use ${context.baseOfferNo}_A, _B, _C …`)}</p>}
        </>}
      </div>
      <footer className="offer-dialog-footer"><button type="button" className="outline-button" onClick={onClose}>{de ? 'Abbrechen' : 'Cancel'}</button><button type="submit" className="solid-button" disabled={!context || !valid}>{de ? 'Weiter' : 'Continue'}</button></footer>
    </form>
  </dialog>;
}
