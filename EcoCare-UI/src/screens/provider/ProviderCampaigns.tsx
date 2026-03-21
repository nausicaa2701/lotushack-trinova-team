import React from 'react';
import { Megaphone } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { createCampaignRequest, useProviderCampaigns } from '../../hooks/useProviderApi';

export const ProviderCampaigns = () => {
  const { user, activeRole } = useAuth();
  const providerApiId =
    activeRole === 'provider' ? (user?.providerAccountId ?? user?.id) : undefined;
  const { campaigns, loading, error, reload } = useProviderCampaigns(providerApiId);
  const [campaignType, setCampaignType] = React.useState('map_boost');
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const submitCampaign = async () => {
    if (!providerApiId || !user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createCampaignRequest(providerApiId, {
        id: `cr-${Date.now()}`,
        provider: user.name ?? providerApiId,
        type: campaignType,
      });
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!providerApiId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Switch to the provider role to manage campaigns.
      </div>
    );
  }

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading campaigns...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error}</div>;

  if (campaigns.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h2 className="font-headline text-3xl font-extrabold">Visibility Campaigns</h2>
          <p className="mt-1 text-slate-500">Request a boost campaign for your locations.</p>
        </header>
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-700">New request</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
              Campaign type
              <select
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 font-bold"
                value={campaignType}
                onChange={(ev) => setCampaignType(ev.target.value)}
              >
                <option value="map_boost">Map boost</option>
                <option value="search_highlight">Search highlight</option>
                <option value="weekend_promo">Weekend promo</option>
              </select>
            </label>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitCampaign()}
              className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
          {formError ? <p className="mt-3 text-sm text-red-600">{formError}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-slate-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold">Visibility Campaigns</h2>
          <p className="mt-1 text-slate-500">Request boost campaigns and track approval status.</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="w-fit rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-slate-600 hover:bg-surface-container-low"
        >
          Refresh
        </button>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-primary">
                <Megaphone size={18} />
              </div>
              <p className="font-headline text-lg font-bold">{campaign.type}</p>
            </div>
            <p className="text-sm text-slate-600">Provider: {campaign.provider}</p>
            <p className="mt-2 text-sm font-bold text-primary">Status: {campaign.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
