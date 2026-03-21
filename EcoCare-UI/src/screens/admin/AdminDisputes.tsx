import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useAdminDisputes } from '../../hooks/useAdminApi';

export const AdminDisputes = () => {
  const { user, activeRole } = useAuth();
  const adminId = activeRole === 'admin' ? user?.id : undefined;
  const { items, loading, error, patchStatus } = useAdminDisputes(adminId);

  if (!adminId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Admin role required.
      </div>
    );
  }

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading disputes...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">No active disputes.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Booking Disputes</h2>
        <p className="mt-1 text-slate-500">Handle complaints and refunds across the marketplace.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((dispute) => (
          <div key={dispute.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{dispute.type}</p>
            <p className="mt-2 font-headline text-xl font-bold">Booking {dispute.bookingId}</p>
            <p className="mt-1 text-sm font-semibold text-primary">Status: {dispute.status}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void patchStatus(dispute.id, 'investigating')}
                className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Investigating
              </button>
              <button
                type="button"
                onClick={() => void patchStatus(dispute.id, 'closed')}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
