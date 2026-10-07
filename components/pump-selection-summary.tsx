'use client';

import { useLanguage } from './language';
import { flowFactors, usePumpSelection } from './pump-selection';

export function PumpSelectionSummary({ requiredRpm, includeFamily = false, includeModel = false }: { requiredRpm?: number | null; includeFamily?: boolean; includeModel?: boolean }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const { selection } = usePumpSelection();
  const format = (value: number) => value.toLocaleString(language, { maximumFractionDigits: 1 });
  const flowLmin = Number(selection.flowValue) * flowFactors[selection.flowUnit];
  const items: { number: string; value: string }[] = [
    { number: '01', value: [selection.application === 'food' ? 'Food' : (de ? 'Non-Food' : 'No Food'), selection.certification === 'atex' ? 'ATEX' : (de ? 'Non-ATEX' : 'No ATEX'), selection.orientation === 'vertical' ? (de ? 'Vertikal' : 'Vertical') : 'Horizontal'].join(' | ') },
    { number: '02', value: `${format(flowLmin)} l/min` },
    { number: '03', value: `${selection.pressure} bar` },
  ];
  if (selection.abrasivity) items.push({ number: '04', value: `${de ? 'Abrasivität' : 'Abrasivity'} ${selection.abrasivity}` });
  if (selection.viscosity) items.push({ number: '05', value: `${de ? 'Viskosität' : 'Viscosity'} ${selection.viscosity}` });
  if (selection.selectedPumpCode) items.push({ number: '06', value: `${selection.selectedPumpCode}${requiredRpm != null ? ` | ${format(requiredRpm)} RPM` : ''}` });
  if (includeFamily && selection.selectedFamily) items.push({ number: '07', value: selection.selectedFamily });
  if (includeModel && selection.selectedModel) items.push({ number: '08', value: selection.selectedModel });
  return <div className="pump-selection-summary" role="group" aria-label={de ? 'Gewählte Werte' : 'Selected values'}>
    {items.map(item => <span key={item.number}><b>{item.number}</b>{item.value}</span>)}
  </div>;
}
