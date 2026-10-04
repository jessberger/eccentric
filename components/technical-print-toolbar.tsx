"use client";

import { useEffect, useState } from 'react';

export function TechnicalPrintToolbar({ language, title }: { language: 'de' | 'en'; title: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const de = language === 'de';
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    let cancelled = false;
    async function prepare() {
      try {
        await document.fonts.ready;
        await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.technical-sheet img')).map(img => img.decode()));
        if (!cancelled) setReady(true);
      } catch { if (!cancelled) setFailed(true); }
    }
    void prepare();
    return () => { cancelled = true; document.title = previousTitle; };
  }, [title]);
  return <nav className="technical-print-toolbar" aria-label={de ? 'Dokument drucken' : 'Print document'}>
    <div><button type="button" disabled={!ready} onClick={() => window.print()}>{de ? 'Drucken / PDF speichern' : 'Print / Save PDF'}</button>
    <a href="/offers">{de ? 'Angebote' : 'Offers'}</a></div>
    <p>{failed ? (de ? 'Das Logo konnte nicht geladen werden. Bitte laden Sie die Seite erneut.' : 'The logo could not be loaded. Please reload the page.') : (de ? 'A4 · Kopf- und Fußzeilen im Druckdialog deaktivieren.' : 'A4 · Turn off headers and footers in the print dialog.')}</p>
  </nav>;
}
