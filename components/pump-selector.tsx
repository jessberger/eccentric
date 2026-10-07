'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './language';
import { flowFactors as factors, usePumpSelection, type FlowUnit, type Selection } from './pump-selection';

const units: { key: FlowUnit; label: string }[] = [{ key: 'lmin', label: 'Q (l/min)' }, { key: 'lhour', label: 'Q (l/h)' }, { key: 'm3hour', label: 'Q (m³/h)' }];

function Choices({ name, label, value, options, onChange }: { name: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <fieldset className="selector-choice-group"><legend>{label}</legend><div className="selector-choices">
    {options.map(option => <label key={option.value} className={option.value === value ? 'is-selected' : ''}>
      <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} />
      <span>{option.label}</span>
    </label>)}
  </div></fieldset>;
}

export function PumpSelector() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection, ready } = usePumpSelection();
  const router = useRouter();
  const [flowError, setFlowError] = useState(false);

  function flowValue(unit: FlowUnit) {
    if (selection.flowValue === '' || unit === selection.flowUnit) return selection.flowValue;
    const entered = Number(selection.flowValue);
    if (!Number.isFinite(entered) || entered < 0) return '';
    const converted = entered * factors[selection.flowUnit] / factors[unit];
    return Number.isFinite(converted) ? String(Number(converted.toPrecision(10))) : '';
  }

  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{de ? 'Schritt 1 – Ausführung / Fördermenge / Druck' : 'Step 1 – Type / Flow rate / Pressure'}</p></header>
    <div className="selector-sections">
      <section className="selector-card"><h2><span>01</span>{de ? 'Ausführung' : 'Type'}</h2><div className="selector-type-grid">
        <Choices name="certification" label={de ? 'Zertifizierung' : 'Certification'} value={selection.certification} options={[{ value: 'non-atex', label: 'Non-ATEX' }, { value: 'atex', label: 'ATEX' }]} onChange={value => setSelection(previous => ({ ...previous, certification: value as Selection['certification'] }))} />
        <Choices name="application" label={de ? 'Anwendung' : 'Application'} value={selection.application} options={[{ value: 'non-food', label: 'Non-Food' }, { value: 'food', label: 'Food' }]} onChange={value => setSelection(previous => ({ ...previous, application: value as Selection['application'] }))} />
        <Choices name="orientation" label={de ? 'Einbaulage' : 'Orientation'} value={selection.orientation} options={[{ value: 'vertical', label: de ? 'Vertikal' : 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]} onChange={value => setSelection(previous => ({ ...previous, orientation: value as Selection['orientation'] }))} />
      </div></section>
      <section className="selector-card"><h2><span>02</span>{de ? 'Fördermenge' : 'Flow rate'}</h2><div className="selector-flow-grid">
        {units.map(unit => <label key={unit.key}>{unit.label}<input type="number" min="0" step="any" inputMode="decimal" aria-invalid={flowError || undefined} value={flowValue(unit.key)} onChange={event => { setFlowError(false); setSelection(previous => ({ ...previous, flowUnit: unit.key, flowValue: event.target.value })); }} /></label>)}
      </div></section>
      <section className="selector-card"><h2><span>03</span>{de ? 'Druck' : 'Pressure'}</h2>
        <Choices name="pressure" label={de ? 'Betriebsdruck' : 'Operating pressure'} value={String(selection.pressure)} options={[6, 12, 24].map(value => ({ value: String(value), label: `${value} bar` }))} onChange={value => setSelection(previous => ({ ...previous, pressure: Number(value) as Selection['pressure'] }))} />
      </section>
    </div>
    <div className="selector-page-actions">
      {flowError && <p role="alert" className="form-error">{de ? 'Bitte eine Fördermenge größer als 0 eingeben.' : 'Please enter a flow rate greater than 0.'}</p>}
      <button type="button" className="solid-button" disabled={!ready} onClick={() => {
        const flow = Number(selection.flowValue) * factors[selection.flowUnit];
        if (!Number.isFinite(flow) || flow <= 0) { setFlowError(true); return; }
        router.push('/select/media');
      }}>{de ? 'Weiter' : 'Next'} <span aria-hidden="true">→</span></button>
    </div>
  </main>;
}
