import React from 'react';
import {
  CarFront,
  LoaderCircle,
  MapPin,
  SearchCheck,
  SearchX,
  Sparkles,
  Store,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMockData } from '../hooks/useMockData';
import { searchPlatformData } from '../lib/platformMock';
import { cn } from '@/src/lib/utils';

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { user, activeRole } = useAuth();
  const { data, loading, error } = useMockData();
  const query = searchParams.get('search')?.trim() ?? '';
  const highlightedProviderId = searchParams.get('provider');
  const highlightedVehicleId = searchParams.get('vehicle');
  const ownerScopedSearchId = activeRole === 'owner' ? user?.id : undefined;

  const providersById = React.useMemo(
    () => new Map((data?.providers ?? []).map((provider) => [provider.id, provider])),
    [data?.providers]
  );

  const vehiclesById = React.useMemo(
    () => new Map((data?.vehicles ?? []).map((vehicle) => [vehicle.id, vehicle])),
    [data?.vehicles]
  );

  const usersById = React.useMemo(
    () => new Map((data?.users ?? []).map((mockUser) => [mockUser.id, mockUser])),
    [data?.users]
  );

  const results = React.useMemo(
    () =>
      data
        ? searchPlatformData(data, query, {
            ownerId: ownerScopedSearchId,
            includeVehicles: true,
          })
        : [],
    [data, ownerScopedSearchId, query]
  );

  const serviceCenterCount = results.filter((result) => result.type === 'service-center').length;
  const vehicleCount = results.filter((result) => result.type === 'vehicle').length;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-6 py-6 text-white shadow-xl sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
          <Sparkles size={14} />
          Mock Search
        </div>
        <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight">Search Results</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
          Search is currently powered by local mock data, so service-center names and vehicle plate numbers work before backend integration is ready.
        </p>
        <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-[1.4rem] bg-white/10 px-4 py-3 backdrop-blur">
          <SearchCheck size={18} className="shrink-0 text-emerald-300" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Current Query</p>
            <p className="truncate text-base font-bold text-white">{query || 'Type a service center name or plate number in the top bar.'}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl bg-surface-container-low px-5 py-4 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading mock search index...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          Unable to load mock search data right now.
        </div>
      ) : !query ? (
        <div className="rounded-3xl bg-surface-container-low px-5 py-6 text-sm text-slate-600">
          Start with a service-center name like <span className="font-semibold text-slate-900">VoltFlow Station</span> or a plate number like <span className="font-semibold text-slate-900">51K-248.81</span>.
        </div>
      ) : results.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl bg-surface-container-low px-5 py-5 text-sm text-slate-600">
          <SearchX className="h-5 w-5" />
          No service centers or vehicle plates matched "{query}" in the current mock data.
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest px-5 py-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Service Centers</p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-slate-900">{serviceCenterCount}</p>
            </div>
            <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest px-5 py-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Vehicles</p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-slate-900">{vehicleCount}</p>
            </div>
          </section>

          <section className="space-y-3">
            {results.map((result) => {
              if (result.type === 'service-center') {
                const provider = providersById.get(result.providerId);
                const isHighlighted = highlightedProviderId === result.providerId;

                return (
                  <article
                    key={result.id}
                    className={cn(
                      'rounded-[1.8rem] border px-5 py-5 shadow-sm transition-colors',
                      isHighlighted
                        ? 'border-primary/40 bg-primary-container/20 shadow-lg shadow-primary/10'
                        : 'border-outline-variant/20 bg-surface-container-lowest'
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                        <Store size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-headline text-xl font-extrabold text-slate-900">{result.title}</h3>
                          {isHighlighted && (
                            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500">{result.subtitle}</p>
                        {provider?.address && (
                          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={15} />
                            <span>{provider.address}</span>
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(provider?.serviceTypes ?? []).map((serviceType) => (
                            <span
                              key={serviceType}
                              className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                            >
                              {serviceType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }

              const vehicle = vehiclesById.get(result.vehicleId);
              const owner = vehicle ? usersById.get(vehicle.ownerId) : null;
              const isHighlighted = highlightedVehicleId === result.vehicleId;

              return (
                <article
                  key={result.id}
                  className={cn(
                    'rounded-[1.8rem] border px-5 py-5 shadow-sm transition-colors',
                    isHighlighted
                      ? 'border-primary/40 bg-primary-container/20 shadow-lg shadow-primary/10'
                      : 'border-outline-variant/20 bg-surface-container-lowest'
                  )}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                      <CarFront size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-headline text-xl font-extrabold text-slate-900">{result.title}</h3>
                        {isHighlighted && (
                          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500">{result.subtitle}</p>
                      {vehicle && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Plate Number</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{vehicle.plateNumber}</p>
                          </div>
                          <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Owner</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{owner?.name ?? 'Mock account'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
};
