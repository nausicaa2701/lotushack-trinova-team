import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/apiClient';

export interface OwnerBookingRow {
  id: string;
  ownerId: string;
  providerId: string | null;
  provider: string;
  service: string;
  slot: string;
  state: string;
  price: number;
}

export function useOwnerBookings(ownerId: string | undefined) {
  const [bookings, setBookings] = useState<OwnerBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ownerId) {
      setBookings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ bookings: OwnerBookingRow[] }>(`/api/owners/${ownerId}/bookings`, {
        userId: ownerId,
      });
      setBookings(data.bookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bookings, loading, error, reload: load };
}
