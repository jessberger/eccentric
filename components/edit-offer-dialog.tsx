'use client';

import { useEffect, useRef, useState } from 'react';
import { saveOffer, saveRevision } from '@/app/offers/actions';
import { offerFields, offerGroups } from '@/lib/offer-groups';
import type { Offer, OfferSaveError } from '@/lib/offers';
import { useLanguage } from './language';

import { todayInBerlin } from '@/lib/offer-dates';

const text = {
  en: {
    title: 'Edit', close: 'Close', cancel: 'Cancel', save: 'Save', saving: 'Saving…', discard: 'Discard your unsaved changes?',
    errors: {
      exists: 'This offer number already exists. Choose another number.',
      number: 'Keep the base number and use uppercase revision letters after the underscore.',
      auth: 'Your session has expired. Keep a copy of your changes and sign in again.',
      configuration: 'The database connection is not configured.',
      schema: 'The database update setup is missing. Please contact your administrator.',
      permission: 'You do not have permission to save this offer.',
      unavailable: 'Saving could not be confirmed. Keep your changes and check the current record before retrying.',
      invalid: 'A value is too long or invalid. Please check your entries.',
      conflict: 'This offer was changed by someone else or is no longer available. Your changes have not been saved. Copy any changes you need, then close this window and refresh the list.',
    },
  },
  de: {
    title: 'Bearbeiten', close: 'Schließen', cancel: 'Abbrechen', save: 'Speichern', saving: 'Wird gespeichert…', discard: 'Nicht gespeicherte Änderungen verwerfen?',
    errors: {
      exists: 'Diese Angebotsnummer existiert bereits. Wählen Sie eine andere Nummer.',
      number: 'Behalten Sie die Basisnummer und verwenden Sie Großbuchstaben nach dem Unterstrich.',
      auth: 'Ihre Sitzung ist abgelaufen. Kopieren Sie Ihre Änderungen und melden Sie sich erneut an.',
      configuration: 'Die Datenbankverbindung ist nicht eingerichtet.',
      schema: 'Die Datenbank ist noch nicht für Änderungen eingerichtet. Bitte wenden Sie sich an Ihren Administrator.',
      permission: 'Sie haben keine Berechtigung, dieses Angebot zu speichern.',
      unavailable: 'Das Speichern konnte nicht bestätigt werden. Bewahren Sie Ihre Änderungen auf und prüfen Sie den aktuellen Datensatz vor einem erneuten Versuch.',
      invalid: 'Ein Wert ist zu lang oder ungültig. Bitte prüfen Sie Ihre Eingaben.',
      conflict: 'Dieses Angebot wurde inzwischen geändert oder ist nicht mehr verfügbar. Ihre Änderungen wurden nicht gespeichert. Kopieren Sie benötigte Änderungen, schließen Sie dieses Fenster und aktualisieren Sie die Liste.',
    },
  },
};

