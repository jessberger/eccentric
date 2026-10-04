'use server';

import { supabaseServer } from '@/lib/supabase';
import { offerFields } from '@/lib/offer-groups';
import { isValidOfferDate, todayInBerlin } from '@/lib/offer-dates';
import type { Offer, OfferBatch, OfferLoadError, OfferSaveResult, OfferSaveError, RevisionContextResult } from '@/lib/offers';

function failure(error: OfferLoadError): OfferBatch { return { offers: [], remaining: 0, nextCursor: null, error }; }

function mapOffer(row: Record<string, unknown>): Offer {
  const recordVersion = Number(row.record_version);
  if (!Number.isSafeInteger(recordVersion) || recordVersion < 1) throw new Error('Invalid record version');
  return { id: String(row.id), recordVersion, revisionIndex: Number(row.revision_index ?? 0), values: Object.fromEntries(offerFields.map(field => [field.key, row[field.key] == null ? '' : String(row[field.key])])) };
}

export async function loadOfferBatch(cursor: string | null = null): Promise<OfferBatch> {
  if (cursor !== null && (typeof cursor !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor))) return failure('unavailable');
  try {
    const supabase = await supabaseServer();
    if (!supabase) return failure('configuration');
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return failure('auth');
    const columns = offerFields.map(field => field.key);
    let request = supabase.from('eski_teklifler').select(['id', 'record_version', 'revision_index', ...columns].join(','), { count: 'exact' }).eq('is_active', true).order('id', { ascending: true }).limit(1000);
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
  const allowed = new Set(columns);
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1 || !changes || typeof changes !== 'object' || Array.isArray(changes)) return invalid;
  const entries = Object.entries(changes);
  if (!entries.length || entries.length > allowed.size || entries.some(([key, value]) => !allowed.has(key) || typeof value !== 'string' || value.length > 100000 || value.includes('\u0000')) || JSON.stringify(changes).length > 500000) return invalid;
  for (const [key, value] of entries) {
    if (key === 'offer_date' && value !== '' && !isValidOfferDate(value)) return invalid;
    if (key === 'last_modified' && !isValidOfferDate(value)) return invalid;
  }
  const updateValues: Record<string, string | null> = Object.fromEntries(entries);
  if (!Object.hasOwn(changes, 'last_modified')) updateValues.last_modified = todayInBerlin();
  if (updateValues.offer_date === '') updateValues.offer_date = null;

  try {
    const supabase = await supabaseServer();
    if (!supabase) return { offer: null, error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { offer: null, error: 'auth' };

    // The version condition and the history trigger execute in the same UPDATE.
    // Only changed fields are sent, preserving untouched NULLs and original values.
    const { data, error } = await supabase.from('eski_teklifler')
      .update(updateValues)
      .eq('id', id)
      .eq('record_version', expectedVersion)
      .eq('is_active', true)
      .select(['id', 'record_version', 'revision_index', ...columns].join(','))
      .maybeSingle();

    if (error) {
      console.error('Offer update failed:', error.code);
      if (error.message.includes('OFFER_INACTIVE')) return { offer: null, error: 'conflict' };
      if (error.code === '23505') return { offer: null, error: 'exists' };
      if (error.message.includes('REVISION_NUMBER_FIXED')) return { offer: null, error: 'number' };
      if (error.code === '42501') return { offer: null, error: 'permission' };
      if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) return { offer: null, error: 'schema' };
      if (['PGRST301', 'PGRST303'].includes(error.code)) return { offer: null, error: 'auth' };
      return { offer: null, error: 'unavailable' };
    }
    if (!data) return { offer: null, error: 'conflict' };
    return { offer: mapOffer(data as unknown as Record<string, unknown>), error: null };
  } catch { return { offer: null, error: 'unavailable' }; }
}

