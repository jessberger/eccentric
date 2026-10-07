'use client';

import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export type FlowUnit = 'lmin' | 'lhour' | 'm3hour';
export type MediaGroup = 0 | 1 | 2 | 3 | 4;
export type Selection = {
  application: 'non-food' | 'food';
  certification: 'non-atex' | 'atex';
  orientation: 'vertical' | 'horizontal';
  pressure: 6 | 12 | 24;
  flowUnit: FlowUnit;
  flowValue: string;
  abrasivity: MediaGroup;
  viscosity: MediaGroup;
};
const initial: Selection = { application: 'non-food', certification: 'non-atex', orientation: 'vertical', pressure: 6, flowUnit: 'lmin', flowValue: '', abrasivity: 0, viscosity: 0 };
const draftKey = 'eccentric-selector-draft-v1';
export const flowFactors: Record<FlowUnit, number> = { lmin: 1, lhour: 1 / 60, m3hour: 1000 / 60 };
const Context = createContext<{ selection: Selection; setSelection: Dispatch<SetStateAction<Selection>>; ready: boolean } | null>(null);

function mediaGroup(value: unknown): MediaGroup {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : 0;
}

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
    abrasivity: mediaGroup(draft.abrasivity),
    viscosity: mediaGroup(draft.viscosity),
  };
}

export function PumpSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<Selection>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setSelection(restoreDraft(JSON.parse(sessionStorage.getItem(draftKey) || 'null'))); } catch { /* Keep defaults when storage is unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) { try { sessionStorage.setItem(draftKey, JSON.stringify(selection)); } catch { /* Keep the in-memory selection. */ } }
  }, [selection, ready]);
  return <Context.Provider value={{ selection, setSelection, ready }}>{children}</Context.Provider>;
}

export function usePumpSelection() {
  const value = useContext(Context);
  if (!value) throw new Error('PumpSelectionProvider is required');
  return value;
}
