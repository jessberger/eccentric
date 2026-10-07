import type { PumpFamilyInput } from './pump-family';
import type { PumpCalculationError } from './pump-calculation';

export type PumpModelInput = PumpFamilyInput & { family: string };
export type PumpModel = { model: string; phase: string; rotation: string };
export type PumpModelResponse = { rows: PumpModel[]; requiredRpm: number | null; error: PumpCalculationError | null };
