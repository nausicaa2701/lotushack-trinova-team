import { apiJson } from './apiClient';

/** Response from GET /api/merchants/:id (shape varies slightly between AI artifact vs DB). */
export interface MerchantDetailPayload {
  merchantId: string;
  merchantName?: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  openNow?: boolean;
  openState?: string;
  serviceTypes?: string[];
  serviceFlags?: Record<string, boolean>;
  baseRankScore?: number | null;
}

export async function fetchMerchantDetail(merchantId: string): Promise<MerchantDetailPayload> {
  const data = await apiJson<{ merchant: MerchantDetailPayload }>(`/api/merchants/${encodeURIComponent(merchantId)}`);
  return data.merchant;
}
