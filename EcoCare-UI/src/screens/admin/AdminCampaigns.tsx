import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useAdminCampaignModeration } from '../../hooks/useAdminApi';

export const AdminCampaigns = () => {
  const { user, activeRole } = useAuth();
  const adminId = activeRole === 'admin' ? user?.id : undefined;
  const { items, loading, error, patchCampaignStatus } = useAdminCampaignModeration(adminId);

  if (!adminId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Admin role required.
      </div>
    );
  }

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading campaign moderation...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Campaign Moderation</h2>
        <p className="mt-1 text-slate-500">Review visibility campaign requests before publishing.</p>
      </header>
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-surface-container-low px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 sm:grid-cols-3">
          <span>Provider</span>
          <span>Campaign</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((campaign) => (
            <div key={campaign.id} className="grid grid-cols-1 items-start gap-3 px-6 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
              <span>{campaign.provider}</span>
              <span>{campaign.type}</span>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="font-bold text-primary">{campaign.status}</span>
                <select
                  aria-label={`Update status for ${campaign.id}`}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs font-bold text-slate-700"
                  value={campaign.status}
                  onChange={(ev) => void patchCampaignStatus(campaign.id, ev.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
