import React from 'react';
import {
  ArrowUpRight,
  Bell,
  CarFront,
  HelpCircle,
  LoaderCircle,
  MapPin,
  Menu,
  Mic,
  Search,
  SearchX,
  Store,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMockData } from '../hooks/useMockData';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { searchPlatformData, type SearchHit } from '../lib/platformMock';
import { cn } from '@/src/lib/utils';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, availableRoles, switchRole } = useAuth();
  const { data, loading: searchDataLoading, error: searchDataError } = useMockData();
  const [locationLabel, setLocationLabel] = React.useState('Enable location');
  const [locationBlocked, setLocationBlocked] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchNotice, setSearchNotice] = React.useState<string | null>(null);
  const [pendingOwnerSearchPath, setPendingOwnerSearchPath] = React.useState<string | null>(null);
  const watchIdRef = React.useRef<number | null>(null);
  const retryTimerRef = React.useRef<number | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchShellRef = React.useRef<HTMLDivElement | null>(null);

  const canOpenOwnerSearchRoutes = availableRoles.includes('owner');
  const searchOwnerId = activeRole === 'owner' ? user?.id : undefined;

  const cleanupWatch = React.useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const requestLocation = React.useCallback((retry = 0) => {
    if (!navigator.geolocation) {
      setLocationLabel('Location unsupported');
      return;
    }

    setLocationLabel(retry > 0 ? `Retrying (${retry})...` : 'Requesting...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationLabel(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        setLocationBlocked(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationLabel('Location blocked');
          setLocationBlocked(true);
          cleanupWatch();
          return;
        }
        if ((error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) && retry < 2) {
          retryTimerRef.current = window.setTimeout(() => requestLocation(retry + 1), 1500);
          return;
        }
        setLocationLabel(error.code === error.POSITION_UNAVAILABLE ? 'Location unavailable' : 'Location timeout');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [cleanupWatch]);

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!('permissions' in navigator)) return;
        const status = await navigator.permissions.query({ name: 'geolocation' });
        setLocationBlocked(status.state === 'denied');
        if (status.state === 'denied') {
          setLocationLabel('Location blocked');
        } else if (status.state === 'granted') {
          requestLocation();
          watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => setLocationLabel(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`),
            () => {},
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
          );
        }
        status.onchange = () => {
          const denied = status.state === 'denied';
          setLocationBlocked(denied);
          if (denied) {
            setLocationLabel('Location blocked');
            cleanupWatch();
          } else if (status.state === 'granted') {
            requestLocation();
            if (watchIdRef.current === null) {
              watchIdRef.current = navigator.geolocation.watchPosition(
                ({ coords }) => setLocationLabel(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`),
                () => {},
                { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
              );
            }
          } else if (status.state === 'prompt') {
            setLocationLabel('Enable location');
          }
        };
      } catch {
        // permissions api may be unavailable in some browsers
      }
    };

    checkPermission();
    return cleanupWatch;
  }, [cleanupWatch, requestLocation]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryFromRoute = params.get('search');

    if (queryFromRoute) {
      setSearchQuery(queryFromRoute);
    }

    setSearchOpen(false);
    setSearchNotice(null);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchShellRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  React.useEffect(() => {
    if (!pendingOwnerSearchPath || activeRole !== 'owner') return;

    navigate(pendingOwnerSearchPath);
    setPendingOwnerSearchPath(null);
  }, [activeRole, navigate, pendingOwnerSearchPath]);

  const searchPlaceholder =
    activeRole === 'admin'
      ? 'Search merchants, disputes, campaigns...'
      : activeRole === 'provider'
        ? 'Search bookings, services, campaigns...'
        : 'Search service centers or vehicle plates...';

  const searchResults = React.useMemo(
    () =>
      data
        ? searchPlatformData(data, searchQuery, {
            ownerId: searchOwnerId,
            includeVehicles: true,
          })
        : [],
    [data, searchOwnerId, searchQuery]
  );

  const focusSearchInput = React.useCallback(() => {
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, []);

  const navigateToOwnerSearchTarget = React.useCallback(
    (path: string) => {
      if (!canOpenOwnerSearchRoutes) {
        setSearchNotice('Matches were found, but opening search results currently requires an owner account.');
        setSearchOpen(true);
        return;
      }

      if (activeRole !== 'owner') {
        setPendingOwnerSearchPath(path);
        setSearchNotice('Opening your owner search results...');
        setSearchOpen(true);
        switchRole('owner');
        return;
      }

      navigate(path);
    },
    [activeRole, canOpenOwnerSearchRoutes, navigate, switchRole]
  );

  const openSearchResult = React.useCallback(
    (result: SearchHit) => {
      setSearchNotice(null);
      setSearchOpen(false);

      if (result.type === 'service-center') {
        setSearchQuery(result.title);
        if (canOpenOwnerSearchRoutes) {
          navigateToOwnerSearchTarget(`/owner/explore?search=${encodeURIComponent(result.title)}&merchant=${encodeURIComponent(result.providerId)}`);
          return;
        }

        navigate(`/search?search=${encodeURIComponent(result.title)}&provider=${encodeURIComponent(result.providerId)}`);
        return;
      }

      setSearchQuery(result.plateNumber);
      if (canOpenOwnerSearchRoutes) {
        navigateToOwnerSearchTarget(`/owner/vehicles?search=${encodeURIComponent(result.plateNumber)}&vehicle=${encodeURIComponent(result.vehicleId)}`);
        return;
      }

      navigate(`/search?search=${encodeURIComponent(result.plateNumber)}&vehicle=${encodeURIComponent(result.vehicleId)}`);
    },
    [canOpenOwnerSearchRoutes, navigate, navigateToOwnerSearchTarget]
  );

  const submitSearch = React.useCallback(
    (rawQuery: string, options?: { preferTopResult?: boolean }) => {
      const trimmedQuery = rawQuery.trim();
      setSearchQuery(trimmedQuery);

      if (!trimmedQuery) {
        setSearchNotice(null);
        setSearchOpen(false);
        return;
      }

      if (!data) {
        setSearchNotice('Loading mock search data...');
        setSearchOpen(true);
        return;
      }

      const results = searchPlatformData(data, trimmedQuery, {
        ownerId: searchOwnerId,
        includeVehicles: true,
      });

      if (results.length === 0) {
        setSearchNotice('No service centers or vehicle plates matched that search.');
        setSearchOpen(true);
        focusSearchInput();
        return;
      }

      setSearchNotice(null);

      if (options?.preferTopResult) {
        openSearchResult(results[0]);
        return;
      }

      setSearchOpen(true);
    },
    [data, focusSearchInput, openSearchResult, searchOwnerId]
  );

  const handleRoleSwitch = (nextRole: 'owner' | 'provider' | 'admin') => {
    switchRole(nextRole);
    navigate(`/${nextRole}/dashboard`);
  };

  const handleVoiceTranscript = React.useCallback((transcript: string) => {
    submitSearch(transcript, { preferTopResult: true });
  }, [submitSearch]);

  const {
    isSupported: isVoiceSearchSupported,
    message: voiceSearchMessage,
    state: voiceSearchState,
    toggleVoiceSearch,
  } = useVoiceSearch({ onTranscript: handleVoiceTranscript });

  const handleVoiceSearch = () => {
    setSearchOpen(true);
    void toggleVoiceSearch();
  };

  const handleRequestLocation = () => {
    if (locationBlocked) {
      setLocationLabel('Location blocked');
      return;
    }

    if (!window.isSecureContext) {
      setLocationLabel('HTTPS required');
      return;
    }

    requestLocation();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitSearch(searchQuery, { preferTopResult: true });
      return;
    }

    if (event.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    submitSearch(searchQuery, { preferTopResult: true });
  };

  const hasTypedQuery = searchQuery.trim().length > 0;
  const isVoiceSearchStarting = voiceSearchState === 'starting';
  const isVoiceSearchListening = voiceSearchState === 'listening';
  const isVoiceSearchTranscribing = voiceSearchState === 'transcribing';
  const voiceSearchTitle =
    !isVoiceSearchSupported
      ? 'Voice search is not supported in this browser'
      : isVoiceSearchStarting
        ? 'Waiting for microphone access'
      : isVoiceSearchListening
        ? 'Stop recording and search'
        : isVoiceSearchTranscribing
          ? 'Transcribing your voice search'
          : 'Search with your voice';
  const statusMessage = voiceSearchMessage ?? searchNotice;
  const showSearchPanel = searchOpen && (hasTypedQuery || Boolean(statusMessage) || searchDataLoading);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 px-4 font-sans text-sm glass-effect sm:gap-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div ref={searchShellRef} className="relative flex min-w-0 flex-1 items-center">
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-surface-container-low px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20 sm:px-4 sm:py-2.5 md:max-w-md lg:max-w-xl">
            <button
              type="button"
              onClick={handleRequestLocation}
              className="mr-2 inline-flex max-w-[46%] shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm hover:text-primary sm:text-xs"
              title="Get your current location"
            >
              <MapPin size={12} />
              <span className="truncate">{locationLabel}</span>
            </button>
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="mr-2 shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-primary"
              aria-label="Submit search"
              title="Search"
            >
              <Search size={18} />
            </button>
            <input
              ref={searchInputRef}
              className="w-full min-w-0 border-none bg-transparent text-sm outline-none placeholder:text-slate-400 focus:ring-0"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchNotice(null);
                setSearchOpen(event.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim() || voiceSearchMessage) {
                  setSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              type="search"
              autoComplete="off"
              value={searchQuery}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              aria-label={voiceSearchTitle}
              aria-pressed={isVoiceSearchListening}
              className={cn(
                'ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                isVoiceSearchListening
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : isVoiceSearchStarting || isVoiceSearchTranscribing
                    ? 'bg-white text-primary'
                    : 'text-slate-500 hover:bg-white hover:text-primary'
              )}
              disabled={isVoiceSearchStarting || isVoiceSearchTranscribing}
              title={voiceSearchTitle}
            >
              {isVoiceSearchStarting || isVoiceSearchTranscribing ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Mic size={16} className={isVoiceSearchListening ? 'animate-pulse' : undefined} />
              )}
            </button>
          </div>

          {showSearchPanel && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-40 overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white/95 p-3 shadow-2xl backdrop-blur md:max-w-md lg:max-w-xl">
              {statusMessage && (
                <div
                  className={cn(
                    'mb-3 rounded-2xl px-4 py-3 text-sm font-medium',
                    isVoiceSearchListening
                      ? 'bg-red-50 text-red-600'
                      : isVoiceSearchTranscribing
                        ? 'bg-primary-container/40 text-primary'
                        : 'bg-surface-container-low text-slate-600'
                  )}
                >
                  {statusMessage}
                </div>
              )}

              {hasTypedQuery && (
                searchDataLoading ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-slate-500">
                    <LoaderCircle size={16} className="animate-spin" />
                    Loading searchable mock data...
                  </div>
                ) : searchDataError ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    Unable to load mock search data right now.
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-slate-500">
                    <SearchX size={16} />
                    No service centers or vehicle plates match "{searchQuery}".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => openSearchResult(result)}
                        onMouseDown={(event) => event.preventDefault()}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-container-low"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                          {result.type === 'vehicle' ? <CarFront size={18} /> : <Store size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800">{result.title}</p>
                          <p className="truncate text-xs font-medium text-slate-500">{result.subtitle}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:inline-flex">
                            {result.type === 'vehicle' ? 'Vehicle' : 'Service Center'}
                          </span>
                          <ArrowUpRight size={16} className="text-slate-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {availableRoles.length > 1 && (
            <div className="flex items-center rounded-full bg-surface-container-low p-1">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSwitch(role)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition sm:px-3 ${
                    activeRole === role ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="relative text-slate-500 transition-colors hover:text-primary"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>
          <button
            type="button"
            className="hidden text-slate-500 transition-colors hover:text-primary sm:block"
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <button
          type="button"
          className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
        >
          <div className="hidden text-right sm:block">
            <p className="mb-1 font-headline text-xs font-bold leading-none">{user?.name ?? 'Guest'}</p>
            <p className="text-[10px] leading-none text-slate-500">{activeRole?.toUpperCase() ?? 'ROLE'}</p>
          </div>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow-sm sm:h-10 sm:w-10">
            <img
              alt="User Avatar"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk1EDQ05LTK150eWybllRKFWJnlzJMY-RpTeVvq-RMDWqeFhSgmOZwD2AjmltZVzE60jHVzltvxA11m0kaNEIesMtdTQ33kZ03tYmuazZuqkAC3jIzYlxFR0wFzFNpXpHY4B-b9t9iGfS3sP6fpUfffDbZyuawy0d3ojBrgmtYSONn-rUhqfMHkyVfKEuf_r4FdzMY4kAnPMPB51lDPE5hBEDH_vgBdSpMOzFqYYNuaNh7zrDucCmul_s4j_GzfkGfBN0gJ8bZaTxX"
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
      </div>
    </header>
  );
};
