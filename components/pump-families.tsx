'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadPumpFamilies } from '@/app/select/actions';
import { isValidPumpInput } from '@/lib/pump-calculation';
import type { PumpFamilyResponse } from '@/lib/pump-family';
import { useLanguage } from './language';
import { flowFactors, usePumpSelection } from './pump-selection';

export function PumpFamilies() {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection } = usePumpSelection();
  const { pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode } = selection;
  const flowLmin = Number(selection.flowValue) * flowFactors[selection.flowUnit];
  const valid = !!selectedPumpCode && isValidPumpInput({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity });
  const requestKey = JSON.stringify([flowLmin, pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode]);
  const [result, setResult] = useState<{ key: string; response: PumpFamilyResponse } | null>(null);
  const [retry, setRetry] = useState(0);
  const response = result?.key === requestKey ? result.response : null;
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    async function load() {
      let response: PumpFamilyResponse;
      try { response = await loadPumpFamilies({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity, application, certification, pumpCode: selectedPumpCode }); }
      catch { response = { rows: [], requiredRpm: null, error: 'unavailable' }; }
      if (!cancelled) setResult({ key: requestKey, response });
    }
    void load();
    return () => { cancelled = true; };
  }, [flowLmin, pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode, requestKey, valid, retry]);
  const format = (value: number) => value.toLocaleString(language, { maximumFractionDigits: 1 });
  const types: Record<string, string> = { standard: 'Standard', food: 'Food', atex: 'ATEX', atex_food: 'Food + ATEX' };
  const errors = {
    invalid: de ? 'Bitte eine passende Pumpe in Schritt 3 auswählen.' : 'Please select a suitable pump in Step 3.',
    auth: de ? 'Bitte erneut anmelden.' : 'Please sign in again.',
    configuration: de ? 'Pumpenfamilien sind nicht verfügbar.' : 'Pump families are unavailable.',
    schema: de ? 'Pumpenfamilien sind noch nicht verfügbar.' : 'Pump families are not available yet.',
    permission: de ? 'Keine Berechtigung für Pumpendaten.' : 'You do not have access to pump data.',
    unavailable: de ? 'Pumpenfamilien konnten nicht geladen werden.' : 'Pump families could not be loaded.',
  };
  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{de ? 'Schritt 4 – Pumpenfamilie' : 'Step 4 – Pump family'}</p></header>
    {!valid ? <p className="form-note">{errors.invalid} <Link href="/select/pump">{de ? 'Zu Schritt 3' : 'Go to Step 3'}</Link></p> : <>
      <div className="pump-selection-summary"><span>{selectedPumpCode}</span><span>{application === 'food' ? 'Food' : (de ? 'Non-Food' : 'No Food')}</span><span>{certification === 'atex' ? 'ATEX' : (de ? 'Non-ATEX' : 'No ATEX')}</span><span>{orientation === 'vertical' ? (de ? 'Vertikal' : 'Vertical') : 'Horizontal'}</span><span>{format(flowLmin)} l/min</span><span>{pressure} bar</span>{response?.requiredRpm != null && <span>{format(response.requiredRpm)} RPM</span>}</div>
      {!response ? <p role="status" className="form-note">{de ? 'Wird geladen…' : 'Loading…'}</p> : response.error ? <div className="pump-result-error"><p role="alert" className="form-error">{errors[response.error]}</p>{response.error === 'auth' ? <Link className="outline-button" href="/login">{de ? 'Anmelden' : 'Sign in'}</Link> : <button type="button" className="outline-button" onClick={() => { setResult(null); setRetry(value => value + 1); }}>{de ? 'Erneut versuchen' : 'Try again'}</button>}</div> : <section className="selector-card pump-results-card">
        <h2><span>07</span>{de ? 'Pumpenfamilie' : 'Pump family'}</h2>
        <div className="pump-table-scroll"><table className="pump-results-table pump-family-table"><thead><tr><th>{de ? 'Familie' : 'Family'}</th><th>{de ? 'Ausführung' : 'Type'}</th><th>{de ? 'Einbaulage' : 'Orientation'}</th><th>{de ? 'Eignung / Grund' : 'Suitability / Reason'}</th></tr></thead><tbody>
          {response.rows.map(row => <tr key={row.family} className={`${row.compatible ? 'is-compatible' : 'is-incompatible'}${row.compatible && selection.selectedFamily === row.family ? ' is-selected' : ''}`}>
            <td><label className={`pump-result-choice${row.compatible ? '' : ' is-disabled'}`}><input type="radio" name="pump-family" disabled={!row.compatible} checked={row.compatible && selection.selectedFamily === row.family} onChange={() => { if (row.compatible) setSelection(previous => ({ ...previous, selectedFamily: row.family })); }} /><strong>{row.family}</strong></label></td>
            <td>{types[row.applicationType] || row.applicationType}</td><td>{[row.vertical && (de ? 'Vertikal' : 'Vertical'), row.horizontal && 'Horizontal'].filter(Boolean).join(' / ')}</td>
            <td className="pump-reason">{row.compatible ? (de ? 'Geeignet' : 'Suitable') : [!row.typeMatches && (de ? 'Andere Food-/ATEX-Ausführung' : 'Different Food / ATEX type'), !row.orientationMatches && (de ? 'Andere Einbaulage' : 'Different orientation')].filter(Boolean).join(' · ')}</td>
          </tr>)}
        </tbody></table></div>
      </section>}
    </>}
    <div className="selector-page-actions"><Link className="outline-button" href="/select/pump">← {de ? 'Zurück' : 'Back'}</Link></div>
  </main>;
}
