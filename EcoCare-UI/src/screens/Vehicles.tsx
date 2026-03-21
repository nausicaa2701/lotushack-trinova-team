import React from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BatteryCharging,
  Calendar,
  CarFront,
  ChevronRight,
  Droplets,
  Gauge,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useMockData } from '../hooks/useMockData';
import { filterVehiclesByQuery, formatVehicleHeadline, formatVehicleSubtitle, type VehicleRecord } from '../lib/platformMock';
import { cn } from '@/src/lib/utils';

export const Vehicles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useMockData();
  const [searchParams] = useSearchParams();

  const topBarSearchQuery = searchParams.get('search')?.trim() ?? '';
  const selectedVehicleId = searchParams.get('vehicle');

  const ownedVehicles = React.useMemo(
    () => data?.vehicles.filter((vehicle) => vehicle.ownerId === user?.id) ?? [],
    [data?.vehicles, user?.id]
  );

  const filteredVehicles = React.useMemo(
    () => filterVehiclesByQuery(ownedVehicles, topBarSearchQuery),
    [ownedVehicles, topBarSearchQuery]
  );

  const activeVehicle =
    filteredVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
    filteredVehicles[0] ??
    ownedVehicles[0] ??
    null;

  const aggregateStats = React.useMemo(() => {
    const baseList = filteredVehicles.length > 0 ? filteredVehicles : ownedVehicles;

    return {
      avgBatteryHealth:
        baseList.length > 0
          ? Math.round(baseList.reduce((total, vehicle) => total + vehicle.batteryHealthPct, 0) / baseList.length)
          : 0,
      totalPoints: baseList.reduce((total, vehicle) => total + vehicle.loyaltyPoints, 0),
      totalWaterSaved: baseList.reduce((total, vehicle) => total + vehicle.waterSavedLiters, 0),
    };
  }, [filteredVehicles, ownedVehicles]);

  if (loading) {
    return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading vehicles...</div>;
  }

  if (error || !data) {
    return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load vehicle data.</div>;
  }

  if (!activeVehicle) {
    return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No vehicles found for this account.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Vehicles & Impact</h2>
          <p className="mt-1 text-slate-500">
            {topBarSearchQuery
              ? `Showing vehicles that match "${topBarSearchQuery}".`
              : 'Manage your EV profile, plate numbers, and sustainability contribution.'}
          </p>
        </div>
        {topBarSearchQuery && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-container/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Search Filter
            <span className="rounded-full bg-white px-3 py-1 text-[10px] tracking-wide text-slate-600">{topBarSearchQuery}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <section className="group relative overflow-hidden rounded-[2rem] border border-transparent bg-surface-container-lowest p-5 shadow-sm transition-all duration-500 hover:border-primary/10 sm:p-8">
          <div className="absolute right-0 top-0 p-4 sm:p-8">
            <span
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
                activeVehicle.status === 'charging'
                  ? 'bg-primary-container/50 text-primary'
                  : activeVehicle.status === 'service_due'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed'
              )}
            >
              {activeVehicle.status === 'charging'
                ? 'Charging'
                : activeVehicle.status === 'service_due'
                  ? 'Service Due'
                  : 'Active'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-10 md:flex-row">
            <div className="relative w-full md:w-1/2">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-3xl transition-colors duration-700 group-hover:bg-primary/10" />
              <img
                alt={formatVehicleHeadline(activeVehicle)}
                className="relative z-10 w-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                src={activeVehicle.imageUrl}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Registered Vehicle</p>
                <h3 className="mt-2 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl md:text-4xl">
                  {formatVehicleHeadline(activeVehicle)}
                </h3>
                <p className="mt-1 font-medium tracking-wide text-slate-500">{formatVehicleSubtitle(activeVehicle)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MetricTile label="Plate Number" value={activeVehicle.plateNumber} tone="primary" />
                <MetricTile label="Mileage" value={`${activeVehicle.mileageMiles.toLocaleString()} mi`} tone="neutral" />
                <MetricTile label="Battery Health" value={`${activeVehicle.batteryHealthPct}%`} tone="success" />
                <MetricTile label="Range" value={`${activeVehicle.rangeKm ?? 0} km`} tone="neutral" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoChip icon={Calendar} label="Next Service" value={activeVehicle.nextServiceLabel} />
                <InfoChip icon={Droplets} label="Last Wash" value={activeVehicle.lastWashLabel} />
              </div>

              {activeVehicle.upcomingWash && (
                <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Upcoming Wash</p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-headline text-xl font-bold">{activeVehicle.upcomingWash.service}</p>
                      <p className="text-sm font-medium text-slate-500">{activeVehicle.upcomingWash.dateLabel}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin size={14} className="text-primary" />
                        <span>{activeVehicle.upcomingWash.provider} · {activeVehicle.upcomingWash.location}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/owner/bookings')}
                      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
                    >
                      View Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <StatCard
            icon={<Droplets size={20} />}
            label="Water Saved"
            value={`${aggregateStats.totalWaterSaved.toLocaleString()}L`}
            note="Across your currently visible vehicles."
            tone="eco"
          />
          <StatCard
            icon={<Sparkles size={20} />}
            label="Rewards Points"
            value={aggregateStats.totalPoints.toLocaleString()}
            note="Searchable by plate number from the top bar."
            tone="primary"
          />
          <StatCard
            icon={<ShieldCheck size={20} />}
            label="Avg Battery Health"
            value={`${aggregateStats.avgBatteryHealth}%`}
            note="Tracking the health profile of your EV fleet."
            tone="neutral"
          />
        </aside>
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-headline text-xl font-bold tracking-tight sm:text-2xl">Registered Vehicles</h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredVehicles.length} vehicle{filteredVehicles.length === 1 ? '' : 's'} shown
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Vehicle editing is planned post-MVP"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-bold text-slate-400"
          >
            <Ticket size={16} />
            Manage Registrations
          </button>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="rounded-[2rem] bg-surface-container-low p-8 text-sm text-slate-500">
            No vehicles matched "{topBarSearchQuery}". Try another plate number from the search bar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredVehicles.map((vehicle) => (
              <VehicleSummaryCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={vehicle.id === activeVehicle.id}
                onOpen={() => navigate(`/owner/vehicles?search=${encodeURIComponent(topBarSearchQuery || vehicle.plateNumber)}&vehicle=${encodeURIComponent(vehicle.id)}`)}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};

const MetricTile = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'neutral';
}) => {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary-container/35 text-primary'
      : tone === 'success'
        ? 'bg-tertiary-container/25 text-tertiary'
        : 'bg-surface-container-low text-on-surface';

  return (
    <div className={cn('rounded-2xl p-4', toneClass)}>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-current/70">{label}</p>
      <p className="font-headline text-xl font-bold text-current">{value}</p>
    </div>
  );
};

const InfoChip = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-surface-container-highest/60 p-4 text-sm text-slate-500">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-on-surface">{value}</p>
    </div>
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: 'primary' | 'eco' | 'neutral';
}) => {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary-container/35 text-primary'
      : tone === 'eco'
        ? 'bg-tertiary text-white'
        : 'bg-surface-container-lowest text-on-surface';

  return (
    <div className={cn('rounded-[2rem] p-6 shadow-sm', toneClass)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full',
            tone === 'eco' ? 'bg-white/20' : 'bg-white'
          )}
        >
          {icon}
        </div>
        <p className="font-headline text-lg font-bold">{label}</p>
      </div>
      <p className="mt-5 font-headline text-3xl font-extrabold">{value}</p>
      <p className={cn('mt-2 text-sm leading-relaxed', tone === 'eco' ? 'text-white/80' : 'text-slate-500')}>{note}</p>
    </div>
  );
};

