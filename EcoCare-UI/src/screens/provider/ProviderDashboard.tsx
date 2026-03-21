import React from 'react';
import { Activity, Star, Users } from 'lucide-react';
import { useMockData } from '../../hooks/useMockData';

export const ProviderDashboard = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading provider metrics...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load provider data.</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Provider Operations</h2>
        <p className="mt-1 text-slate-500">Track bookings, ratings, and conversion performance.</p>
      </header>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard icon={<Activity size={20} />} label="Active Bookings" value={`${data.providerBookings.length}`} />
        <MetricCard icon={<Star size={20} />} label="Average Rating" value="4.8" />
        <MetricCard icon={<Users size={20} />} label="Review Count" value="1,246" />
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
