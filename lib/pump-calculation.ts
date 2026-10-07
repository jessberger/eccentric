export type PumpCalculationInput = {
  flowLmin: number;
  pressureBar: 6 | 12 | 24;
  orientation: 'vertical' | 'horizontal';
  abrasivityGroup: number;
  viscosityGroup: number;
};

export type PumpResult = {
  pumpCode: string;
  requiredRpm: number | null;
  abrasivityRpm: number | null;
  viscosityRpm: number | null;
  mediaMaximumRpm: number | null;
  pumpMaximumRpm: number | null;
  maximumRpm: number | null;
  minimumRpm: number;
  maximumSource: string | null;
  maximumPercent: number | null;
  stageMatches: boolean;
  orientationMatches: boolean;
  hasData: boolean;
  compatible: boolean;
  estimated: boolean;
};

export type PumpCalculationError = 'invalid' | 'auth' | 'configuration' | 'schema' | 'permission' | 'unavailable';
export type PumpCalculationResponse = { rows: PumpResult[]; error: PumpCalculationError | null };

export function isRpmWithinLimits(required: number | null, maximum: number | null, minimum = 100): boolean {
  return required !== null && maximum !== null && Number.isFinite(required) && Number.isFinite(maximum)
    && Number.isFinite(minimum) && minimum > 0 && required >= minimum && required <= maximum;
}

export function isValidPumpInput(input: PumpCalculationInput): boolean {
  return !!input && typeof input === 'object'
    && Number.isFinite(input.flowLmin) && input.flowLmin > 0
    && [6, 12, 24].includes(input.pressureBar)
    && ['vertical', 'horizontal'].includes(input.orientation)
    && Number.isInteger(input.abrasivityGroup) && input.abrasivityGroup >= 1 && input.abrasivityGroup <= 4
    && Number.isInteger(input.viscosityGroup) && input.viscosityGroup >= 1 && input.viscosityGroup <= 4;
}