function revisionError(error: { code: string; message: string }): OfferSaveError {
  if (error.message.includes('AUTH_REQUIRED') || ['PGRST301', 'PGRST303'].includes(error.code)) return 'auth';
  if (['SOURCE_CHANGED', 'SOURCE_INACTIVE', 'OFFER_INACTIVE'].some(message => error.message.includes(message)) || error.code === 'P0002') return 'conflict';
  if (['REVISION_EXISTS', 'OFFER_EXISTS'].some(message => error.message.includes(message)) || error.code === '23505') return 'exists';
  if (error.message.includes('INVALID_REVISION') || error.message.includes('REVISION_NUMBER_FIXED')) return 'number';
  if (error.message.includes('INVALID_') || error.message.includes('REQUEST_CONFLICT') || error.code.startsWith('22')) return 'invalid';
  if (error.code === '42501') return 'permission';
  if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code)) return 'schema';
  return 'unavailable';
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function loadRevisionContext(sourceId: string): Promise<RevisionContextResult> {
  if (typeof sourceId !== 'string' || !uuid.test(sourceId)) return { context: null, error: 'invalid' };
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { context: null, error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { context: null, error: 'auth' };
    const { data, error } = await supabase.rpc('get_revision_context', { p_source_id: sourceId });
    if (error) return { context: null, error: revisionError(error) };
    if (!data.source.is_active) return { context: null, error: 'conflict' };
    const { data: activeFamily, error: familyError } = await supabase.from('eski_teklifler')
      .select('id').eq('family_id', data.source.family_id).eq('is_active', true);
    if (familyError) return { context: null, error: revisionError(familyError) };
    const activeIds = new Set((activeFamily ?? []).map(row => row.id));
    return { context: { source: mapOffer(data.source), baseOfferNo: data.base_offer_no, suggestedOfferNo: data.suggested_offer_no,
      relatedOffers: data.related_offers.filter((row: { id: string }) => activeIds.has(row.id)).map((row: { id: string; offer_no: string }) => ({ id: row.id, offerNo: row.offer_no })) }, error: null };
  } catch { return { context: null, error: 'unavailable' }; }
}
export async function saveRevision(sourceId: string, version: number, offerNo: string, changes: Record<string, string>, requestId: string): Promise<OfferSaveResult> {
  const invalid: OfferSaveResult = { offer: null, error: 'invalid' };
  if (typeof sourceId !== 'string' || !uuid.test(sourceId) || typeof requestId !== 'string' || !uuid.test(requestId) ||
      !Number.isSafeInteger(version) || version < 1 || typeof offerNo !== 'string' || offerNo.length > 100000 || offerNo.includes('\u0000') ||
      !changes || typeof changes !== 'object' || Array.isArray(changes)) return invalid;
  const allowed = new Set(offerFields.map(field => field.key).filter(key => key !== 'offer_no'));
  if (Object.entries(changes).some(([key, value]) => !allowed.has(key) || typeof value !== 'string' || value.length > 100000 || value.includes('\u0000')) ||
      new TextEncoder().encode(JSON.stringify(changes)).length > 500000 || !isValidOfferDate(changes.offer_date) || !isValidOfferDate(changes.last_modified)) return invalid;
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { offer: null, error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { offer: null, error: 'auth' };
    const { data, error } = await supabase.rpc('create_offer_revision', {
      p_source_id: sourceId, p_source_version: version, p_offer_no: offerNo,
      p_changes: changes, p_request_id: requestId,
    });
    if (error) return { offer: null, error: revisionError(error) };
    if (data?.is_active === false) return { offer: null, error: 'conflict' };
    return { offer: mapOffer(data), error: null };
  } catch { return { offer: null, error: 'unavailable' }; }
}

export async function deleteOffer(id: string, expectedVersion: number): Promise<{ error: OfferSaveError | null }> {
  if (typeof id !== 'string' || !uuid.test(id) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return { error: 'invalid' };
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { error: 'auth' };
    const { data, error } = await supabase.rpc('soft_delete_offer', { p_offer_id: id, p_expected_version: expectedVersion });
    if (error) return { error: revisionError(error) };
    if (data?.id !== id || data?.is_active !== false) return { error: 'unavailable' };
    return { error: null };
  } catch { return { error: 'unavailable' }; }
}

export async function saveCopy(sourceId: string, version: number, offerNo: string, changes: Record<string, string>, requestId: string): Promise<OfferSaveResult> {
  if (typeof offerNo === 'string') offerNo = offerNo.trim();
  const invalid: OfferSaveResult = { offer: null, error: 'invalid' };
  if (typeof sourceId !== 'string' || !uuid.test(sourceId) || typeof requestId !== 'string' || !uuid.test(requestId) ||
      !Number.isSafeInteger(version) || version < 1 || typeof offerNo !== 'string' || !offerNo || offerNo.length > 1000 || /[\u0000-\u001f\u007f]/.test(offerNo) ||
      !changes || typeof changes !== 'object' || Array.isArray(changes)) return invalid;
  const allowed = new Set(offerFields.map(field => field.key).filter(key => key !== 'offer_no'));
  if (Object.entries(changes).some(([key, value]) => !allowed.has(key) || typeof value !== 'string' || value.length > 100000 || value.includes('\u0000')) ||
      new TextEncoder().encode(JSON.stringify(changes)).length > 500000 || !isValidOfferDate(changes.offer_date) || !isValidOfferDate(changes.last_modified)) return invalid;
  try {
    const supabase = await supabaseServer();
    if (!supabase) return { offer: null, error: 'configuration' };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return { offer: null, error: 'auth' };
    const { data, error } = await supabase.rpc('create_offer_copy', {
      p_source_id: sourceId, p_source_version: version, p_offer_no: offerNo,
      p_changes: changes, p_request_id: requestId,
    });
    if (error) return { offer: null, error: revisionError(error) };
    if (data?.is_active === false) return { offer: null, error: 'conflict' };
    return { offer: mapOffer(data), error: null };
  } catch { return { offer: null, error: 'unavailable' }; }
}
