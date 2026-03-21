import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/apiClient';

export interface ProviderBookingRow {
  id: string;
  providerId: string;
  owner: string;
  service: string;
  state: string;
}

export interface CampaignRequestRow {
  id: string;
  provider: string;
  type: string;
  status: string;
}

export function useProviderBookings(providerId: string | undefined) {
  const [bookings, setBookings] = useState<ProviderBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!providerId) {
      setBookings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ providerBookings: ProviderBookingRow[] }>(`/api/providers/${providerId}/bookings`, {
        userId: providerId,
      });
      setBookings(data.providerBookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load provider bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bookings, loading, error, reload: load };
}

export async function patchProviderBookingState(
  providerId: string,
  bookingId: string,
  state: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
) {
  return apiJson<Record<string, unknown>>(
    `/api/providers/${encodeURIComponent(providerId)}/bookings/${encodeURIComponent(bookingId)}`,
    {
      method: 'PATCH',
      userId: providerId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }
  );
}

export async function createCampaignRequest(
  providerId: string,
  payload: { id: string; provider: string; type: string }
) {
  return apiJson<Record<string, unknown>>(`/api/providers/${encodeURIComponent(providerId)}/campaign-requests`, {
    method: 'POST',
    userId: providerId,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function useProviderCampaigns(providerId: string | undefined) {
  const [campaigns, setCampaigns] = useState<CampaignRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!providerId) {
      setCampaigns([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ campaignRequests: CampaignRequestRow[] }>(
        `/api/providers/${providerId}/campaign-requests`,
        { userId: providerId }
      );
      setCampaigns(data.campaignRequests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { campaigns, loading, error, reload: load };
}

export function useProviderRatings(providerId: string | undefined) {
  const [metrics, setMetrics] = useState<{ avgRating: number; reviewCount: number; successfulOrders: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setMetrics(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiJson<{ avgRating: number; reviewCount: number; successfulOrders: number }>(`/api/providers/${providerId}/ratings`, {
      userId: providerId,
    })
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  return { metrics, loading };
}
