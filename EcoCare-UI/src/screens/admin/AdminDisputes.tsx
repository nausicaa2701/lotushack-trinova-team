import React from 'react';
import { useMockData } from '../../hooks/useMockData';

export const AdminDisputes = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading disputes...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load disputes.</div>;
  if (data.disputes.length === 0) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No active disputes.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Booking Disputes</h2>
        <p className="mt-1 text-slate-500">Handle complaints and refunds across the marketplace.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.disputes.map((dispute, idx) => (
          <div key={idx} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{String(dispute.type)}</p>
            <p className="mt-2 font-headline text-xl font-bold">Booking {String(dispute.bookingId)}</p>
            <p className="mt-1 text-sm font-semibold text-primary">Status: {String(dispute.status)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
