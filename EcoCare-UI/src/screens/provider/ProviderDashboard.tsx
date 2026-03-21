import React from 'react';
import { Activity, Star, Users } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useProviderBookings, useProviderRatings } from '../../hooks/useProviderApi';

export const ProviderDashboard = () => {
  const { user, activeRole } = useAuth();
  const providerApiId =
    activeRole === 'provider' ? (user?.providerAccountId ?? user?.id) : undefined;
  const { bookings, loading: bookingsLoading, error } = useProviderBookings(providerApiId);
  const { metrics, loading: ratingsLoading } = useProviderRatings(providerApiId);

  if (!providerApiId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Switch to the provider role to see operations.
      </div>
    );
  }

  if (bookingsLoading && !bookings.length) {
    return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading provider metrics...</div>;
  }
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Provider Operations</h2>
        <p className="mt-1 text-slate-500">Track bookings, ratings, and conversion.</p>
      </header>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard icon={<Activity size={20} />} label="Bookings (queue)" value={`${bookings.length}`} />
        <MetricCard
          icon={<Star size={20} />}
          label="Average Rating"
          value={ratingsLoading ? '…' : metrics ? `${metrics.avgRating.toFixed(1)}` : '—'}
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Successful orders (market)"
          value={ratingsLoading ? '…' : metrics ? `${metrics.successfulOrders}` : '—'}
        />
      </section>
    </div>
  );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-primary">{icon}</div>
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 font-headline text-3xl font-extrabold">{value}</p>
  </div>
);
