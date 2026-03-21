import { useCallback, useEffect, useState } from 'react';
import { apiFetchOk, apiJson } from '../lib/apiClient';

export interface MerchantApprovalRow {
  id: string;
  merchant: string;
  city: string;
  status: string;
}

export interface CampaignModerationRow {
  id: string;
  provider: string;
  type: string;
  status: string;
}

export interface DisputeRow {
  id: string;
  bookingId: string;
  type: string;
  status: string;
}

export interface AIRolloutPayload {
  rankingModel: { status: string; ndcg10: number; recall10: number };
  slotModel: { status: string; top3HitRate: number; auc: number };
  fallbackHealthy: boolean;
}

export interface RankingRulesPayload {
  routeMatchWeight: number;
  distanceDetourWeight: number;
  ratingWeight: number;
  successfulOrderWeight: number;
  slotAvailabilityWeight: number;
  priceFitWeight: number;
}

export function useAdminMerchants(adminUserId: string | undefined) {
  const [items, setItems] = useState<MerchantApprovalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminUserId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ merchantApprovals: MerchantApprovalRow[] }>('/api/admin/merchant-approvals', {
        userId: adminUserId,
      });
      setItems(data.merchantApprovals ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStatus = async (approvalId: string, status: string) => {
    if (!adminUserId) return;
    await apiFetchOk(`/api/admin/merchant-approvals/${approvalId}`, {
      method: 'PATCH',
      userId: adminUserId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return { items, loading, error, reload: load, patchStatus };
}

export function useAdminCampaignModeration(adminUserId: string | undefined) {
  const [items, setItems] = useState<CampaignModerationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminUserId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ campaignModeration: CampaignModerationRow[] }>('/api/admin/campaign-moderation', {
        userId: adminUserId,
      });
      setItems(data.campaignModeration ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchCampaignStatus = async (campaignId: string, status: string) => {
    if (!adminUserId) return;
    await apiJson(`/api/admin/campaign-moderation/${encodeURIComponent(campaignId)}`, {
      method: 'PATCH',
      userId: adminUserId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return { items, loading, error, reload: load, patchCampaignStatus };
}

export function useAdminDisputes(adminUserId: string | undefined) {
  const [items, setItems] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminUserId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ disputes: DisputeRow[] }>('/api/admin/disputes', { userId: adminUserId });
      setItems(data.disputes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchStatus = async (disputeId: string, status: string) => {
    if (!adminUserId) return;
    await apiFetchOk(`/api/admin/disputes/${disputeId}`, {
      method: 'PATCH',
      userId: adminUserId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return { items, loading, error, reload: load, patchStatus };
}

export function useAdminAiRollout(adminUserId: string | undefined) {
  const [data, setData] = useState<AIRolloutPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminUserId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await apiJson<AIRolloutPayload>('/api/admin/ai-rollout', { userId: adminUserId });
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchAiRollout = async (payload: {
    rankingModelStatus?: string;
    slotModelStatus?: string;
    fallbackHealthy?: boolean;
  }) => {
    if (!adminUserId) return;
    await apiJson('/api/admin/ai-rollout', {
      method: 'PATCH',
      userId: adminUserId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await load();
  };

  return { data, loading, error, reload: load, patchAiRollout };
}

export function useAdminRankingRules(adminUserId: string | undefined) {
  const [data, setData] = useState<RankingRulesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminUserId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await apiJson<RankingRulesPayload>('/api/admin/ranking-rules', { userId: adminUserId });
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (payload: RankingRulesPayload) => {
    if (!adminUserId) return;
    await apiJson('/api/admin/ranking-rules', {
      method: 'PUT',
      userId: adminUserId,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await load();
  };

  return { data, loading, error, reload: load, save };
}
