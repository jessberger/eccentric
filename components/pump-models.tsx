'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadPumpModels } from '@/app/select/actions';
import { isValidPumpInput } from '@/lib/pump-calculation';
import type { PumpModelResponse } from '@/lib/pump-model';
import { useLanguage } from './language';
import { flowFactors, usePumpSelection } from './pump-selection';
import { PumpSelectionSummary } from './pump-selection-summary';

export function PumpModels({ completed = false }: { completed?: boolean }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection, setSelection } = usePumpSelection();
  const router = useRouter();
  const { pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode, selectedFamily } = selection;
  const flowLmin = Number(selection.flowValue) * flowFactors[selection.flowUnit];
  const valid = !!selectedPumpCode && !!selectedFamily && (!completed || !!selection.selectedModel) && isValidPumpInput({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity });
  const requestKey = JSON.stringify([flowLmin, pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode, selectedFamily]);
  const [validOnEntry] = useState(valid);
  const [result, setResult] = useState<{ key: string; response: PumpModelResponse } | null>(null);
  const [retry, setRetry] = useState(0);
  const response = result?.key === requestKey ? result.response : null;
  const selectedModel = response?.rows.find(row => row.model === selection.selectedModel);
  const pumpName = `${selectedFamily}${selectedPumpCode} ${selection.selectedModel.split(' - ')[0]}`;
  useEffect(() => {
    if (!validOnEntry) router.replace('/select');
  }, [validOnEntry, router]);
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    async function load() {
      let response: PumpModelResponse;
      try { response = await loadPumpModels({ flowLmin, pressureBar: pressure, orientation, abrasivityGroup: abrasivity, viscosityGroup: viscosity, application, certification, pumpCode: selectedPumpCode, family: selectedFamily }); }
      catch { response = { rows: [], requiredRpm: null, error: 'unavailable' }; }
      if (!cancelled) setResult({ key: requestKey, response });
    }
    void load();
    return () => { cancelled = true; };
  }, [flowLmin, pressure, orientation, abrasivity, viscosity, application, certification, selectedPumpCode, selectedFamily, requestKey, valid, retry]);
  const errors = {
    invalid: de ? 'Die gewählte Pumpe oder Familie ist nicht mehr verfügbar.' : 'The selected pump or family is no longer available.',
    auth: de ? 'Bitte erneut anmelden.' : 'Please sign in again.',
    configuration: de ? 'Modelldaten sind nicht verfügbar.' : 'Model data is unavailable.',
    schema: de ? 'Modelldaten sind noch nicht verfügbar.' : 'Model data is not available yet.',
    permission: de ? 'Keine Berechtigung für Modelldaten.' : 'You do not have access to model data.',
    unavailable: de ? 'Modelle konnten nicht geladen werden.' : 'Models could not be loaded.',
  };
  return <main className="pump-selector">
    <header className="selector-page-heading"><h1>Screw Pump</h1><p>{completed ? (de ? 'Pumpenauswahl abgeschlossen' : 'Pump selection complete') : (de ? 'Schritt 5 – Modell' : 'Step 5 – Model')}</p></header>
    {valid && <>
      <PumpSelectionSummary requiredRpm={response?.requiredRpm} includeFamily includeModel />
      {completed && <h2 className="selected-pump-name">{pumpName}</h2>}
      {!response ? <p role="status" className="form-note">{de ? 'Wird geladen…' : 'Loading…'}</p> : response.error || (completed && !selectedModel) ? <div className="pump-result-error"><p role="alert" className="form-error">{errors[response.error ?? 'invalid']}</p>{response.error === 'auth' ? <Link className="outline-button" href="/login">{de ? 'Anmelden' : 'Sign in'}</Link> : <button type="button" className="outline-button" onClick={() => { setResult(null); setRetry(value => value + 1); }}>{de ? 'Erneut versuchen' : 'Try again'}</button>}</div> : completed ? null : <section className="selector-card pump-results-card">
        <h2><span>08</span>{de ? 'Modell' : 'Model'}</h2>
        <div className="pump-table-scroll"><table className="pump-results-table"><thead><tr><th>{de ? 'Modell' : 'Model'}</th><th>Phase</th><th>{de ? 'Drehzahl (RPM)' : 'Rotation (RPM)'}</th></tr></thead><tbody>
          {response.rows.map(row => <tr key={row.model} className={`is-compatible${selection.selectedModel === row.model ? ' is-selected' : ''}`}>
            <td><label className="pump-result-choice"><input type="radio" name="pump-model" checked={selection.selectedModel === row.model} onChange={() => setSelection(previous => ({ ...previous, selectedModel: row.model }))} /><strong>{row.model}</strong></label></td>
            <td>{row.phase}</td><td>{row.rotation.replace('~', '–')}</td>
          </tr>)}
        </tbody></table></div>
      </section>}
    </>}
    <div className="selector-page-actions"><Link className="outline-button" href={completed ? '/select/model' : '/select/family'}>← {de ? 'Zurück' : 'Back'}</Link>{!completed && valid && !response?.error && selectedModel && <button type="button" className="solid-button" onClick={() => router.push('/select/summary')}>{de ? 'Weiter' : 'Next'} <span aria-hidden="true">→</span></button>}</div>
  </main>;
}
