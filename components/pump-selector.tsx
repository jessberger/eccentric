'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from './language';

type FlowUnit = 'lmin' | 'lhour' | 'm3hour';
type Selection = {
  application: 'non-food' | 'food';
  certification: 'non-atex' | 'atex';
  orientation: 'vertical' | 'horizontal';
  pressure: 6 | 12 | 24;
  flowUnit: FlowUnit;
  flowValue: string;
};
const initial: Selection = { application: 'non-food', certification: 'non-atex', orientation: 'vertical', pressure: 6, flowUnit: 'lmin', flowValue: '' };
const draftKey = 'eccentric-selector-draft-v1';
const factors: Record<FlowUnit, number> = { lmin: 1, lhour: 1 / 60, m3hour: 1000 / 60 };
const units: { key: FlowUnit; label: string }[] = [{ key: 'lmin', label: 'Q (l/min)' }, { key: 'lhour', label: 'Q (l/h)' }, { key: 'm3hour', label: 'Q (m³/h)' }];

function restoreDraft(value: unknown): Selection {
  if (!value || typeof value !== 'object') return initial;
  const draft = value as Partial<Selection>;
  return {
    application: draft.application === 'food' ? 'food' : 'non-food',
    certification: draft.certification === 'atex' ? 'atex' : 'non-atex',
    orientation: draft.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    pressure: draft.pressure === 12 || draft.pressure === 24 ? draft.pressure : 6,
    flowUnit: draft.flowUnit === 'lhour' || draft.flowUnit === 'm3hour' ? draft.flowUnit : 'lmin',
    flowValue: typeof draft.flowValue === 'string' && (draft.flowValue === '' || (Number.isFinite(Number(draft.flowValue)) && Number(draft.flowValue) >= 0)) ? draft.flowValue : '',
  };
}

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
  const [selection, setSelection] = useState<Selection>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setSelection(restoreDraft(JSON.parse(sessionStorage.getItem(draftKey) || 'null'))); } catch { /* Keep defaults if storage is unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) { try { sessionStorage.setItem(draftKey, JSON.stringify(selection)); } catch { /* Selection remains usable without storage. */ } }
  }, [selection, ready]);

  function flowValue(unit: FlowUnit) {
    if (selection.flowValue === '' || unit === selection.flowUnit) return selection.flowValue;
    const entered = Number(selection.flowValue);
    if (!Number.isFinite(entered) || entered < 0) return '';
    const converted = entered * factors[selection.flowUnit] / factors[unit];
    return Number.isFinite(converted) ? String(Number(converted.toPrecision(10))) : '';
  }

  return <main className="pump-selector">
    <h1>Eccentric Screw Pump</h1>
    <div className="selector-sections">
      <section className="selector-card"><h2><span>01</span>{de ? 'Ausführung' : 'Type'}</h2><div className="selector-type-grid">
        <Choices name="certification" label={de ? 'Zertifizierung' : 'Certification'} value={selection.certification} options={[{ value: 'non-atex', label: 'Non-ATEX' }, { value: 'atex', label: 'ATEX' }]} onChange={value => setSelection(previous => ({ ...previous, certification: value as Selection['certification'] }))} />
        <Choices name="application" label={de ? 'Anwendung' : 'Application'} value={selection.application} options={[{ value: 'non-food', label: 'Non-Food' }, { value: 'food', label: 'Food' }]} onChange={value => setSelection(previous => ({ ...previous, application: value as Selection['application'] }))} />
        <Choices name="orientation" label={de ? 'Einbaulage' : 'Orientation'} value={selection.orientation} options={[{ value: 'vertical', label: de ? 'Vertikal' : 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]} onChange={value => setSelection(previous => ({ ...previous, orientation: value as Selection['orientation'] }))} />
      </div></section>
      <section className="selector-card"><h2><span>02</span>{de ? 'Fördermenge' : 'Flow rate'}</h2><div className="selector-flow-grid">
        {units.map(unit => <label key={unit.key}>{unit.label}<input type="number" min="0" step="any" inputMode="decimal" value={flowValue(unit.key)} onChange={event => setSelection(previous => ({ ...previous, flowUnit: unit.key, flowValue: event.target.value }))} /></label>)}
      </div></section>
      <section className="selector-card"><h2><span>03</span>{de ? 'Druck' : 'Pressure'}</h2>
        <Choices name="pressure" label={de ? 'Betriebsdruck' : 'Operating pressure'} value={String(selection.pressure)} options={[6, 12, 24].map(value => ({ value: String(value), label: `${value} bar` }))} onChange={value => setSelection(previous => ({ ...previous, pressure: Number(value) as Selection['pressure'] }))} />
      </section>
    </div>
  </main>;
}
