import React from 'react';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import {
  LoaderCircle,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Navigation,
  Shield,
  Sparkles,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import type { Merchant, SearchMode } from './types';
import {
  fetchMerchantDetail,
  type MerchantDetailPayload,
  MERCHANT_SERVICE_FLAG_LABELS,
  formatScore01,
  labelServiceType,
} from '../../lib/merchantsApi';
import { fetchSlotRecommendations, type SlotRecommendationUi } from '../../lib/slotsApi';

interface Props {
  merchant: Merchant | null;
  visible: boolean;
  onHide: () => void;
  searchMode?: SearchMode;
  /** Opens booking confirmation with suggested slots from this drawer. */
  onContinueBooking: (ctx: { merchant: Merchant; slots: SlotRecommendationUi[] }) => void;
}

function normalizeWebsite(url: string): string {
  const u = url.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export const MerchantDetailDrawer: React.FC<Props> = ({ merchant, visible, onHide, searchMode = 'nearby', onContinueBooking }) => {
  const [detail, setDetail] = React.useState<MerchantDetailPayload | null>(null);
  const [slots, setSlots] = React.useState<SlotRecommendationUi[]>([]);
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
      fetchSlotRecommendations(merchant.merchantId, { searchMode }).catch(() => null),
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
  }, [merchant?.merchantId, visible, searchMode]);

  const displayName = detail?.merchantName ?? detail?.name ?? merchant?.name ?? 'Merchant';
  const rating = detail?.rating ?? merchant?.rating;
  const reviews = detail?.reviewCount;

  const mapsHref =
    detail?.latitude != null && detail?.longitude != null
      ? `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`
      : null;

  const flagEntries = detail?.serviceFlags
    ? (Object.entries(detail.serviceFlags) as [string, boolean][])
    : [];

  const scoreRows: { label: string; value: number | null | undefined }[] = [
    { label: 'Rating fit', value: detail?.ratingScore ?? undefined },
    { label: 'Review volume', value: detail?.reviewVolumeScore ?? undefined },
    { label: 'Trust', value: detail?.trustScore ?? undefined },
    { label: 'Open match', value: detail?.openScore ?? undefined },
    { label: 'Service breadth', value: detail?.serviceRichnessScore ?? undefined },
    { label: 'Base rank', value: detail?.baseRankScore ?? undefined },
  ];

  const hasAnyScore = scoreRows.some((r) => r.value != null && !Number.isNaN(r.value));

  return (
    <Sidebar visible={visible} onHide={onHide} position="right" className="merchant-detail-sidebar w-full max-w-lg !bg-surface">
      {!merchant ? (
        <p className="text-sm text-slate-500">Select a merchant to view details.</p>
      ) : (
        <div className="flex max-h-[min(100dvh,100vh)] min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {loading && (
            <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading details…
            </div>
          )}

          <header className="space-y-2 border-b border-slate-200/80 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-headline text-2xl font-extrabold leading-tight text-slate-900">{displayName}</h3>
              {detail?.openNow != null ? (
                <span
                  className={
                    detail.openNow
                      ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800'
                      : 'inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600'
                  }
                >
                  {detail.openNow ? 'Open' : 'Closed'}
                </span>
              ) : null}
            </div>
            {detail?.merchantType ? (
              <p className="text-sm font-medium text-primary">{detail.merchantType}</p>
            ) : null}
            {detail?.merchantTypes ? (
              <p className="text-xs leading-relaxed text-slate-600">{detail.merchantTypes}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-semibold">{rating != null ? rating.toFixed(1) : '—'}</span>
              <span className="text-slate-500">
                {reviews != null ? `${reviews.toLocaleString()} reviews` : `${merchant.successfulOrders} successful orders`}
              </span>
            </div>
            {detail?.unclaimedListing ? (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Unclaimed listing — verify hours and services before visiting.</span>
              </div>
            ) : null}
          </header>

          {(detail?.openState || detail?.hoursText) && (
            <section className="rounded-2xl bg-surface-container-low p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Hours
              </p>
              {detail.openState ? <p className="text-sm font-medium text-slate-800">{detail.openState}</p> : null}
              {detail.hoursText && detail.hoursText !== detail.openState ? (
                <p className="mt-1 text-xs text-slate-600">{detail.hoursText}</p>
              ) : null}
            </section>
          )}

          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</p>
            {detail?.address ? (
              <p className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span>
                  {detail.address}
                  {detail.district ? (
                    <span className="mt-1 block text-xs text-slate-500">District: {detail.district}</span>
                  ) : null}
                </span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {mapsHref ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Navigation className="h-3.5 w-3.5" aria-hidden />
                  Open in Maps
                </a>
              ) : null}
              {detail?.isValidGeo === false ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Location not verified on map
                </span>
              ) : null}
            </div>
          </section>

          {(detail?.phone || detail?.website) && (
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Contact</p>
              <div className="space-y-2">
                {detail.phone ? (
                  <a
                    href={`tel:${detail.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    {detail.phone}
                  </a>
                ) : null}
                {detail.website ? (
                  <a
                    href={normalizeWebsite(detail.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 break-all text-sm font-medium text-sky-700 hover:underline"
                  >
                    <Globe className="h-4 w-4 shrink-0" aria-hidden />
                    {detail.website.replace(/^https?:\/\//i, '')}
                  </a>
                ) : null}
              </div>
            </section>
          )}

          {detail?.priceFrom != null && detail.priceFrom > 0 ? (
            <p className="text-sm font-semibold text-slate-800">
              From <span className="text-primary">${detail.priceFrom.toFixed(0)}</span>
            </p>
          ) : null}

          {(detail?.serviceTypes?.length || flagEntries.length > 0) && (
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Services &amp; capabilities</p>
              {detail?.serviceTypes && detail.serviceTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detail.serviceTypes.map((slug) => (
                    <span
                      key={slug}
                      className="rounded-full bg-primary-container/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary"
                    >
                      {labelServiceType(slug)}
                    </span>
                  ))}
                </div>
              ) : null}
              {flagEntries.length > 0 ? (
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {flagEntries.map(([key, on]) => (
                    <li
                      key={key}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                        on ? 'bg-emerald-500/10 text-emerald-900' : 'bg-slate-100/80 text-slate-400'
                      }`}
                    >
                      {on ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      )}
                      <span>{MERCHANT_SERVICE_FLAG_LABELS[key] ?? key}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}

          {hasAnyScore && (
            <section className="rounded-2xl bg-gradient-to-br from-slate-50 to-surface-container-low p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Ranking signals
              </p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {scoreRows.map(({ label, value }) => (
                  <React.Fragment key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-mono font-semibold text-slate-800">{formatScore01(value)}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="mt-3 text-[10px] leading-snug text-slate-400">
                Model-derived scores (0–100%) used for search ranking; higher usually means a better match to quality,
                availability, and services.
              </p>
            </section>
          )}

          {merchant.reasonTags.length > 0 ? (
            <section>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Why it matched
              </p>
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
            </section>
          ) : null}

          {slots.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suggested slots</p>
              {slots.slice(0, 3).map((slot) => (
                <div key={slot.slotId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{slot.timeLabel}</span>
                  <span className="text-[10px] font-bold uppercase text-tertiary">{slot.reason}</span>
                </div>
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            label="Continue booking"
            onClick={() => merchant && onContinueBooking({ merchant, slots })}
            className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 border-none"
          />
        </div>
      )}
    </Sidebar>
  );
};