const VehicleSummaryCard = ({
  vehicle,
  selected,
  onOpen,
}: {
  vehicle: VehicleRecord;
  selected: boolean;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    className={cn(
      'group w-full rounded-[2rem] border p-5 text-left shadow-sm transition-all',
      selected
        ? 'border-primary bg-primary-container/10'
        : 'border-outline-variant/20 bg-surface-container-lowest hover:-translate-y-0.5 hover:shadow-lg'
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-headline text-xl font-bold">{formatVehicleHeadline(vehicle)}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{formatVehicleSubtitle(vehicle)}</p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
        <CarFront size={20} />
      </div>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <SummaryPill icon={Ticket} label="Plate" value={vehicle.plateNumber} />
      <SummaryPill icon={Gauge} label="Mileage" value={`${vehicle.mileageMiles.toLocaleString()} mi`} />
      <SummaryPill icon={BatteryCharging} label="Battery" value={`${vehicle.batteryHealthPct}%`} />
      <SummaryPill icon={Leaf} label="Water Saved" value={`${vehicle.waterSavedLiters}L`} />
    </div>

    <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Subscription</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{vehicle.subscription}</p>
      </div>
      <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1" />
    </div>
  </button>
);

const SummaryPill = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
      <Icon size={14} className="text-primary" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-slate-700">{value}</p>
  </div>
);
