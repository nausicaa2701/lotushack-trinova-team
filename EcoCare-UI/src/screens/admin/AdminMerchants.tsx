import React from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../../auth/AuthContext';
import { useAdminMerchants } from '../../hooks/useAdminApi';

export const AdminMerchants = () => {
  const { user, activeRole } = useAuth();
  const adminId = activeRole === 'admin' ? user?.id : undefined;
  const { items, loading, error, patchStatus } = useAdminMerchants(adminId);

  if (!adminId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Admin role required.
      </div>
    );
  }

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading merchant approvals...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Merchant Approval</h2>
        <p className="mt-1 text-slate-500">Approve or suspend providers in the marketplace.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((merchant) => (
          <div key={merchant.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <p className="font-headline text-xl font-bold">{merchant.merchant}</p>
            <p className="text-sm text-slate-500">{merchant.city}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">Status: {merchant.status}</p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                label="Approve"
                onClick={() => void patchStatus(merchant.id, 'approved')}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white border-none"
              />
              <Button
                type="button"
                label="Suspend"
                onClick={() => void patchStatus(merchant.id, 'suspended')}
                className="rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 border-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
