export type Offer = { id: string; values: Record<string, string> };
export type OfferLoadError = 'auth' | 'configuration' | 'schema' | 'permission' | 'unavailable';
export type OfferBatch = { offers: Offer[]; remaining: number; nextCursor: string | null; error: OfferLoadError | null };
export const OFFER_PAGE_SIZE = 20;
