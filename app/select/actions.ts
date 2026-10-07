'use server';

import { supabaseServer } from '@/lib/supabase';
import { isValidPumpInput, type PumpCalculationInput, type PumpCalculationResponse, type PumpResult } from '@/lib/pump-calculation';
import { familyMatches, type PumpFamilyInput, type PumpFamilyResponse } from '@/lib/pump-family';
import type { PumpModelInput, PumpModelResponse } from '@/lib/pump-model';

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function loadPumpModels(input: PumpModelInput): Promise<PumpModelResponse> {
  const fail = (error: PumpModelResponse['error']): PumpModelResponse => ({ rows: [], requiredRpm: null, error });
  if (typeof input.family !== 'string' || !input.family || input.family.length > 100) return fail('invalid');
  const families = await loadPumpFamilies(input);
  if (families.error) return fail(families.error);
  if (!families.rows.some(row => row.family === input.family && row.compatible)) return fail('invalid');
  try {
    const supabase = await supabaseServer();
    if (!supabase) return fail('configuration');
    const { data, error } = await supabase.from('pump_selection_drives').select('pump_model, phase, rotation').order('sort_order').abortSignal(AbortSignal.timeout(20000));
    if (error) {
      if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) return fail('schema');
      if (error.code === '42501') return fail('permission');
      if (['PGRST301', 'PGRST303'].includes(error.code)) return fail('auth');
      return fail('unavailable');
    }
    if (!data?.length) return fail('schema');
    return { rows: data.map(row => ({ model: String(row.pump_model), phase: String(row.phase), rotation: String(row.rotation) })), requiredRpm: families.requiredRpm, error: null };
  } catch { return fail('unavailable'); }
}

export async function calculatePumps(input: PumpCalculationInput): Promise<PumpCalculationResponse> {
  if (!isValidPumpInput(input)) return { rows: [], error: 'invalid' };
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { rows: [], error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { rows: [], error: 'auth' };
    const { data, error } = await supabase.rpc('calculate_pump_selection', {
      p_flow_lmin: input.flowLmin, p_pressure_bar: input.pressureBar, p_orientation: input.orientation,
      p_abrasivity_group: input.abrasivityGroup, p_viscosity_group: input.viscosityGroup,
    }).abortSignal(AbortSignal.timeout(20000));
    if (error) {
      console.error('Pump calculation failed:', error.code);
      if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code)) return { rows: [], error: 'schema' };
      if (error.code === '42501') return { rows: [], error: 'permission' };
      if (error.message.includes('AUTH_REQUIRED') || ['PGRST301', 'PGRST303'].includes(error.code)) return { rows: [], error: 'auth' };
      if (error.message.includes('INVALID_SELECTION')) return { rows: [], error: 'invalid' };
      return { rows: [], error: 'unavailable' };
    }
    if (!Array.isArray(data) || !data.length) return { rows: [], error: 'schema' };
    const rows: PumpResult[] = data.map((row: Record<string, unknown>) => {
      const requiredRpm = numeric(row.required_rpm);
      const maximumRpm = numeric(row.maximum_rpm);
      const hasData = row.has_data === true && requiredRpm !== null && maximumRpm !== null;
      return {
        pumpCode: String(row.pump_code), requiredRpm,
        abrasivityRpm: numeric(row.rpm_abrasivity), viscosityRpm: numeric(row.rpm_viscosity),
        mediaMaximumRpm: numeric(row.media_maximum_rpm), pumpMaximumRpm: numeric(row.pump_maximum_rpm),
        maximumRpm, maximumSource: typeof row.maximum_source === 'string' ? row.maximum_source : null,
        maximumPercent: numeric(row.maximum_percent),
        stageMatches: row.stage_matches === true, orientationMatches: row.orientation_matches === true, hasData,
        compatible: row.is_compatible === true && hasData && requiredRpm! > 0 && requiredRpm! <= maximumRpm!,
        estimated: row.media_is_estimated === true,
      };
    });
    return { rows, error: null };
  } catch { return { rows: [], error: 'unavailable' }; }
}

export async function loadPumpFamilies(input: PumpFamilyInput): Promise<PumpFamilyResponse> {
  const fail = (error: PumpFamilyResponse['error']): PumpFamilyResponse => ({ rows: [], requiredRpm: null, error });
  if (!isValidPumpInput(input) || !['food', 'non-food'].includes(input.application) || !['atex', 'non-atex'].includes(input.certification) || typeof input.pumpCode !== 'string' || !input.pumpCode || input.pumpCode.length > 50) return fail('invalid');
  try {
    const supabase = await supabaseServer();
    if (!supabase) return fail('configuration');
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return fail('auth');
    const [calculation, families] = await Promise.all([
      supabase.rpc('calculate_pump_selection', {
        p_flow_lmin: input.flowLmin, p_pressure_bar: input.pressureBar, p_orientation: input.orientation,
        p_abrasivity_group: input.abrasivityGroup, p_viscosity_group: input.viscosityGroup,
      }).abortSignal(AbortSignal.timeout(20000)),
      supabase.from('pump_selection_families').select('pump_family, application_type, supports_vertical, supports_horizontal').order('sort_order').abortSignal(AbortSignal.timeout(20000)),
    ]);
    const error = calculation.error || families.error;
    if (error) {
      console.error('Pump family read failed:', error.code);
      if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code)) return fail('schema');
      if (error.code === '42501') return fail('permission');
      if (error.message.includes('AUTH_REQUIRED') || ['PGRST301', 'PGRST303'].includes(error.code)) return fail('auth');
      if (error.message.includes('INVALID_SELECTION')) return fail('invalid');
      return fail('unavailable');
    }
    const pump = Array.isArray(calculation.data) ? calculation.data.find(row => row.pump_code === input.pumpCode && row.is_compatible === true) : null;
    const requiredRpm = pump ? numeric(pump.required_rpm) : null;
    if (!pump || requiredRpm === null || requiredRpm <= 0) return fail('invalid');
    if (!families.data?.length) return fail('schema');
    const rows = families.data.map(row => {
      const family = { family: String(row.pump_family), applicationType: String(row.application_type), vertical: row.supports_vertical === true, horizontal: row.supports_horizontal === true };
      return { ...family, ...familyMatches(family, input) };
    });
    return { rows, requiredRpm, error: null };
  } catch { return fail('unavailable'); }
}
