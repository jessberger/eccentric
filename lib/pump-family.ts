import type { PumpCalculationInput, PumpCalculationError } from './pump-calculation';

export type PumpFamilyInput = PumpCalculationInput & {
  application: 'food' | 'non-food';
  certification: 'atex' | 'non-atex';
  pumpCode: string;
};
export type PumpFamily = {
  family: string;
  applicationType: string;
  vertical: boolean;
  horizontal: boolean;
  typeMatches: boolean;
  orientationMatches: boolean;
  compatible: boolean;
};
export type PumpFamilyResponse = { rows: PumpFamily[]; requiredRpm: number | null; error: PumpCalculationError | null };

export function familyApplicationType(application: PumpFamilyInput['application'], certification: PumpFamilyInput['certification']) {
  if (application === 'food') return certification === 'atex' ? 'atex_food' : 'food';
  return certification === 'atex' ? 'atex' : 'standard';
}

export function familyMatches(family: { applicationType: string; vertical: boolean; horizontal: boolean }, input: PumpFamilyInput) {
  const typeMatches = family.applicationType === familyApplicationType(input.application, input.certification);
  const orientationMatches = input.orientation === 'vertical' ? family.vertical : family.horizontal;
  return { typeMatches, orientationMatches, compatible: typeMatches && orientationMatches };
}
