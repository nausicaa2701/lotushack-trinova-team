import { apiJson } from './apiClient';

export interface SlotRecommendOptions {
  searchMode?: string;
}

export interface SlotRecommendationUi {
  slotId: string;
  slotTime: string;
  timeLabel: string;
  reason: string;
}

/** Wall-clock label in Vietnam — matches API ISO times (often UTC) without depending on viewer's laptop timezone. */
function formatSlotLabel(isoTime: string): string {
  const d = new Date(isoTime);
  if (Number.isNaN(d.getTime())) return isoTime;
  return d.toLocaleString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** POST /api/slots/recommend — maps API slots to UI rows with stable ids and ISO times for booking. */
export async function fetchSlotRecommendations(
  merchantId: string,
  options: SlotRecommendOptions = {}
): Promise<{ merchantId: string; slots: SlotRecommendationUi[] }> {
  const json = await apiJson<{
    merchantId: string;
    slots: Array<{ slotId: string; slotTime?: string; startTime?: string; score: number; reason: string }>;
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
    slots: json.slots.map((s) => {
      const iso = s.slotTime ?? s.startTime ?? '';
      return {
        slotId: s.slotId,
        slotTime: iso,
        timeLabel: formatSlotLabel(iso),
        reason: s.reason,
      };
    }),
  };
}
