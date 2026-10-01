export type Offer = { id: string; recordVersion: number; values: Record<string, string> };
export type OfferLoadError = 'auth' | 'configuration' | 'schema' | 'permission' | 'unavailable';
export type OfferBatch = { offers: Offer[]; remaining: number; nextCursor: string | null; error: OfferLoadError | null };
export const OFFER_PAGE_SIZE = 20;
export type OfferSaveError = OfferLoadError | 'invalid' | 'conflict';
export type OfferSaveResult = { offer: Offer; error: null } | { offer: null; error: OfferSaveError };
