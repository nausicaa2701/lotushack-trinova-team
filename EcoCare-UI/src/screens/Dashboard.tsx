import React from 'react';
import { motion } from 'motion/react';
import { Button } from 'primereact/button';
import { Star, MapPin, ArrowRight, Sparkles, ShieldCheck, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useMockData } from '../hooks/useMockData';
import { fetchSlotRecommendations, type SlotRecommendationUi } from '../lib/slotsApi';
import type { ExploreFilters, LatLng, Merchant } from './explore/types';
import { nearbySearch } from './explore/exploreApi';

const DASHBOARD_NEARBY_FILTERS: ExploreFilters = {
  openNow: true,
  evSafe: true,
  minRating: 4,
  serviceTypes: [],
  /** ~5 mi search radius (matches “within 5 miles” copy) */
  radiusKm: 8,
  maxDetourKm: 2,
};

const DEFAULT_MAP_ORIGIN: LatLng = { lat: 10.776, lng: 106.7 };

const NEARBY_CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBP70em0OdztgTZeOFyt_XlWVfx90ZYfPF6-FfIF9bFPXOEgotGj1kzB3x6vanCknCDduEwr9rfDHxwZLvpO5kF6gmSF8ThmGW-1bZcTfYRrqoGr4fanuDiqQd3f-7MZxzmnTwpT8WOPC3kbBsb0DHPof1i0pwmkg4nGz1bFd6wBFR5dA677J_ECfWQzUVROUb4q4Q48z1W8vNzeDSxitOBZVVke9ajVWJwiFvfazVUAel3oXQkVulYkRUij7sGpJjbHZDkGNr6fLyc',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDB0F1BaSg_6mc3MWf6bz1pIX4Sj4h__NxIj_gD1IHoi7FtYsQZ_J_WL-vcPCswKmY2I1JB3ytKgEWGr4dhnm5zIQE_hnh53A8SxAR4AIY-GH41K19MR5YH5-Kg674Lolpl4FVJyd1N06-S2FyaxtB3-zbEFPdCO_ERDxQIFFIxA29HAuLoh5JLFAfiwWEhUfIqJVEedBD0JpWkoWaVrpSfcovvqRezViVAtbTxKo92BrOXKUA9EfsxAokZJh4fyGuMOEWV5o8NedtJ',
];

function kmToMiles(km: number): number {
  return km * 0.621371;
}

