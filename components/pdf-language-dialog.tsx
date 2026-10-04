"use client";

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language';

export function PdfLanguageDialog({ offerId, onClose }: { offerId: string; onClose: () => void }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const ref = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  function close() { if (!busy.current) onClose(); }
  async function download(language: 'de' | 'en') {
    if (busy.current) return;
    busy.current = true; setDownloading(true); setError('');
    try {
      const response = await fetch(`/offers/${offerId}/pdf?language=${language}`, { cache: 'no-store' });
      if (!response.ok) {
        setError(response.status === 401 ? (de ? 'Bitte erneut anmelden.' : 'Please sign in again.') : (de ? 'PDF konnte nicht erstellt werden. Bitte erneut versuchen.' : 'PDF could not be created. Please try again.'));
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const filename = encodedName ? decodeURIComponent(encodedName) : 'Offer.pdf';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      onClose();
    } catch { setError(de ? 'PDF konnte nicht heruntergeladen werden. Bitte erneut versuchen.' : 'PDF could not be downloaded. Please try again.'); }
    finally { busy.current = false; setDownloading(false); }
  }
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={ref} className="offer-dialog revision-dialog" aria-labelledby="pdf-language-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="offer-dialog-content">
      <header className="offer-dialog-header"><h2 id="pdf-language-title">{de ? 'PDF-Sprache' : 'PDF language'}</h2><button className="dialog-close" type="button" onClick={close} disabled={downloading} aria-label={de ? 'Schließen' : 'Close'}>×</button></header>
      <div className="pdf-language-options">
        <button className="outline-button" type="button" disabled={downloading} onClick={() => void download('de')} autoFocus>Deutsch</button>
        <button className="outline-button" type="button" disabled={downloading} onClick={() => void download('en')}>English</button>
      </div>
      {downloading && <p className="pdf-download-status" role="status">{de ? 'PDF wird erstellt…' : 'Creating PDF…'}</p>}
      {error && <p className="form-error edit-save-error" role="alert">{error}</p>}
    </div>
  </dialog>;
}
