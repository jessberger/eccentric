'use server';

import { supabaseServer } from '@/lib/supabase';
import { isValidPumpInput, type PumpCalculationInput, type PumpCalculationResponse, type PumpResult } from '@/lib/pump-calculation';

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
