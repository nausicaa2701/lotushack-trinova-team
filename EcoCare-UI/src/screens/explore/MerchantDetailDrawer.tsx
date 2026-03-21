import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import { LoaderCircle } from 'lucide-react';
import type { Merchant } from './types';
import { fetchMerchantDetail, type MerchantDetailPayload } from '../../lib/merchantsApi';
import { fetchSlotRecommendations } from '../../lib/slotsApi';

interface Props {
  merchant: Merchant | null;
  visible: boolean;
  onHide: () => void;
  onBook: () => void;
}

export const MerchantDetailDrawer: React.FC<Props> = ({ merchant, visible, onHide, onBook }) => {
  const [detail, setDetail] = React.useState<MerchantDetailPayload | null>(null);
  const [slots, setSlots] = React.useState<Array<{ time: string; reason: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!merchant || !visible) {
      setDetail(null);
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchMerchantDetail(merchant.merchantId).catch(() => null),
      fetchSlotRecommendations(merchant.merchantId, { searchMode: 'nearby' }).catch(() => null),
    ])
      .then(([d, s]) => {
        if (cancelled) return;
        setDetail(d);
        setSlots(s?.slots ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [merchant?.merchantId, visible]);

  const displayName = detail?.merchantName ?? detail?.name ?? merchant?.name ?? 'Merchant';
  const rating = detail?.rating ?? merchant?.rating;
  const reviews = detail?.reviewCount;

  return (
    <Sidebar visible={visible} onHide={onHide} position="right" className="w-full max-w-md">
      {!merchant ? (
        <p className="text-sm text-slate-500">Select a merchant to view details.</p>
      ) : (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading details…
            </div>
          )}
          <h3 className="font-headline text-2xl font-extrabold">{displayName}</h3>
          {detail?.address ? <p className="text-sm text-slate-600">{detail.address}</p> : null}
          <p className="text-sm text-slate-500">
            Rating {rating != null ? rating.toFixed(1) : '—'}
            {reviews != null ? ` • ${reviews} reviews` : ` • ${merchant.successfulOrders} successful orders`}
          </p>
          {detail?.serviceTypes && detail.serviceTypes.length > 0 ? (
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Services: {detail.serviceTypes.join(', ')}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {merchant.reasonTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-container/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          {slots.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suggested slots</p>
              {slots.slice(0, 3).map((slot) => (
                <div key={slot.time} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{slot.time}</span>
                  <span className="text-[10px] font-bold uppercase text-tertiary">{slot.reason}</span>
                </div>
              ))}
            </div>
          ) : null}
          <button type="button" onClick={onBook} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">
            Continue Booking
          </button>
        </div>
      )}
    </Sidebar>
  );
};
