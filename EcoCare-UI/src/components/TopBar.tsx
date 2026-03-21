import React from 'react';
import { MapPin, Menu, Search, Bell, HelpCircle, Mic } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const navigate = useNavigate();
  const { user, activeRole, availableRoles, switchRole } = useAuth();
  const [locationLabel, setLocationLabel] = React.useState('Enable location');
  const [locationBlocked, setLocationBlocked] = React.useState(false);
  const watchIdRef = React.useRef<number | null>(null);
  const retryTimerRef = React.useRef<number | null>(null);

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
  }, [cleanupWatch, setLocationBlocked]);
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

  const searchPlaceholder =
    activeRole === 'admin'
      ? 'Search merchants, disputes, campaigns...'
      : activeRole === 'provider'
        ? 'Search bookings, services, campaigns...'
        : 'Search services or vehicles...';

  const handleRoleSwitch = (nextRole: 'owner' | 'provider' | 'admin') => {
    switchRole(nextRole);
    navigate(`/${nextRole}/dashboard`);
  };

  const handleVoiceSearch = () => {
    // TODO: implement voice search flow
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
          <Search size={18} className="mr-2 shrink-0 text-slate-400" />
          <input
            className="w-full min-w-0 border-none bg-transparent text-sm outline-none placeholder:text-slate-400 focus:ring-0"
            placeholder={searchPlaceholder}
            type="search"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            aria-label="Voice search"
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-primary"
          >
            <Mic size={16} />
          </button>
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
