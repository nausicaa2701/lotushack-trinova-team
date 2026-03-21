import { useEffect, useState } from 'react';
import type { AuthUser } from '../auth/AuthContext';

interface PlatformData {
  users: AuthUser[];
  providers: Array<Record<string, unknown>>;
  slotRecommendations: Array<Record<string, unknown>>;
  ownerBookings: Array<Record<string, unknown>>;
  providerBookings: Array<Record<string, unknown>>;
  campaignRequests: Array<Record<string, unknown>>;
  merchantApprovals: Array<Record<string, unknown>>;
  disputes: Array<Record<string, unknown>>;
  rankingRules: Record<string, number>;
  aiRollout: Record<string, unknown>;
  forecast: Array<Record<string, unknown>>;
}

export function useMockData() {
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/mock/platform-data.json');
        if (!response.ok) {
          throw new Error('Unable to load mock data');
        }
        const json = (await response.json()) as PlatformData;
        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown data error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
