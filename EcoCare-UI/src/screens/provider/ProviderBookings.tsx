import React from 'react';
import { useMockData } from '../../hooks/useMockData';

export const ProviderBookings = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading booking queue...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load bookings.</div>;
  if (data.providerBookings.length === 0) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No bookings yet.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Booking Queue</h2>
        <p className="mt-1 text-slate-500">Update booking status and process service orders.</p>
      </header>
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-3 bg-surface-container-low px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Owner</span>
          <span>Service</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.providerBookings.map((booking, idx) => (
            <div key={idx} className="grid grid-cols-3 items-center px-6 py-4">
              <span className="font-semibold">{String(booking.owner)}</span>
              <span className="text-slate-600">{String(booking.service)}</span>
              <span className="text-right text-sm font-bold text-primary">{String(booking.state)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
