import { apiJson } from './apiClient';

export interface SlotRecommendOptions {
  searchMode?: string;
}

function formatSlotLabel(isoTime: string): string {
  const d = new Date(isoTime);
  if (Number.isNaN(d.getTime())) return isoTime;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** POST /api/slots/recommend — maps API slots to dashboard-friendly { time, reason }. */
export async function fetchSlotRecommendations(
  merchantId: string,
  options: SlotRecommendOptions = {}
): Promise<{ merchantId: string; slots: Array<{ time: string; reason: string }> }> {
  const json = await apiJson<{
    merchantId: string;
    slots: Array<{ slotId: string; slotTime: string; score: number; reason: string }>;
  }>('/api/slots/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId,
      searchMode: options.searchMode ?? 'nearby',
    }),
  });
  return {
    merchantId: json.merchantId,
    slots: json.slots.map((s) => ({
      time: formatSlotLabel(s.slotTime),
      reason: s.reason,
    })),
  };
}
