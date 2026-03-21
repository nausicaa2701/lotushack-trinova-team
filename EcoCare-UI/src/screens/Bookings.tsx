import React from 'react';
import { motion } from 'motion/react';
import { MapPin, CheckCircle2, Download, Droplets, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../auth/AuthContext';
import { useMockData } from '../hooks/useMockData';
import { useOwnerBookings } from '../hooks/useOwnerBookings';

export const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, error } = useOwnerBookings(user?.id);
  const { data: platformData } = useMockData();

  const activeBooking = bookings.find((b) => b.state === 'in_progress' || b.state === 'confirmed');
  const ownedVehicles = React.useMemo(
    () => platformData?.vehicles.filter((vehicle) => vehicle.ownerId === user?.id) ?? [],
    [platformData?.vehicles, user?.id]
  );

  const ecoStats = React.useMemo(() => {
    return {
      totalWaterSaved: ownedVehicles.reduce((total, vehicle) => total + vehicle.waterSavedLiters, 0),
      totalPoints: ownedVehicles.reduce((total, vehicle) => total + vehicle.loyaltyPoints, 0),
      totalCo2Offset: ownedVehicles.reduce((total, vehicle) => total + vehicle.co2OffsetKg, 0),
    };
  }, [ownedVehicles]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">My Bookings</h2>
          <p className="font-medium text-slate-500">Your reservations and service history.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-tertiary-fixed px-4 py-2 font-bold text-xs text-on-tertiary-fixed">
          <CheckCircle2 size={16} fill="currentColor" />
          {error ? 'Limited' : 'Synced'}
        </span>
      </div>

      {activeBooking && (
        <section>
          <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border-none bg-surface-container-lowest p-5 shadow-sm sm:p-6 md:flex-row md:items-center md:gap-8 md:p-8">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 blur-3xl power-gradient opacity-[0.03]"></div>
            <div className="relative w-full md:w-1/3">
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low">
                <img
                  alt="Car wash facility"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAteTMtMlzOjv7OXyVRX0QnZ6ABOwPm9Mwm_uGvFQh_3-9AiYJefck5p2kbXWk5vBgcaQrcX_r4VeMDYvQQn6r4DRUmcpX5n2oBs8n9_vQRjhgZuLLiil8-IpTe4T7fsWqLXksn7ky6cG0mifEgA7LjRkN29x56iNmqldvP-6ybg0c-KmH5LLZuszPBFAkGpBrPp07i1yR118vhIZxPKK12AYXl8OlbWgLXBE1jr3jWe0bMI2EuHhlXw_roIEEyiJpu4Xl5eqHWquYk"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {activeBooking.state.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-headline text-xl font-bold sm:text-2xl">{activeBooking.provider}</h3>
                <p className="mt-1 flex items-center gap-2 text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="text-sm">Slot {activeBooking.slot}</span>
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-600">{activeBooking.service}</p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-headline text-xl font-bold tracking-tight sm:text-2xl">Booking history</h2>
          <button
            type="button"
            disabled
            title="Planned for post-MVP"
            className="flex items-center gap-1 text-sm font-bold text-slate-400"
          >
            Download All Receipts
            <Download size={16} />
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading bookings...</div>
        )}
        {error && (
          <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-800">
            {error} — check your connection and try signing in again.
          </div>
        )}
        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No bookings yet.</div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
            <div className="-mx-px overflow-x-auto overscroll-x-contain">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-6 bg-surface-container-low px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:px-8 sm:py-5">
                  <div className="col-span-2">Service Center</div>
                  <div>Slot</div>
                  <div>Service Type</div>
                  <div>Cost</div>
                  <div className="text-right">State</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <HistoryRow
                      key={b.id}
                      icon={Droplets}
                      name={b.provider}
                      location={b.slot}
                      date={b.state}
                      time=""
                      type={b.service}
                      cost={b.price}
                      onRebook={() => navigate('/owner/explore')}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed">
              <Droplets size={20} className="text-on-tertiary-fixed" />
            </div>
            <h4 className="font-headline font-bold">Eco Impact</h4>
          </div>
          <p className="font-headline text-3xl font-extrabold">
            {ecoStats.totalWaterSaved.toLocaleString()}L
          </p>
          <p className="text-sm font-medium text-slate-400">
            {ownedVehicles.length > 0
              ? `${ecoStats.totalCo2Offset.toFixed(1)} kg CO2 offset across ${ownedVehicles.length} vehicle${ownedVehicles.length === 1 ? '' : 's'}.`
              : 'No linked vehicle impact data for this account yet.'}
          </p>
        </div>

        <div className="space-y-4 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h4 className="font-headline font-bold">Rewards</h4>
          </div>
          <p className="font-headline text-3xl font-extrabold">{ecoStats.totalPoints.toLocaleString()}</p>
          <p className="text-sm font-medium text-slate-400">
            {ownedVehicles.length > 0
              ? 'Reward points accumulated from your linked vehicle activity.'
              : 'Rewards will appear once vehicles and bookings are linked.'}
          </p>
        </div>

        <div className="power-gradient relative space-y-4 overflow-hidden rounded-3xl p-6 text-white shadow-lg">
          <Sparkles className="absolute -bottom-4 -right-4 rotate-12 text-[120px] opacity-10 transition-transform duration-700" />
          <h4 className="font-headline font-bold">Premium Perk</h4>
          <p className="text-sm text-white/80">Subscription and perks — post-MVP.</p>
          <button
            type="button"
            disabled
            title="Planned for post-MVP"
            className="w-fit rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-slate-400"
          >
            Manage Plan
          </button>
        </div>
      </section>
    </motion.div>
  );
};

const HistoryRow = ({
  icon: Icon,
  name,
  location,
  date,
  time,
  type,
  cost,
  isEco,
  onRebook,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  name: string;
  location: string;
  date: string;
  time: string;
  type: string;
  cost: number;
  isEco?: boolean;
  onRebook: () => void;
}) => (
  <div className="group grid grid-cols-6 items-center px-4 py-5 transition-colors hover:bg-surface-container-low sm:px-8 sm:py-6">
    <div className="col-span-2 flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-slate-500 transition-colors group-hover:bg-white">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-headline font-bold">{name}</p>
        <p className="text-xs text-slate-400">{location}</p>
      </div>
    </div>
    <div className="text-sm">
      <p className="font-semibold">{date}</p>
      {time ? <p className="text-xs text-slate-400">{time}</p> : null}
    </div>
    <div className="text-sm">
      <span
        className={cn(
          'rounded-md px-2 py-1 text-[10px] font-bold uppercase',
          isEco ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'
        )}
      >
        {type}
      </span>
    </div>
    <div className="font-headline text-sm font-extrabold">${cost.toFixed(2)}</div>
    <div className="text-right">
      <button
        type="button"
        onClick={onRebook}
        className="rounded-full border border-outline-variant px-5 py-2 text-xs font-bold transition-all hover:border-primary hover:text-primary"
      >
        Re-book
      </button>
    </div>
  </div>
);