const NEARBY_RADIUS_MI_ROUNDED = Math.round(kmToMiles(DASHBOARD_NEARBY_FILTERS.radiusKm));

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading } = useMockData();
  const [apiSlotsByProvider, setApiSlotsByProvider] = React.useState<Record<string, SlotRecommendationUi[]>>({});
  const [nearbyMerchants, setNearbyMerchants] = React.useState<Merchant[]>([]);
  const [nearbyLoading, setNearbyLoading] = React.useState(true);
  const [nearbyError, setNearbyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadNearby = async (loc: LatLng) => {
      setNearbyLoading(true);
      setNearbyError(null);
      try {
        const list = await nearbySearch(loc, DASHBOARD_NEARBY_FILTERS);
        if (!cancelled) setNearbyMerchants(list);
      } catch (e) {
        if (!cancelled) {
          setNearbyMerchants([]);
          setNearbyError(e instanceof Error ? e.message : 'Could not load nearby stations');
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      void loadNearby(DEFAULT_MAP_ORIGIN);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void loadNearby({ lat: coords.latitude, lng: coords.longitude }),
      () => void loadNearby(DEFAULT_MAP_ORIGIN),
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 12_000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!data?.providers?.length) return;
    let cancelled = false;
    const top = (data.providers || []).slice(0, 2);
    void Promise.all(
      top.map(async (p: { id: string }) => {
        try {
          const r = await fetchSlotRecommendations(p.id, { searchMode: 'nearby' });
          return [p.id, r.slots] as const;
        } catch {
          return [p.id, null] as const;
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      const next: Record<string, SlotRecommendationUi[]> = {};
      for (const [id, slots] of rows) {
        if (slots?.length) next[id] = slots;
      }
      setApiSlotsByProvider(next);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <section className="relative flex min-h-[min(420px,70vh)] flex-col justify-end overflow-hidden rounded-3xl bg-slate-900 p-6 sm:min-h-[400px] sm:rounded-[2rem] sm:p-8 md:p-12">
        <img 
          alt="Modern sustainable car wash facility" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwL7BJ6HPCUV0Nk6PqNluIcJ_BiZE0VgfE4UdNdGR0RzxIo2MLSSiUdFfBiF6IGh_EkAx-HDT8YSksFD7kY4dNnmzAUS5EEzOmkQYnXRu1AaJbaYo-UyyDH6I5mUaseeXs35O05TZyh-TiuVsYhvW_BPxiJdMeY7I_cTfN9VNnoihyJwMK9rhUym3rE85hhueLSCf7DlZSYLgkFADGpKC8qd-1Ajk_57q7YO8Ty315z7o-q3qIQ3Hrb7OjQMGAFRByddIXkAQDUGcL"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest mb-4">Sustainability First</span>
          <h2 className="mb-4 font-headline text-3xl font-extrabold leading-tight text-white sm:mb-6 sm:text-4xl md:text-5xl">Find the perfect sustainable shine.</h2>
          <p className="mb-6 max-w-lg font-sans text-base text-slate-300 sm:mb-8 sm:text-lg">Advanced water filtration and eco-friendly formulas for a showroom finish that respects the planet.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              type="button"
              label="Book Now"
              onClick={() => navigate('/owner/bookings')}
              className="rounded-full px-6 py-3 font-bold text-white shadow-xl shadow-primary/30 transition-transform power-gradient hover:scale-105 sm:px-8 sm:py-4 border-none"
            />
            <Button
              type="button"
              label="View Near Me"
              onClick={() => navigate('/owner/explore')}
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:px-8 sm:py-4"
              text
            />
          </div>
        </div>
      </section>

      {/* Nearby Stations — POST /api/search/nearby */}
      <section>
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Nearby Stations</h3>
            <p className="mt-1 font-medium text-slate-500">
              {nearbyLoading
                ? 'Loading stations from nearby search…'
                : `Found ${nearbyMerchants.length} premium locations within ~${NEARBY_RADIUS_MI_ROUNDED} mi (live API + your location).`}
            </p>
          </div>
          <Button
            type="button"
            text
            onClick={() => navigate('/owner/explore')}
            className="group flex shrink-0 items-center gap-1 self-start font-bold text-primary sm:self-auto border-none shadow-none"
          >
            See All
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {nearbyError ? (
          <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{nearbyError}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nearbyLoading ? (
            <>
              <div className="animate-pulse rounded-[2rem] bg-surface-container-low p-4">
                <div className="mb-6 aspect-[16/10] rounded-[1.5rem] bg-surface-container-highest" />
                <div className="mx-2 h-6 w-2/3 rounded-lg bg-surface-container-highest" />
                <div className="mx-2 mt-3 h-4 w-full rounded-lg bg-surface-container-highest" />
              </div>
              <div className="animate-pulse rounded-[2rem] bg-surface-container-low p-4">
                <div className="mb-6 aspect-[16/10] rounded-[1.5rem] bg-surface-container-highest" />
                <div className="mx-2 h-6 w-2/3 rounded-lg bg-surface-container-highest" />
                <div className="mx-2 mt-3 h-4 w-full rounded-lg bg-surface-container-highest" />
              </div>
            </>
          ) : (
            <>
              {nearbyMerchants.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-outline-variant/30 bg-surface-container-low p-8 text-sm text-slate-500 md:col-span-2">
                  No stations matched the current filters in range. Open Explore to adjust radius or filters.
                </div>
              ) : (
                nearbyMerchants.slice(0, 2).map((merchant, idx) => {
                  const distKm = merchant.distanceFromRouteKm ?? merchant.distanceKm ?? 0;
                  const mi = kmToMiles(distKm);
                  const tag =
                    merchant.reasonTags?.[0] ??
                    (merchant.availableNow ? 'Available now' : 'Premium wash');
                  const tagClass =
                    idx === 0
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : 'bg-secondary-container text-on-secondary-container';
                  return (
                    <div
                      key={merchant.merchantId}
                      className="group bg-surface-container-low rounded-[2rem] p-4 transition-all hover:bg-surface-container-lowest hover:shadow-2xl hover:shadow-on-surface/5"
                    >
                      <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[1.5rem]">
                        <img
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          src={NEARBY_CARD_IMAGES[idx % NEARBY_CARD_IMAGES.length]}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur">
                          <Star size={16} className="fill-amber-500 text-amber-500" />
                          <span className="text-sm font-bold text-slate-900">{merchant.rating.toFixed(1)}</span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <span
                            className={`rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-tighter ${tagClass}`}
                          >
                            {tag}
                          </span>
                        </div>
                      </div>
                      <div className="px-2">
                        <h4 className="mb-1 font-headline text-xl font-bold text-on-surface">{merchant.name}</h4>
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                          <MapPin size={14} />
                          <span>
                            {mi.toFixed(1)} mi away · From ${merchant.priceFrom.toFixed(0)} ·{' '}
                            {merchant.availableNow ? 'Open now' : 'Check hours'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
                          <span className="text-xs font-medium text-slate-400">
                            {merchant.successfulOrders.toLocaleString()} completed washes
                          </span>
                          <Button
                            type="button"
                            text
                            label="View Details"
                            onClick={() =>
                              navigate(
                                `/owner/explore?merchant=${encodeURIComponent(merchant.merchantId)}&search=${encodeURIComponent(merchant.name)}`
                              )
                            }
                            className="p-0 text-sm font-bold text-primary border-none shadow-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-primary-container p-8">
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl transition-all group-hover:scale-150"></div>
            <div>
              <span className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                Map View
              </span>
              <h4 className="mb-4 font-headline text-3xl font-extrabold leading-tight text-primary">
                Browse all stations on the map.
              </h4>
              <p className="max-w-[180px] text-sm font-medium text-on-secondary-container/80">
                Interactive explore with nearby and on-route search.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => navigate('/owner/explore')}
              className="w-fit border-none font-bold text-white transition-transform hover:scale-105 flex items-center gap-3 rounded-full bg-primary px-6 py-3"
            >
              Open Map
              <MapPin size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="pb-20">
        <div className="mb-6 sm:mb-8">
          <h3 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Featured Services</h3>
          <p className="mt-1 font-medium text-slate-500">Specialized treatments for the meticulous driver</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard 
            icon={Sparkles} 
            title="Premium Polish & Seal" 
            desc="Hydrophobic polymer coating with a 3-stage orbital polish for a mirror finish that lasts 6 months."
            price={89}
            color="primary"
            onAdd={() => navigate('/owner/bookings')}
          />
          <ServiceCard 
            icon={ShieldCheck} 
            title="Interior Detail" 
            desc="Steam sanitation of all surfaces, leather conditioning, and deep extraction of upholstery fibers."
            price={120}
            color="tertiary"
            onAdd={() => navigate('/owner/bookings')}
          />
          <ServiceCard 
            icon={Droplets} 
            title="Basic Wash" 
            desc="100% recycled water touchless wash with gentle air dry and wheel brightener included."
            price={25}
            color="secondary"
            onAdd={() => navigate('/owner/bookings')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Ranking & Slot Reasons</h3>
        </div>
        {loading || !data || !data.providers ? (
          <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading recommendation reasons...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.providers.slice(0, 2).map((provider: any) => {
              const slotEntry = data.slotRecommendations?.find((entry: any) => entry.providerId === provider.id) as any;
              const slotsForUi = apiSlotsByProvider[provider.id] ?? slotEntry?.slots ?? [];
              return (
                <div key={provider.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
                  <p className="font-headline text-xl font-bold">{provider.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.reasonCodes.map((reason: string) => (
                      <span key={reason} className="rounded-full bg-primary-container/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {slotsForUi.slice(0, 3).map((slot: SlotRecommendationUi) => (
                      <div key={slot.slotId} className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                        <span className="font-bold text-slate-700">{slot.timeLabel}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-tertiary">{slot.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
};

const ServiceCard = ({ icon: Icon, title, desc, price, color, onAdd }: any) => {
  const colorClasses: any = {
    primary: "bg-primary-container/30 text-primary",
    tertiary: "bg-tertiary-container/20 text-tertiary",
    secondary: "bg-secondary-container/30 text-on-secondary-container"
  };

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", colorClasses[color])}>
        <Icon size={32} />
      </div>
      <h5 className="text-xl font-bold font-headline text-on-surface mb-2">{title}</h5>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-extrabold text-on-surface">${price}</span>
        <Button
          type="button"
          label="Add"
          onClick={onAdd}
          className="bg-surface-container-highest hover:bg-primary hover:text-white text-on-surface px-6 py-2 rounded-full font-bold transition-all text-sm border-none"
        />
      </div>
    </div>
  );
};
