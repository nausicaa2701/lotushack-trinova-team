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
    await postJson('/api/search/logs', payload);
  } catch {
    // best-effort logging for AI training readiness
  }
}
