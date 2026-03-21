import { apiJson } from './apiClient';

export async function fetchForecastSummary(): Promise<Record<string, unknown>> {
  const data = await apiJson<{ summary: Record<string, unknown> }>('/api/forecast/summary');
  return data.summary ?? {};
}

export async function fetchZoneForecast(zoneId: string): Promise<{ zone: string; forecasts: unknown[] }> {
  return apiJson<{ zone: string; forecasts: unknown[] }>(
    `/api/forecast/zones/${encodeURIComponent(zoneId)}`
  );
}
