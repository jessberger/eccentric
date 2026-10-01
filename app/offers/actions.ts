'use server';

import { supabaseServer } from '@/lib/supabase';
import { offerFields } from '@/lib/offer-groups';
import { OFFER_PAGE_SIZE, type OfferSearch, type OfferResult, type OfferLoadError } from '@/lib/offers';

function failure(error: OfferLoadError): OfferResult { return { offers: [], count: 0, error }; }

// Protect the PostgREST OR grammar, and treat SQL wildcard characters as text.
function pattern(value: string) { return `%${value.replace(/[\\%_]/g, '\\$&')}%`; }

export async function loadOffers(input: OfferSearch): Promise<OfferResult> {
  if (!input || typeof input.query !== 'string' || input.query.length > 100 ||
      !Number.isInteger(input.page) || input.page < 1 || input.page > 10000 ||
      !input.filters || typeof input.filters !== 'object' || Array.isArray(input.filters)) return failure('invalid');
  const columns = offerFields.map(field => field.key);
  const entries = Object.entries(input.filters);
  if (entries.length > columns.length || entries.some(([key, value]) => !columns.includes(key) || typeof value !== 'string' || value.length > 160)) return failure('invalid');

  try {
    const supabase = await supabaseServer();
    if (!supabase) return failure('configuration');
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return failure('auth');

    let request = supabase.from('eski_teklifler').select(['id', ...columns].join(','), { count: 'exact' });
    const term = input.query.trim();
    if (term) {
      const quotedPattern = JSON.stringify(pattern(term));
      request = request.or(columns.map(column => `${column}.ilike.${quotedPattern}`).join(','));
    }
    for (const [key, value] of entries) {
      if (value.trim()) request = request.ilike(key, pattern(value.trim()));
    }
    const from = (input.page - 1) * OFFER_PAGE_SIZE;
    const { data, count, error } = await request
      .order('offer_no', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, from + OFFER_PAGE_SIZE - 1)
      .abortSignal(AbortSignal.timeout(20000));

    if (error) {
      // Log codes only, never customer data, search terms or tokens.
      console.error('Offer read failed:', error.code);
      if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) return failure('schema');
      if (error.code === '42501') return failure('permission');
      if (['PGRST301', 'PGRST303'].includes(error.code)) return failure('auth');
      return failure('unavailable');
    }

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    return {
      offers: rows.map(row => ({
        id: String(row.id),
        values: Object.fromEntries(columns.map(column => [column, row[column] == null ? '' : String(row[column])])),
      })),
      count: count ?? 0,
      error: null,
    };
  } catch { return failure('unavailable'); }
}
