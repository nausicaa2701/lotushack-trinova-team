import React from 'react';
import { Megaphone } from 'lucide-react';
import { useMockData } from '../../hooks/useMockData';

export const ProviderCampaigns = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading campaigns...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load campaigns.</div>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">Visibility Campaigns</h2>
        <p className="mt-1 text-slate-500">Request boost campaigns and track approval status.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.campaignRequests.map((campaign, idx) => (
          <div key={idx} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-primary">
                <Megaphone size={18} />
              </div>
              <p className="font-headline text-lg font-bold">{String(campaign.type)}</p>
            </div>
            <p className="text-sm text-slate-600">Provider: {String(campaign.provider)}</p>
            <p className="mt-2 text-sm font-bold text-primary">Status: {String(campaign.status)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
