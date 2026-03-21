import React from 'react';
import { useMockData } from '../../hooks/useMockData';

export const AdminCampaigns = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading campaign moderation...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load campaigns.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Campaign Moderation</h2>
        <p className="mt-1 text-slate-500">Review visibility campaign requests before publishing.</p>
      </header>
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-3 bg-surface-container-low px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Provider</span>
          <span>Campaign</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.campaignRequests.map((campaign, idx) => (
            <div key={idx} className="grid grid-cols-3 items-center px-6 py-4">
              <span>{String(campaign.provider)}</span>
              <span>{String(campaign.type)}</span>
              <span className="text-right font-bold text-primary">{String(campaign.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
