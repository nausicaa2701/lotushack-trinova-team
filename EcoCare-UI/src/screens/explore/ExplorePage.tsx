import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, LoaderCircle, MapPinned } from 'lucide-react';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { MapView } from './MapView';
import { MerchantDetailDrawer } from './MerchantDetailDrawer';
import { MerchantList } from './MerchantList';
import { RouteSearchForm } from './RouteSearchForm';
import { SearchModeToggle } from './SearchModeToggle';
import { fallbackSearch, logSearchEvent, nearbySearch, onRouteSearch, routePreview } from './exploreApi';
import { BookingConfirmDialog } from './BookingConfirmDialog';
import { useAuth } from '../../auth/AuthContext';
import { useMockData } from '../../hooks/useMockData';
import { ApiError } from '../../lib/apiClient';
import { createOwnerBooking } from '../../lib/ownerBookingsApi';
import { fetchSlotRecommendations, type SlotRecommendationUi } from '../../lib/slotsApi';
import { filterMerchantsByQuery } from '../../lib/platformMock';
import type { ExploreFilters, LatLng, Merchant, SearchMode } from './types';

/** https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code */
function geolocationFailureMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location access was blocked. Allow location for this site in your browser (lock icon in the address bar), or enter latitude/longitude manually.';
    case 2:
      return 'Your position could not be determined. Try again outdoors or with Wi‑Fi enabled, or enter coordinates manually.';
    case 3:
      return 'Location request timed out. Try again or enter coordinates manually.';
    default:
      return 'Could not read your location. Use HTTPS or localhost, check browser permissions, or enter coordinates manually.';
  }
}

/** Empty serviceTypes = any service (matches API: no extra filter). */
const initialFilters: ExploreFilters = {
  openNow: true,
  evSafe: true,
  minRating: 4,
  serviceTypes: [],
  radiusKm: 5,
  maxDetourKm: 2,
};

export const ExplorePage = () => {
  const { user } = useAuth();
  const { data: platformData } = useMockData();
  const vehicles = platformData?.vehicles ?? [];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [bookingFlow, setBookingFlow] = React.useState<{ merchant: Merchant; slots: SlotRecommendationUi[] } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);
  const topBarSearchQuery = searchParams.get('search')?.trim() ?? '';
  const highlightedMerchantId = searchParams.get('merchant');

  const selectedMerchant = merchants.find((item) => item.merchantId === selectedMerchantId) ?? null;

  /** Close merchant detail sidebar whenever the booking confirm dialog opens */
  React.useEffect(() => {
    if (bookingDialogOpen) {
      setShowDetail(false);
    }
  }, [bookingDialogOpen]);

  const openBookingForMerchant = React.useCallback(
    async (merchant: Merchant) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setError(null);
      setBookingSubmitting(true);
      try {
        const { slots } = await fetchSlotRecommendations(merchant.merchantId, { searchMode: mode });
        setBookingFlow({ merchant, slots });
        setBookingDialogOpen(true);
      } catch {
        setBookingFlow({ merchant, slots: [] });
        setBookingDialogOpen(true);
      } finally {
        setBookingSubmitting(false);
      }
    },
    [user, navigate, mode]
  );

  const handleContinueFromDrawer = React.useCallback(
    (ctx: { merchant: Merchant; slots: SlotRecommendationUi[] }) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setError(null);
      setBookingFlow(ctx);
      setBookingDialogOpen(true);
    },
    [user, navigate]
  );

  const submitBooking = React.useCallback(
    async (result: { slotLabel: string; slotTimeIso: string | null; vehicleId: string | null }) => {
      if (!user || !bookingFlow) return;
      setBookingSubmitting(true);
      setError(null);
      try {
        await createOwnerBooking(user.id, {
          id: `bk-${Date.now()}`,
          merchant_id: bookingFlow.merchant.merchantId,
          providerId: bookingFlow.merchant.merchantId,
          provider: bookingFlow.merchant.name,
          service: 'Eco wash',
          slot: result.slotLabel,
          slot_time: result.slotTimeIso ?? undefined,
          vehicle_id: result.vehicleId,
          price: bookingFlow.merchant.priceFrom,
        });
        setBookingDialogOpen(false);
        setShowDetail(false);
        setBookingFlow(null);
        navigate('/owner/bookings');
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not create booking';
        setError(msg);
        throw e instanceof Error ? e : new Error(msg);
      } finally {
        setBookingSubmitting(false);
      }
    },
    [user, bookingFlow, navigate]
  );

  const useCurrentLocation = React.useCallback(() => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(
        'This browser does not support geolocation, or the page is not served over HTTPS (or localhost). Enter latitude and longitude manually.'
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        setError(null);
      },
      (err) => {
        setError(geolocationFailureMessage(err.code));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 }
    );
  }, []);

  const executeSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let results: Merchant[] = [];
      let polyline = '';

      if (topBarSearchQuery) {
        results = await fallbackSearch(mode, topBarSearchQuery);
        setRouteLine(mode === 'on-route' ? [origin, destination] : []);
      } else {
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
      }

      const filteredResults = topBarSearchQuery ? filterMerchantsByQuery(results, topBarSearchQuery) : results;
      setMerchants(filteredResults);
      setSelectedMerchantId(
        highlightedMerchantId && filteredResults.some((item) => item.merchantId === highlightedMerchantId)
          ? highlightedMerchantId
          : filteredResults[0]?.merchantId ?? null
      );
      await logSearchEvent(
        {
          mode,
          origin,
          destination: mode === 'on-route' ? destination : null,
          filters,
          shownMerchants: filteredResults.map((item, index) => ({ merchantId: item.merchantId, rank: index + 1 })),
        },
        { userId: user?.id }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topBarSearchQuery, highlightedMerchantId]);

  const filterPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-headline text-lg font-bold text-slate-900">Search filters</h2>
        <p className="mt-1 text-xs text-slate-500">Mode, route, and advanced options.</p>
      </div>
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
      <Button
        type="button"
        label="Search Providers"
        onClick={executeSearch}
        className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-white border-none"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold">Explore Route Search</h2>
          <p className="mt-1 text-slate-500">
            {topBarSearchQuery
              ? `Showing results for “${topBarSearchQuery}”.`
              : 'Nearby and on-route merchant discovery with ranked results.'}
          </p>
        </div>
        <Button
          type="button"
          text
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-slate-700 lg:hidden border-none shadow-none"
        >
          <Filter size={16} />
          <span>Filters</span>
        </Button>
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
              onBookMerchant={(m) => void openBookingForMerchant(m)}
            />
          )}
        </section>
      </div>

      <Sidebar
        visible={showFilters}
        onHide={() => setShowFilters(false)}
        position="left"
        className="explore-filters-sidebar w-full max-w-sm lg:hidden"
      >
        {filterPanel}
      </Sidebar>

      <MerchantDetailDrawer
        merchant={selectedMerchant}
        visible={showDetail}
        searchMode={mode}
        onHide={() => setShowDetail(false)}
        onContinueBooking={handleContinueFromDrawer}
      />

      <BookingConfirmDialog
        visible={bookingDialogOpen}
        onHide={() => {
          if (!bookingSubmitting) {
            setBookingDialogOpen(false);
            setBookingFlow(null);
          }
        }}
        merchant={bookingFlow?.merchant ?? null}
        user={user}
        vehicles={vehicles}
        slots={bookingFlow?.slots ?? []}
        submitting={bookingSubmitting}
        onConfirm={submitBooking}
      />
    </div>
  );
};
