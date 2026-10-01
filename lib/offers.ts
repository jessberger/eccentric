export type Offer = { id: string; values: Record<string, string> };
export type OfferSearch = { query: string; filters: Record<string, string>; page: number };
export type OfferLoadError = 'auth' | 'configuration' | 'schema' | 'permission' | 'unavailable' | 'invalid';
export type OfferResult = { offers: Offer[]; count: number; error: OfferLoadError | null };
export const OFFER_PAGE_SIZE = 20;
