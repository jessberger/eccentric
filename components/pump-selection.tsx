'use client';

import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';

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
  selectedPumpCode: string;
};
const initial: Selection = { application: 'non-food', certification: 'non-atex', orientation: 'vertical', pressure: 6, flowUnit: 'lmin', flowValue: '', abrasivity: 0, viscosity: 0, selectedPumpCode: '' };
export const flowFactors: Record<FlowUnit, number> = { lmin: 1, lhour: 1 / 60, m3hour: 1000 / 60 };
const Context = createContext<{ selection: Selection; setSelection: Dispatch<SetStateAction<Selection>>; ready: boolean; resetSelection: () => void } | null>(null);

export function PumpSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, update] = useState<Selection>(initial);
  const setSelection: Dispatch<SetStateAction<Selection>> = value => update(previous => {
    const next = typeof value === 'function' ? value(previous) : value;
    const fields = ['application', 'certification', 'orientation', 'pressure', 'flowUnit', 'flowValue', 'abrasivity', 'viscosity'] as const;
    return fields.some(key => next[key] !== previous[key]) ? { ...next, selectedPumpCode: '' } : next;
  });
  // The root layout keeps this state across steps; a browser reload starts fresh.
  function resetSelection() { setSelection({ ...initial }); }
  return <Context.Provider value={{ selection, setSelection, ready: true, resetSelection }}>{children}</Context.Provider>;
}

export function usePumpSelection() {
  const value = useContext(Context);
  if (!value) throw new Error('PumpSelectionProvider is required');
  return value;
}
