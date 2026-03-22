import { apiJson } from './apiClient';

/** Labels for `serviceTypes` slugs (snake_case) from the API. */
export const MERCHANT_SERVICE_TYPE_LABELS: Record<string, string> = {
  exterior_wash: 'Exterior wash',
  interior_cleaning: 'Interior cleaning',
  detailing: 'Detailing',
  ceramic: 'Ceramic coating',
  ev_safe: 'EV-safe',
  fast_lane: 'Fast lane',
  car_supported: 'Cars',
  motorbike_supported: 'Motorbikes',
};

/** Labels for `serviceFlags` keys (camelCase) from the API. */
export const MERCHANT_SERVICE_FLAG_LABELS: Record<string, string> = {
  exteriorWash: 'Exterior wash',
  interiorCleaning: 'Interior cleaning',
  detailing: 'Detailing',
  ceramic: 'Ceramic coating',
  evSafe: 'EV-safe',
  fastLane: 'Fast lane',
  carSupported: 'Cars',
  motorbikeSupported: 'Motorbikes',
};

export function labelServiceType(slug: string): string {
  return MERCHANT_SERVICE_TYPE_LABELS[slug] ?? slug.replace(/_/g, ' ');
}

/** Response from GET /api/merchants/:id (AI artifact path returns full shape; DB fallback may omit scores). */
export interface MerchantDetailPayload {
  merchantId: string;
  merchantName?: string;
  name?: string;
  merchantType?: string;
  merchantTypes?: string;
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  openNow?: boolean;
  openState?: string;
  hoursText?: string;
  phone?: string;
  website?: string;
  isValidGeo?: boolean;
  serviceTypes?: string[];
  serviceFlags?: Record<string, boolean>;
  ratingScore?: number | null;
  reviewVolumeScore?: number | null;
  trustScore?: number | null;
  openScore?: number | null;
  serviceRichnessScore?: number | null;
  baseRankScore?: number | null;
  unclaimedListing?: boolean;
  priceFrom?: number;
}

export function formatScore01(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

export async function fetchMerchantDetail(merchantId: string): Promise<MerchantDetailPayload> {
  const data = await apiJson<{ merchant: MerchantDetailPayload }>(`/api/merchants/${encodeURIComponent(merchantId)}`);
  return data.merchant;
}
