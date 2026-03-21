import type { ExploreFilters, LatLng, Merchant, RoutePreviewResponse, SearchMode } from './types';
import { fetchPlatformMockData, filterMerchantsByQuery, mapProviderToMerchant } from '../../lib/platformMock';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed`);
  }

  return response.json() as Promise<T>;
}

export async function routePreview(origin: LatLng, destination: LatLng): Promise<RoutePreviewResponse> {
  return postJson<RoutePreviewResponse>('/api/routes/preview', { origin, destination });
}

export async function nearbySearch(location: LatLng, filters: ExploreFilters): Promise<Merchant[]> {
  const result = await postJson<{ results: Merchant[] }>('/api/search/nearby', {
    location,
    radiusKm: filters.radiusKm,
    filters: {
      openNow: filters.openNow,
      evSafe: filters.evSafe,
      minRating: filters.minRating,
      serviceTypes: filters.serviceTypes,
    },
  });
  return result.results;
}

export async function onRouteSearch(origin: LatLng, destination: LatLng, filters: ExploreFilters, polyline?: string): Promise<Merchant[]> {
  const result = await postJson<{ results: Merchant[] }>('/api/search/on-route', {
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
  return result.results;
}

export async function fallbackSearch(mode: SearchMode, query = ''): Promise<Merchant[]> {
  const json = await fetchPlatformMockData();
  const list = (json.providers ?? []).map(mapProviderToMerchant);
  const scoped = mode === 'nearby' ? list.slice(0, 3) : list;
  return query ? filterMerchantsByQuery(scoped, query) : scoped;
}

export async function logSearchEvent(payload: Record<string, unknown>) {
  try {
    const mode = payload.mode as 'nearby' | 'on-route';
    const origin = (payload.origin as { lat?: number; lng?: number } | undefined) ?? {};
    const destination = (payload.destination as { lat?: number; lng?: number } | null | undefined) ?? null;
    const shownMerchants = (payload.shownMerchants as Array<{ merchantId?: string; rank?: number }> | undefined) ?? [];

    await postJson('/api/search/logs', {
      id: `search-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id_anonymized: 'web-anon',
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
    });
  } catch {
    // best-effort logging for AI training readiness
  }
}
