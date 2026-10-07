'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from './language';
import { flowFactors, usePumpSelection, type MediaGroup } from './pump-selection';

const groups = {
  abrasivity: [
    { en: 'Highly abrasive media', de: 'Stark abrasive Medien', detailEn: 'e.g. mortar, ceramic particles, lime slurry', detailDe: 'z. B. Mörtel, Keramikpartikel, Kalkschlamm' },
    { en: 'Abrasive media', de: 'Abrasive Medien', detailEn: 'e.g. clarification sludge', detailDe: 'z. B. Klärschlamm' },
    { en: 'Slightly abrasive media', de: 'Leicht abrasive Medien', detailEn: 'e.g. contaminated, low-viscosity liquids', detailDe: 'z. B. verunreinigte, niedrigviskose Flüssigkeiten' },
    { en: 'Non-abrasive media', de: 'Nicht abrasive Medien', detailEn: 'e.g. clean water', detailDe: 'z. B. sauberes Wasser' },
  ],
  viscosity: [
    { en: 'Very high viscosity', de: 'Sehr hohe Viskosität', detailEn: '> 50,000 mPa·s · e.g. greases, pastes', detailDe: '> 50.000 mPa·s · z. B. Fette, Pasten' },
    { en: 'High viscosity', de: 'Hohe Viskosität', detailEn: '> 8,000 mPa·s · e.g. polymer dispersions, paints', detailDe: '> 8.000 mPa·s · z. B. Polymerdispersionen, Farben' },
    { en: 'Medium viscosity', de: 'Mittlere Viskosität', detailEn: '> 2,000 mPa·s · e.g. oils, fruit juice concentrates', detailDe: '> 2.000 mPa·s · z. B. Öle, Fruchtsaftkonzentrate' },
    { en: 'Low viscosity', de: 'Niedrige Viskosität', detailEn: '≤ 2,000 mPa·s · e.g. low-viscosity liquids', detailDe: '≤ 2.000 mPa·s · z. B. niedrigviskose Flüssigkeiten' },
  ],
};

export function PumpMedia() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection, ready } = usePumpSelection();
  const router = useRouter();
  const [error, setError] = useState<'flow' | 'media' | null>(null);
  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{de ? 'Schritt 2 – Viskosität / Abrasivität' : 'Step 2 – Viscosity / Abrasivity'}</p></header>
    <div className="selector-media-grid">
      {(['abrasivity', 'viscosity'] as const).map(key => <section key={key} className="selector-card media-card" aria-labelledby={`${key}-title`}>
        <h2 id={`${key}-title`}><span>{key === 'abrasivity' ? '04' : '05'}</span>{key === 'abrasivity' ? (de ? 'Abrasivität' : 'Abrasivity') : (de ? 'Viskosität' : 'Viscosity')}</h2>
        <fieldset className="media-choice-group" aria-labelledby={`${key}-title`} disabled={!ready}>
        <div className="media-options">{groups[key].map((group, index) => <label key={index} className={selection[key] === index + 1 ? 'is-selected' : ''}>
          <input type="radio" name={key} checked={selection[key] === index + 1} onChange={() => { setError(null); setSelection(previous => ({ ...previous, [key]: (index + 1) as MediaGroup })); }} />
          <span><strong>{de ? 'Gruppe' : 'Group'} {index + 1}: {group[language]}</strong><small>{de ? group.detailDe : group.detailEn}</small></span>
        </label>)}</div></fieldset>
      </section>)}
    </div>
    <div className="selector-page-actions">
      <Link className="outline-button" href="/select">← {de ? 'Zurück' : 'Back'}</Link>
      {error && <p role="alert" className="form-error">{error === 'flow' ? (de ? 'Bitte zuerst die Fördermenge in Schritt 1 eingeben.' : 'Please enter a flow rate in Step 1 first.') : (de ? 'Bitte Abrasivität und Viskosität auswählen.' : 'Please select abrasivity and viscosity.')}</p>}
      <button type="button" className="solid-button" disabled={!ready} onClick={() => {
        const flow = Number(selection.flowValue) * flowFactors[selection.flowUnit];
        if (!Number.isFinite(flow) || flow <= 0) { setError('flow'); return; }
        if (!selection.abrasivity || !selection.viscosity) { setError('media'); return; }
        router.push('/select/pump');
      }}>{de ? 'Weiter' : 'Next'} <span aria-hidden="true">→</span></button>
    </div>
  </main>;
}
