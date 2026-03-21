import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, LoaderCircle, MapPinned } from 'lucide-react';
import { Sidebar } from 'primereact/sidebar';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { MapView } from './MapView';
import { MerchantDetailDrawer } from './MerchantDetailDrawer';
import { MerchantList } from './MerchantList';
import { RouteSearchForm } from './RouteSearchForm';
import { SearchModeToggle } from './SearchModeToggle';
import { fallbackSearch, logSearchEvent, nearbySearch, onRouteSearch, routePreview } from './exploreApi';
import type { ExploreFilters, LatLng, Merchant, SearchMode } from './types';

const initialFilters: ExploreFilters = {
  openNow: true,
  evSafe: true,
  minRating: 4,
  serviceTypes: ['ceramic'],
  radiusKm: 5,
  maxDetourKm: 2,
};

export const ExplorePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<SearchMode>('nearby');
  const [filters, setFilters] = React.useState<ExploreFilters>(initialFilters);
  const [origin, setOrigin] = React.useState<LatLng>({ lat: 10.776, lng: 106.7 });
  const [destination, setDestination] = React.useState<LatLng>({ lat: 10.801, lng: 106.66 });
  const [merchants, setMerchants] = React.useState<Merchant[]>([]);
  const [routeLine, setRouteLine] = React.useState<LatLng[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showDetail, setShowDetail] = React.useState(false);

  const selectedMerchant = merchants.find((item) => item.merchantId === selectedMerchantId) ?? null;

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setOrigin({ lat: coords.latitude, lng: coords.longitude }),
      () => setError('Unable to access current location')
    );
  };

  const executeSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let results: Merchant[] = [];
      let polyline = '';

      if (mode === 'nearby') {
        try {
          results = await nearbySearch(origin, filters);
        } catch {
          results = await fallbackSearch('nearby');
        }
        setRouteLine([]);
      } else {
        try {
          const preview = await routePreview(origin, destination);
          polyline = preview.polyline ?? '';
        } catch {
          polyline = '';
        }
        try {
          results = await onRouteSearch(origin, destination, filters, polyline);
        } catch {
          results = await fallbackSearch('on-route');
        }
        setRouteLine([origin, destination]);
      }

      setMerchants(results);
      setSelectedMerchantId(results[0]?.merchantId ?? null);
      await logSearchEvent({
        mode,
        origin,
        destination: mode === 'on-route' ? destination : null,
        filters,
        shownMerchants: results.map((item, index) => ({ merchantId: item.merchantId, rank: index + 1 })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const filterPanel = (
    <div className="space-y-4">
      <SearchModeToggle mode={mode} onChange={setMode} />
      <RouteSearchForm
        mode={mode}
        origin={origin}
        destination={destination}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
        onUseCurrentLocation={useCurrentLocation}
      />
      <AdvancedFilterPanel filters={filters} onChange={setFilters} />
      <button type="button" onClick={executeSearch} className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-white">
        Search Providers
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold">Explore Route Search</h2>
          <p className="mt-1 text-slate-500">Nearby and on-route merchant discovery with ranked results.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-slate-700 lg:hidden"
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 lg:block">{filterPanel}</aside>
        <section className="space-y-4">
          <MapView
            center={origin}
            merchants={merchants}
            routeLine={routeLine}
            selectedMerchantId={selectedMerchantId}
            onSelectMerchant={(merchantId) => {
              setSelectedMerchantId(merchantId);
              setShowDetail(true);
            }}
          />
          {loading ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-4 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading ranked merchants...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
          ) : merchants.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-4 text-sm text-slate-500">
              <MapPinned className="h-4 w-4" />
              No results found with current filters.
            </div>
          ) : (
            <MerchantList
              merchants={merchants}
              selectedMerchantId={selectedMerchantId}
              onSelectMerchant={(merchantId) => {
                setSelectedMerchantId(merchantId);
                setShowDetail(true);
              }}
              onBookMerchant={() => navigate('/owner/bookings')}
            />
          )}
        </section>
      </div>

      <Sidebar visible={showFilters} onHide={() => setShowFilters(false)} position="left" className="w-full max-w-sm lg:hidden">
        {filterPanel}
      </Sidebar>

      <MerchantDetailDrawer
        merchant={selectedMerchant}
        visible={showDetail}
        onHide={() => setShowDetail(false)}
        onBook={() => navigate('/owner/bookings')}
      />
    </div>
  );
};
