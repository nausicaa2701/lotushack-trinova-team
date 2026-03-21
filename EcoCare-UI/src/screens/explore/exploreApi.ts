import type { ExploreFilters, LatLng, Merchant, RoutePreviewResponse, SearchMode } from './types';
import { apiFetch, parseHttpErrorMessage } from '../../lib/apiClient';
import { fetchPlatformMockData, filterMerchantsByQuery, mapProviderToMerchant } from '../../lib/platformMock';

/** Map FastAPI / AIServing search rows to UI `Merchant` (handles extra fields from AI responses). */
export function normalizeSearchMerchant(raw: Record<string, unknown>): Merchant {
  return {
    merchantId: String(raw.merchantId ?? ''),
    name: String(raw.name ?? ''),
    lat: Number(raw.lat ?? 0),
    lng: Number(raw.lng ?? 0),
    rating: Number(raw.rating ?? 0),
    successfulOrders: Number(raw.successfulOrders ?? 0),
    priceFrom: Number(raw.priceFrom ?? 0),
    distanceFromRouteKm: raw.distanceFromRouteKm != null ? Number(raw.distanceFromRouteKm) : undefined,
    detourMin: raw.detourMin != null ? Number(raw.detourMin) : undefined,
    availableNow: Boolean(raw.availableNow),
    reasonTags: Array.isArray(raw.reasonTags) ? (raw.reasonTags as unknown[]).map(String) : [],
  };
}

async function postJson<T>(path: string, payload: unknown, userId?: string | null): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    userId: userId ?? null,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseHttpErrorMessage(text));
  }

  return response.json() as Promise<T>;
}

export async function routePreview(origin: LatLng, destination: LatLng): Promise<RoutePreviewResponse> {
  return postJson<RoutePreviewResponse>('/api/routes/preview', { origin, destination });
}

export async function nearbySearch(location: LatLng, filters: ExploreFilters): Promise<Merchant[]> {
  const result = await postJson<{ results: Record<string, unknown>[] }>('/api/search/nearby', {
    location,
    radiusKm: filters.radiusKm,
    filters: {
      openNow: filters.openNow,
      evSafe: filters.evSafe,
      minRating: filters.minRating,
      serviceTypes: filters.serviceTypes,
    },
  });
  return (result.results ?? []).map((row) => normalizeSearchMerchant(row));
}

export async function onRouteSearch(origin: LatLng, destination: LatLng, filters: ExploreFilters, polyline?: string): Promise<Merchant[]> {
  const result = await postJson<{ results: Record<string, unknown>[] }>('/api/search/on-route', {
    origin,
    destination,
    polyline: polyline ?? '',
    maxDetourKm: filters.maxDetourKm,
    filters: {
      openNow: filters.openNow,
      evSafe: filters.evSafe,
      minRating: filters.minRating,
      serviceTypes: filters.serviceTypes,
    },
  });
  return (result.results ?? []).map((row) => normalizeSearchMerchant(row));
}

export async function fallbackSearch(mode: SearchMode, query = ''): Promise<Merchant[]> {
  const json = await fetchPlatformMockData();
  const list = (json.providers ?? []).map(mapProviderToMerchant);
  const scoped = mode === 'nearby' ? list.slice(0, 3) : list;
  return query ? filterMerchantsByQuery(scoped, query) : scoped;
}

export async function logSearchEvent(payload: Record<string, unknown>, options?: { userId?: string | null }) {
  try {
    const mode = payload.mode as 'nearby' | 'on-route';
    const origin = (payload.origin as { lat?: number; lng?: number } | undefined) ?? {};
    const destination = (payload.destination as { lat?: number; lng?: number } | null | undefined) ?? null;
    const shownMerchants = (payload.shownMerchants as Array<{ merchantId?: string; rank?: number }> | undefined) ?? [];
    const anon = options?.userId ? `user-${options.userId}` : 'web-anon';

    await postJson(
      '/api/search/logs',
      {
      id: `search-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id_anonymized: anon,
      mode,
      origin_lat: Number(origin.lat ?? 0),
      origin_lng: Number(origin.lng ?? 0),
      destination_lat: destination ? Number(destination.lat ?? 0) : null,
      destination_lng: destination ? Number(destination.lng ?? 0) : null,
      route_polyline: '',
      filters_json: (payload.filters as Record<string, unknown> | undefined) ?? {},
      shown_merchants_json: shownMerchants.map((item) => ({
        merchant_id: item.merchantId ?? '',
        rank: Number(item.rank ?? 0),
      })),
      clicked_merchant_id: null,
      booked_merchant_id: null,
      merchant_rank_position: null,
      detour_minutes: null,
      created_at: new Date().toISOString(),
    },
      null
    );
  } catch {
    // best-effort logging for AI training readiness
  }
}
