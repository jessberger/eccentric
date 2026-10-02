"use client";

import { useEffect, useRef, useState } from 'react';
import { deleteOffer } from '@/app/offers/actions';
import type { Offer, OfferSaveError } from '@/lib/offers';
import { useLanguage } from './language';

const text = {
  en: {
    title: 'Delete offer', question: 'Delete this offer?', note: 'The record will be kept inactive in the database.',
    cancel: 'Cancel', remove: 'Delete', deleting: 'Deleting…',
    errors: {
      auth: 'Your session has expired. Please sign in again.',
      configuration: 'The database connection is not configured.',
      schema: 'The database deletion setup is missing.',
      permission: 'You do not have permission to delete this offer.',
      unavailable: 'Deletion could not be confirmed. Retry or refresh the list to check.',
      invalid: 'The deletion request is invalid. Close this window and refresh the list.',
      conflict: 'This offer has changed. Close this window and refresh the list before deleting it.',
      exists: 'Deletion could not be completed. Close this window and refresh the list.',
      number: 'Deletion could not be completed. Close this window and refresh the list.',
    },
  },
  de: {
    title: 'Angebot löschen', question: 'Dieses Angebot löschen?', note: 'Der Datensatz bleibt inaktiv in der Datenbank erhalten.',
    cancel: 'Abbrechen', remove: 'Löschen', deleting: 'Wird gelöscht…',
    errors: {
      auth: 'Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.',
      configuration: 'Die Datenbankverbindung ist nicht eingerichtet.',
      schema: 'Die Datenbank ist noch nicht für das Löschen eingerichtet.',
      permission: 'Sie haben keine Berechtigung, dieses Angebot zu löschen.',
      unavailable: 'Das Löschen konnte nicht bestätigt werden. Erneut versuchen oder die Liste zur Kontrolle aktualisieren.',
      invalid: 'Ungültige Löschanfrage. Schließen Sie dieses Fenster und aktualisieren Sie die Liste.',
      conflict: 'Dieses Angebot wurde inzwischen geändert. Schließen Sie dieses Fenster und aktualisieren Sie die Liste vor dem Löschen.',
      exists: 'Das Löschen ist fehlgeschlagen. Schließen Sie dieses Fenster und aktualisieren Sie die Liste.',
      number: 'Das Löschen ist fehlgeschlagen. Schließen Sie dieses Fenster und aktualisieren Sie die Liste.',
    },
  },
};

export function DeleteOfferDialog({ offer, onClose, onDeleted }: { offer: Offer; onClose: () => void; onDeleted: (id: string) => void }) {
  const { language } = useLanguage();
  const t = text[language];
  const ref = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<OfferSaveError | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  function close() { if (!busy.current) onClose(); }
  async function remove() {
    if (busy.current || error === 'conflict') return;
    busy.current = true; setSaving(true); setError(null);
    try {
      const result = await deleteOffer(offer.id, offer.recordVersion);
      if (result.error) { setError(result.error); return; }
      onDeleted(offer.id);
    } catch { setError('unavailable'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <dialog ref={ref} className="offer-dialog revision-dialog" aria-labelledby="delete-offer-title" onCancel={event => { event.preventDefault(); close(); }}>
    <form className="offer-dialog-content" aria-busy={saving} onSubmit={event => { event.preventDefault(); void remove(); }}>
      <header className="offer-dialog-header"><h2 id="delete-offer-title">{t.title}</h2></header>
      <div className="revision-body"><p>{t.question}</p><strong>{offer.values.offer_no || '—'}</strong><p>{offer.values.customer_name}</p><p>{t.note}</p>
        {error && <p className="form-error" role="alert">{t.errors[error]}</p>}
      </div>
      <footer className="offer-dialog-footer"><button type="button" className="outline-button" disabled={saving} onClick={close} autoFocus>{t.cancel}</button><button type="submit" className="solid-button delete-confirm" disabled={saving || error === 'conflict'}>{saving ? t.deleting : t.remove}</button></footer>
    </form>
  </dialog>;
}
