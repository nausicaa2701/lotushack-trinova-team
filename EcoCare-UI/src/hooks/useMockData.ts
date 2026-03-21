import { useEffect, useState } from 'react';
import { fetchPlatformMockData, type PlatformData } from '../lib/platformMock';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchPlatformDataFromBackend(): Promise<PlatformData> {
  const response = await fetch(`${API_BASE}/api/platform/bootstrap`);
  if (!response.ok) {
    throw new Error('Unable to load platform data from backend');
  }

  return (await response.json()) as PlatformData;
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
        let json: PlatformData;
        try {
          json = await fetchPlatformDataFromBackend();
        } catch {
          json = await fetchPlatformMockData();
        }
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
