'use server';

import { supabaseServer } from '@/lib/supabase';
import { offerFields } from '@/lib/offer-groups';
import type { OfferBatch, OfferLoadError } from '@/lib/offers';

function failure(error: OfferLoadError): OfferBatch { return { offers: [], remaining: 0, nextCursor: null, error }; }

export async function loadOfferBatch(cursor: string | null = null): Promise<OfferBatch> {
  if (cursor !== null && (typeof cursor !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor))) return failure('unavailable');
  try {
    const supabase = await supabaseServer();
    if (!supabase) return failure('configuration');
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return failure('auth');
    const columns = offerFields.map(field => field.key);
    let request = supabase.from('eski_teklifler').select(['id', ...columns].join(','), { count: 'exact' }).order('id', { ascending: true }).limit(1000);
    if (cursor) request = request.gt('id', cursor);
    const { data, count, error } = await request.abortSignal(AbortSignal.timeout(20000));
    if (error) {
      console.error('Offer read failed:', error.code);
      if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) return failure('schema');
      if (error.code === '42501') return failure('permission');
      if (['PGRST301', 'PGRST303'].includes(error.code)) return failure('auth');
      return failure('unavailable');
    }
    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    if (count === null || (!rows.length && count > 0)) return failure('unavailable');
    const offers = rows.map(row => ({ id: String(row.id), values: Object.fromEntries(columns.map(column => [column, row[column] == null ? '' : String(row[column])])) }));
    return { offers, remaining: count, nextCursor: rows.length < count ? offers[offers.length - 1].id : null, error: null };
  } catch { return failure('unavailable'); }
}
