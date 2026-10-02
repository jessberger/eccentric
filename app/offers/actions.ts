'use server';

import { supabaseServer } from '@/lib/supabase';
import { offerFields } from '@/lib/offer-groups';
import type { Offer, OfferBatch, OfferLoadError, OfferSaveResult } from '@/lib/offers';

function failure(error: OfferLoadError): OfferBatch { return { offers: [], remaining: 0, nextCursor: null, error }; }

function mapOffer(row: Record<string, unknown>): Offer {
  const recordVersion = Number(row.record_version);
  if (!Number.isSafeInteger(recordVersion) || recordVersion < 1) throw new Error('Invalid record version');
  return { id: String(row.id), recordVersion, values: Object.fromEntries(offerFields.map(field => [field.key, row[field.key] == null ? '' : String(row[field.key])])) };
}

export async function loadOfferBatch(cursor: string | null = null): Promise<OfferBatch> {
  if (cursor !== null && (typeof cursor !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor))) return failure('unavailable');
  try {
    const supabase = await supabaseServer();
    if (!supabase) return failure('configuration');
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return failure('auth');
    const columns = offerFields.map(field => field.key);
    let request = supabase.from('eski_teklifler').select(['id', 'record_version', ...columns].join(','), { count: 'exact' }).order('id', { ascending: true }).limit(1000);
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
    const offers = rows.map(mapOffer);
    return { offers, remaining: count, nextCursor: rows.length < count ? offers[offers.length - 1].id : null, error: null };
  } catch { return failure('unavailable'); }
}

export async function saveOffer(id: string, expectedVersion: number, changes: Record<string, string>): Promise<OfferSaveResult> {
  const invalid: OfferSaveResult = { offer: null, error: 'invalid' };
  const columns = offerFields.map(field => field.key);
  const allowed = new Set(columns.filter(key => key !== 'offer_date' && key !== 'last_modified'));
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1 || !changes || typeof changes !== 'object' || Array.isArray(changes)) return invalid;
  const entries = Object.entries(changes);
  if (!entries.length || entries.length > allowed.size || entries.some(([key, value]) => !allowed.has(key) || typeof value !== 'string' || value.length > 100000 || value.includes('\u0000')) || JSON.stringify(changes).length > 500000) return invalid;

  try {
    const supabase = await supabaseServer();
    if (!supabase) return { offer: null, error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { offer: null, error: 'auth' };

    // The version condition and the history trigger execute in the same UPDATE.
    // Only changed fields are sent, preserving untouched NULLs and original values.
    const { data, error } = await supabase.from('eski_teklifler')
      .update(Object.fromEntries(entries))
      .eq('id', id)
      .eq('record_version', expectedVersion)
      .select(['id', 'record_version', ...columns].join(','))
      .maybeSingle();

    if (error) {
      console.error('Offer update failed:', error.code);
      if (error.code === '42501') return { offer: null, error: 'permission' };
      if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) return { offer: null, error: 'schema' };
      if (['PGRST301', 'PGRST303'].includes(error.code)) return { offer: null, error: 'auth' };
      return { offer: null, error: 'unavailable' };
    }
    if (!data) return { offer: null, error: 'conflict' };
    return { offer: mapOffer(data as unknown as Record<string, unknown>), error: null };
  } catch { return { offer: null, error: 'unavailable' }; }
}
