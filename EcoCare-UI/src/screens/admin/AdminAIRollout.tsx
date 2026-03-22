import React from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { useAuth } from '../../auth/AuthContext';

const rankingModelStatusOptions = [
  { label: 'shadow_mode', value: 'shadow_mode' },
  { label: 'canary', value: 'canary' },
  { label: 'live', value: 'live' },
];

const slotModelStatusOptions = [
  { label: 'rule_engine_active', value: 'rule_engine_active' },
  { label: 'model_active', value: 'model_active' },
];
import { useAdminAiRollout, useAdminRankingRules } from '../../hooks/useAdminApi';

export const AdminAIRollout = () => {
  const { user, activeRole } = useAuth();
  const adminId = activeRole === 'admin' ? user?.id : undefined;
  const { data, loading: rolloutLoading, error, patchAiRollout } = useAdminAiRollout(adminId);
  const ranking = useAdminRankingRules(adminId);
  const [draft, setDraft] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!ranking.data) return;
    setDraft({
      routeMatchWeight: ranking.data.routeMatchWeight,
      distanceDetourWeight: ranking.data.distanceDetourWeight,
      ratingWeight: ranking.data.ratingWeight,
      successfulOrderWeight: ranking.data.successfulOrderWeight,
      slotAvailabilityWeight: ranking.data.slotAvailabilityWeight,
      priceFitWeight: ranking.data.priceFitWeight,
    });
  }, [ranking.data]);

  if (!adminId) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">
        Admin role required.
      </div>
    );
  }

  if (rolloutLoading || ranking.loading) {
    return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading rollout and ranking rules…</div>;
  }
  if (error || !data) {
    return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{error ?? 'Unable to load AI rollout.'}</div>;
  }
  if (ranking.error || !ranking.data) {
    return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">{ranking.error ?? 'Unable to load ranking rules.'}</div>;
  }

  const weightFields = [
    ['routeMatchWeight', 'Route match'],
    ['distanceDetourWeight', 'Distance / detour'],
    ['ratingWeight', 'Rating'],
    ['successfulOrderWeight', 'Successful orders'],
    ['slotAvailabilityWeight', 'Slot availability'],
    ['priceFitWeight', 'Price fit'],
  ] as const;

  const saveRanking = async () => {
    setSaving(true);
    try {
      await ranking.save({
        routeMatchWeight: draft.routeMatchWeight ?? ranking.data!.routeMatchWeight,
        distanceDetourWeight: draft.distanceDetourWeight ?? ranking.data!.distanceDetourWeight,
        ratingWeight: draft.ratingWeight ?? ranking.data!.ratingWeight,
        successfulOrderWeight: draft.successfulOrderWeight ?? ranking.data!.successfulOrderWeight,
        slotAvailabilityWeight: draft.slotAvailabilityWeight ?? ranking.data!.slotAvailabilityWeight,
        priceFitWeight: draft.priceFitWeight ?? ranking.data!.priceFitWeight,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">AI Rollout Monitor</h2>
        <p className="mt-1 text-slate-500">Model metrics, fallback behavior, and release readiness.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          title="Ranking Model"
          lines={[
            `Status: ${data.rankingModel.status}`,
            `NDCG@10: ${data.rankingModel.ndcg10}`,
            `Recall@10: ${data.rankingModel.recall10}`,
          ]}
        />
        <Card
          title="Slot Model"
          lines={[
            `Status: ${data.slotModel.status}`,
            `Top-3 Hit Rate: ${data.slotModel.top3HitRate}`,
            `AUC: ${data.slotModel.auc}`,
          ]}
        />
        <Card title="Fallback" lines={[data.fallbackHealthy ? 'Healthy: Yes' : 'Healthy: No', 'Rule engine when model unavailable']} />
      </div>

      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="font-headline text-lg font-bold">Release controls</h3>
        <p className="mt-1 text-sm text-slate-500">Adjust model rollout flags and fallback health.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700" htmlFor="fallback-healthy">
            <Checkbox
              inputId="fallback-healthy"
              checked={data.fallbackHealthy}
              onChange={(e) => void patchAiRollout({ fallbackHealthy: Boolean(e.checked) })}
            />
            Fallback healthy
          </label>
          <Dropdown
            value={data.rankingModel.status}
            options={rankingModelStatusOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => void patchAiRollout({ rankingModelStatus: e.value as string })}
            className="min-w-[10rem] text-sm font-bold"
          />
          <Dropdown
            value={data.slotModel.status}
            options={slotModelStatusOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => void patchAiRollout({ slotModelStatus: e.value as string })}
            className="min-w-[12rem] text-sm font-bold"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="font-headline text-lg font-bold">Ranking weights</h3>
        <p className="mt-1 text-sm text-slate-500">Tune how search balances route fit, distance, ratings, and price.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {weightFields.map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              {label}
              <InputNumber
                value={draft[key] ?? ranking.data[key]}
                onValueChange={(e) => {
                  const v = Array.isArray(e.value) ? 0 : Number(e.value ?? 0);
                  setDraft((d) => ({ ...d, [key]: v }));
                }}
                minFractionDigits={2}
                maxFractionDigits={4}
                step={0.01}
                className="w-full"
                inputClassName="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 w-full"
              />
            </label>
          ))}
        </div>
        <Button
          type="button"
          label={saving ? 'Saving…' : 'Save weights'}
          disabled={saving}
          onClick={() => void saveRanking()}
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-bold text-white disabled:opacity-50 border-none"
        />
      </section>
    </div>
  );
};

const Card = ({ title, lines }: { title: string; lines: string[] }) => (
  <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
    <p className="font-headline text-lg font-bold">{title}</p>
    <div className="mt-3 space-y-1 text-sm text-slate-600">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  </div>
);
