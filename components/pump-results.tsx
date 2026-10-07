'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { calculatePumps } from '@/app/select/actions';
import { isValidPumpInput, type PumpCalculationResponse, type PumpResult } from '@/lib/pump-calculation';
import { useLanguage } from './language';
import { flowFactors, usePumpSelection } from './pump-selection';
import { PumpSelectionSummary } from './pump-selection-summary';

export function PumpResults() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection } = usePumpSelection();
  const router = useRouter();
  const flowLmin = Number(selection.flowValue) * flowFactors[selection.flowUnit];
  const { pressure, orientation, abrasivity, viscosity } = selection;
  const valid = isValidPumpInput({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity });
  const requestKey = JSON.stringify([flowLmin, pressure, orientation, abrasivity, viscosity]);
  const [result, setResult] = useState<{ key: string; response: PumpCalculationResponse } | null>(null);
  const [retry, setRetry] = useState(0);
  const [validOnEntry] = useState(valid);
  useEffect(() => {
    if (!validOnEntry) router.replace('/select');
  }, [validOnEntry, router]);
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
  const format = (value: number | null) => value === null ? '—' : value.toLocaleString(language, { maximumFractionDigits: 0 });
  function reason(row: PumpResult) {
    const reasons: string[] = [];
    if (!row.stageMatches) reasons.push(de ? 'Andere Druckstufe' : 'Different pressure stage');
    if (!row.orientationMatches) reasons.push(de ? 'Andere Einbaulage' : 'Different orientation');
    if (!row.hasData) reasons.push(de ? 'Daten fehlen' : 'Missing data');
    if (row.hasData && row.requiredRpm! < row.minimumRpm) reasons.push(de ? `Drehzahl unter ${format(row.minimumRpm)} RPM` : `Required RPM below ${format(row.minimumRpm)}`);
    if (row.hasData && row.requiredRpm! > row.maximumRpm!) reasons.push(de ? 'Drehzahl zu hoch' : 'Required RPM too high');
    return reasons.join(' · ');
  }
  function table(rows: PumpResult[]) {
    const compatible = rows.filter(row => row.compatible);
    const incompatible = rows.filter(row => !row.compatible);
    const ordered = [...compatible, ...incompatible];
    return <div className="pump-table-scroll"><table className="pump-results-table"><thead><tr>
      <th>{de ? 'Pumpe' : 'Pump'}</th><th>{de ? 'Erforderliche RPM' : 'Required RPM'}</th><th>RPM – Abr</th><th>RPM – Vis</th><th>{de ? 'Maximale RPM' : 'Maximum RPM'}</th>
      <th>{de ? 'Eignung / Grund' : 'Suitability / Reason'}</th>
    </tr></thead><tbody>{ordered.map((row, index) => <tr key={row.pumpCode} className={`${row.compatible ? 'is-compatible' : 'is-incompatible'}${incompatible.length && compatible.length && index === compatible.length ? ' pump-results-divider' : ''}${row.compatible && selection.selectedPumpCode === row.pumpCode ? ' is-selected' : ''}`}>
      <td><label className={`pump-result-choice${row.compatible ? '' : ' is-disabled'}`}><input type="radio" name="selected-pump" value={row.pumpCode} disabled={!row.compatible} checked={row.compatible && selection.selectedPumpCode === row.pumpCode} onChange={() => { if (row.compatible) setSelection(previous => ({ ...previous, selectedPumpCode: row.pumpCode })); }} /><strong>{row.pumpCode}</strong></label></td>
      <td>{format(row.requiredRpm)}</td><td>{format(row.abrasivityRpm)}</td><td>{format(row.viscosityRpm)}</td>
      <td>{format(row.maximumRpm)}</td><td className="pump-reason">{row.compatible ? (de ? 'Geeignet' : 'Suitable') : reason(row)}</td>
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
    {!valid ? null : <>
      <PumpSelectionSummary requiredRpm={suitable.find(row => row.pumpCode === selection.selectedPumpCode)?.requiredRpm} />
      {!response ? <p role="status" className="form-note">{de ? 'Wird berechnet…' : 'Calculating…'}</p> : response.error ? <div className="pump-result-error"><p role="alert" className="form-error">{errorMessages[response.error]}</p>{response.error === 'auth' ? <Link href="/login" className="outline-button">{de ? 'Anmelden' : 'Sign in'}</Link> : <button type="button" className="outline-button" onClick={() => { setResult(null); setRetry(value => value + 1); }}>{de ? 'Erneut versuchen' : 'Try again'}</button>}</div> : <section className="selector-card pump-results-card">
        <h2><span>06</span>{de ? 'Pumpenauswahl' : 'Pump selection'} <small>{suitable.length} / {response.rows.length} {de ? 'geeignet' : 'suitable'}</small></h2>
        {!suitable.length && <p className="pump-no-match">{de ? 'Keine passende Pumpe für diese Werte.' : 'No suitable pump for these values.'}</p>}
        {table(response.rows)}
      </section>}
    </>}
    <div className="selector-page-actions"><Link className="outline-button" href="/select/media">← {de ? 'Zurück' : 'Back'}</Link><button type="button" className="solid-button" disabled={!valid || !suitable.some(row => row.pumpCode === selection.selectedPumpCode)} onClick={() => router.push('/select/family')}>{de ? 'Weiter' : 'Next'} <span aria-hidden="true">→</span></button></div>
  </main>;
}
