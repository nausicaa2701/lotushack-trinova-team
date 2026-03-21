import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/apiClient';
import { fetchPlatformMockData, type PlatformData } from '../lib/platformMock';

async function fetchPlatformDataRemote(): Promise<PlatformData> {
  const response = await fetch(`${getApiBase()}/api/platform/bootstrap`);
  if (!response.ok) {
    throw new Error('Unable to load platform data');
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
          json = await fetchPlatformDataRemote();
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
