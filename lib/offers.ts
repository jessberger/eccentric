export type Offer = { id: string; recordVersion: number; revisionIndex: number; values: Record<string, string> };
export type OfferLoadError = 'auth' | 'configuration' | 'schema' | 'permission' | 'unavailable';
export type OfferBatch = { offers: Offer[]; remaining: number; nextCursor: string | null; error: OfferLoadError | null };
export const OFFER_PAGE_SIZE = 20;
export type OfferSaveError = OfferLoadError | 'invalid' | 'conflict' | 'exists' | 'number';
export type OfferSaveResult = { offer: Offer; error: null } | { offer: null; error: OfferSaveError };
export type RevisionContext = { source: Offer; baseOfferNo: string; suggestedOfferNo: string; relatedOffers: { id: string; offerNo: string }[] };
export type RevisionContextResult = { context: RevisionContext; error: null } | { context: null; error: OfferSaveError };