export function EditOfferDialog({ offer, revision, onClose, onSaved }: { revision?: { offerNo: string }; offer: Offer; onClose: () => void; onSaved: (offer: Offer) => void }) {
  const { language } = useLanguage();
  const t = text[language];
  const dialog = useRef<HTMLDialogElement>(null);
  const savingRef = useRef(false);
  const requestId = useRef<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [initialValues] = useState<Record<string, string>>(() => ({ ...offer.values, last_modified: todayInBerlin(), ...(revision ? { offer_date: todayInBerlin(), offer_no: revision.offerNo } : {}) }));
  const [values, setValues] = useState<Record<string, string>>({ ...initialValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<OfferSaveError | null>(null);
  const changes = Object.fromEntries(offerFields.filter(field => (values[field.key] ?? '') !== (offer.values[field.key] ?? '')).map(field => [field.key, values[field.key] ?? '']));
  const hasChanges = !!revision || Object.keys(changes).length > 0;
  const dirty = offerFields.some(field => (values[field.key] ?? '') !== (initialValues[field.key] ?? ''));

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    const focus = document.activeElement as HTMLElement | null;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);

  useEffect(() => {
    if (!dirty && !saving && !uncertain) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ''; }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving, uncertain]);

  function close() {
    if (savingRef.current) return;
    if (uncertain) {
      if (window.confirm(language === 'de' ? 'Der Speicherstatus ist unklar. Vor einer neuen Revision die Liste aktualisieren. Trotzdem schließen?' : 'Save status is unknown. Refresh the list before creating another revision. Close anyway?')) onClose();
      return;
    }
    if (!dirty || window.confirm(t.discard)) onClose();
  }

  async function submit() {
    if (savingRef.current || !hasChanges || error === 'conflict') return;
    savingRef.current = true;
    setSaving(true); setError(null);
    try {
      if (revision && !requestId.current) requestId.current = crypto.randomUUID();
      const revisionChanges = Object.fromEntries(Object.entries(changes).filter(([key]) => key !== 'offer_no'));
      const result = revision
        ? await saveRevision(offer.id, offer.recordVersion, values.offer_no, { ...revisionChanges, offer_date: values.offer_date, last_modified: values.last_modified }, requestId.current!)
        : await saveOffer(offer.id, offer.recordVersion, { ...changes, last_modified: values.last_modified });
      if (revision && result.error === 'unavailable') setUncertain(true);
      if (result.error !== null) { setError(result.error); return; }
      onSaved(result.offer);
    } catch { setError('unavailable'); if (revision) setUncertain(true); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return <dialog ref={dialog} className="offer-dialog" aria-labelledby="edit-offer-title" onCancel={event => { event.preventDefault(); close(); }}>
    <form className="offer-dialog-content" onSubmit={event => { event.preventDefault(); void submit(); }} aria-busy={saving}>
      <header className="offer-dialog-header">
        <div><h2 id="edit-offer-title">{revision ? (language === 'de' ? 'Revidieren' : 'Revise') : t.title}{offer.values.offer_no ? ` · ${offer.values.offer_no}` : ''}</h2><p>{offer.values.customer_name || '—'}</p></div>
        <button type="button" className="dialog-close" aria-label={t.close} onClick={close} disabled={saving} autoFocus>×</button>
      </header>
      <div className="offer-dialog-body">
        {offerGroups.map(group => <section className="detail-group" key={group.id} aria-labelledby={`edit-group-${group.id}`}>
          <h3 id={`edit-group-${group.id}`}>{group[language]}</h3>
          <div className="detail-inputs">{group.fields.map(field => <label key={field.key} htmlFor={`edit-${field.key}`}>
            <span>{field[language]}</span>
            {field.key === 'offer_date' || field.key === 'last_modified' ?
              <input type="date" id={`edit-${field.key}`} min="0001-01-01" max="9999-12-31" value={values[field.key] ?? ''} required={!!revision || field.key === 'last_modified'} disabled={saving || uncertain} onChange={event => { setValues(previous => ({ ...previous, [field.key]: event.target.value })); if (error !== 'conflict') setError(null); }} /> :
              <textarea readOnly={field.key === 'offer_no' && !revision && offer.revisionIndex > 0} id={`edit-${field.key}`} value={values[field.key] ?? ''} rows={Math.min(6, Math.max(['customer_name', 'file_name_on_lexware', 'medium'].includes(field.key) ? 2 : 1, (values[field.key] ?? '').split('\n').length))} disabled={saving || uncertain} onChange={event => { setValues(previous => ({ ...previous, [field.key]: event.target.value })); if (error !== 'conflict') setError(null); }} />}
          </label>)}</div>
        </section>)}
      </div>
      {error && <p className="form-error edit-save-error" role="alert">{error === 'unavailable' && revision ? (language === 'de' ? 'Speichern konnte nicht bestätigt werden. Klicken Sie erneut auf Speichern, um denselben Vorgang sicher abzuschließen.' : 'Saving could not be confirmed. Click Save again to safely finish the same request.') : t.errors[error]}</p>}
      <footer className="offer-dialog-footer"><div>
        <button type="button" className="outline-button" disabled={saving} onClick={close}>{t.cancel}</button>
        <button type="submit" className="solid-button" disabled={saving || !hasChanges || error === 'conflict'}>{saving ? t.saving : t.save}</button>
      </div></footer>
    </form>
  </dialog>;
}
