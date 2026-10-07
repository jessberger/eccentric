'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { calculatePumps } from '@/app/select/actions';
import { isValidPumpInput, type PumpCalculationResponse, type PumpResult } from '@/lib/pump-calculation';
import { useLanguage } from './language';
import { flowFactors, usePumpSelection } from './pump-selection';

export function PumpResults() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection } = usePumpSelection();
  const flowLmin = Number(selection.flowValue) * flowFactors[selection.flowUnit];
  const { pressure, orientation, abrasivity, viscosity } = selection;
  const valid = isValidPumpInput({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity });
  const requestKey = JSON.stringify([flowLmin, pressure, orientation, abrasivity, viscosity]);
  const [result, setResult] = useState<{ key: string; response: PumpCalculationResponse } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    async function load() {
      let response: PumpCalculationResponse;
      try { response = await calculatePumps({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity }); }
      catch { response = { rows: [], error: 'unavailable' }; }
      if (!cancelled) setResult({ key: requestKey, response });
    }
    void load();
    return () => { cancelled = true; };
  }, [flowLmin, pressure, orientation, abrasivity, viscosity, valid, requestKey, retry]);
  const response = result?.key === requestKey ? result.response : null;
  const suitable = response?.rows.filter(row => row.compatible) || [];
  const other = response?.rows.filter(row => !row.compatible) || [];
  const format = (value: number | null) => value === null ? '—' : value.toLocaleString(language, { maximumFractionDigits: 1 });
  function reason(row: PumpResult) {
    const reasons: string[] = [];
    if (!row.stageMatches) reasons.push(de ? 'Andere Druckstufe' : 'Different pressure stage');
    if (!row.orientationMatches) reasons.push(de ? 'Andere Einbaulage' : 'Different orientation');
    if (!row.hasData) reasons.push(de ? 'Daten fehlen' : 'Missing data');
    if (row.hasData && row.requiredRpm! > row.maximumRpm!) reasons.push(de ? 'Drehzahl zu hoch' : 'Required RPM too high');
    return reasons.join(' · ');
  }
  function table(rows: PumpResult[], selectable: boolean) {
    return <div className="pump-table-scroll"><table className="pump-results-table"><thead><tr>
      <th>{de ? 'Pumpe' : 'Pump'}</th><th>{de ? 'Erforderliche RPM' : 'Required RPM'}</th><th>RPM – Abr</th><th>RPM – Vis</th><th>{de ? 'Maximale RPM' : 'Maximum RPM'}</th>
      {!selectable && <th>{de ? 'Grund' : 'Reason'}</th>}
    </tr></thead><tbody>{rows.map(row => <tr key={row.pumpCode} className={selectable && selection.selectedPumpCode === row.pumpCode ? 'is-selected' : undefined}>
      <td>{selectable ? <label className="pump-result-choice"><input type="radio" name="selected-pump" value={row.pumpCode} checked={selection.selectedPumpCode === row.pumpCode} onChange={() => setSelection(previous => ({ ...previous, selectedPumpCode: row.pumpCode }))} /><strong>{row.pumpCode}</strong></label> : <strong>{row.pumpCode}</strong>}</td>
      <td>{format(row.requiredRpm)}</td><td>{format(row.abrasivityRpm)}{row.estimated && <span title={de ? 'Geschätzter Mediengrenzwert' : 'Estimated media limit'}> *</span>}</td><td>{format(row.viscosityRpm)}{row.estimated && <span> *</span>}</td>
      <td>{format(row.maximumRpm)}</td>{!selectable && <td className="pump-reason">{reason(row)}</td>}
    </tr>)}</tbody></table></div>;
  }

  const errorMessages = {
    invalid: de ? 'Bitte zuerst die Schritte 1 und 2 ausfüllen.' : 'Please complete steps 1 and 2 first.',
    auth: de ? 'Bitte erneut anmelden.' : 'Please sign in again.',
    configuration: de ? 'Pumpendaten sind nicht verfügbar.' : 'Pump data is unavailable.',
    schema: de ? 'Pumpendaten sind noch nicht verfügbar.' : 'Pump data is not available yet.',
    permission: de ? 'Keine Berechtigung für Pumpendaten.' : 'You do not have access to pump data.',
    unavailable: de ? 'Berechnung konnte nicht geladen werden.' : 'The calculation could not be loaded.',
  };
  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{de ? 'Schritt 3 – Pumpenauswahl' : 'Step 3 – Pump selection'}</p></header>
    {!valid ? <p className="form-note">{errorMessages.invalid} <Link href="/select">{de ? 'Zu Schritt 1' : 'Go to Step 1'}</Link></p> : <>
      <div className="pump-selection-summary"><span>{orientation === 'vertical' ? (de ? 'Vertikal' : 'Vertical') : 'Horizontal'}</span><span>{format(flowLmin)} l/min</span><span>{pressure} bar</span><span>{de ? 'Gruppe' : 'Group'} Abr {abrasivity} / Vis {viscosity}</span></div>
      {!response ? <p role="status" className="form-note">{de ? 'Wird berechnet…' : 'Calculating…'}</p> : response.error ? <div className="pump-result-error"><p role="alert" className="form-error">{errorMessages[response.error]}</p>{response.error === 'auth' ? <Link href="/login" className="outline-button">{de ? 'Anmelden' : 'Sign in'}</Link> : <button type="button" className="outline-button" onClick={() => { setResult(null); setRetry(value => value + 1); }}>{de ? 'Erneut versuchen' : 'Try again'}</button>}</div> : <section className="selector-card pump-results-card">
        <h2><span>06</span>{de ? 'Passende Pumpen' : 'Suitable pumps'} <small>{suitable.length}</small></h2>
        {suitable.length ? table(suitable, true) : <p className="pump-no-match">{de ? 'Keine passende Pumpe für diese Werte.' : 'No suitable pump for these values.'}</p>}
        {other.length > 0 && <details className="pump-other-results"><summary>{de ? 'Weitere Pumpen' : 'Other pumps'} ({other.length})</summary>{table(other, false)}</details>}
        {response.rows.some(row => row.estimated) && <p className="pump-estimate-note">* {de ? 'Mediengrenzwerte für Section 1–14 sind geschätzt.' : 'Media limits for sections 1–14 are estimates.'}</p>}
      </section>}
    </>}
    <div className="selector-page-actions"><Link className="outline-button" href="/select/media">← {de ? 'Zurück' : 'Back'}</Link></div>
  </main>;
}
