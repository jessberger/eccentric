"use client";

import { useEffect, useRef } from 'react';
import { useLanguage } from './language';

export function PdfLanguageDialog({ offerId, onClose }: { offerId: string; onClose: () => void }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={ref} className="offer-dialog revision-dialog" aria-labelledby="pdf-language-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="offer-dialog-content">
      <header className="offer-dialog-header"><h2 id="pdf-language-title">{de ? 'PDF-Sprache' : 'PDF language'}</h2><button className="dialog-close" type="button" onClick={onClose} aria-label={de ? 'Schließen' : 'Close'}>×</button></header>
      <div className="pdf-language-options">
        <a className="outline-button" href={`/offers/${offerId}/print?language=de`} target="_blank" rel="noopener noreferrer" onClick={onClose} autoFocus>Deutsch</a>
        <a className="outline-button" href={`/offers/${offerId}/print?language=en`} target="_blank" rel="noopener noreferrer" onClick={onClose}>English</a>
      </div>
    </div>
  </dialog>;
}
