'use client';

import Link from 'next/link';
import { useLanguage } from './language';
import { usePumpSelection, type MediaGroup } from './pump-selection';

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
  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{de ? 'Schritt 2 – Viskosität / Abrasivität' : 'Step 2 – Viscosity / Abrasivity'}</p></header>
    <div className="selector-media-grid">
      {(['abrasivity', 'viscosity'] as const).map(key => <fieldset key={key} className="selector-card media-choice-group" disabled={!ready}>
        <legend>{key === 'abrasivity' ? (de ? 'Abrasivität' : 'Abrasivity') : (de ? 'Viskosität' : 'Viscosity')}</legend>
        <div className="media-options">{groups[key].map((group, index) => <label key={index} className={selection[key] === index + 1 ? 'is-selected' : ''}>
          <input type="radio" name={key} checked={selection[key] === index + 1} onChange={() => setSelection(previous => ({ ...previous, [key]: (index + 1) as MediaGroup }))} />
          <span><strong>{de ? 'Gruppe' : 'Group'} {index + 1}: {group[language]}</strong><small>{de ? group.detailDe : group.detailEn}</small></span>
        </label>)}</div>
      </fieldset>)}
    </div>
    <div className="selector-page-actions"><Link className="outline-button" href="/select">← {de ? 'Zurück' : 'Back'}</Link></div>
  </main>;
}
