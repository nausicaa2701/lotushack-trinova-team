import React from 'react';
import { useMockData } from '../../hooks/useMockData';

export const AdminMerchants = () => {
  const { data, loading, error } = useMockData();
  const [statusById, setStatusById] = React.useState<Record<string, string>>({});

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading merchant approvals...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load merchant approvals.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Merchant Approval</h2>
        <p className="mt-1 text-slate-500">Approve or suspend providers in the marketplace.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.merchantApprovals.map((merchant, idx) => (
          <div key={idx} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <p className="font-headline text-xl font-bold">{String(merchant.merchant)}</p>
            <p className="text-sm text-slate-500">{String(merchant.city)}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">
              Status: {statusById[String(merchant.id)] ?? String(merchant.status)}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStatusById((prev) => ({ ...prev, [String(merchant.id)]: 'approved' }))}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setStatusById((prev) => ({ ...prev, [String(merchant.id)]: 'suspended' }))}
                className="rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Suspend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
