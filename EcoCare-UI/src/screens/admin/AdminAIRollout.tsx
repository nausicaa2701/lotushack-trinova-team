import React from 'react';
import { useMockData } from '../../hooks/useMockData';

export const AdminAIRollout = () => {
  const { data, loading, error } = useMockData();

  if (loading) return <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-slate-500">Loading AI rollout...</div>;
  if (error || !data) return <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600">Unable to load AI rollout.</div>;

  const ai = data.aiRollout as {
    rankingModel: { status: string; ndcg10: number; recall10: number };
    slotModel: { status: string; top3HitRate: number; auc: number };
    fallbackHealthy: boolean;
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-headline text-3xl font-extrabold">AI Rollout Monitor</h2>
        <p className="mt-1 text-slate-500">Validate model metrics, fallback behavior, and release readiness.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Ranking Model" lines={[`Status: ${ai.rankingModel.status}`, `NDCG@10: ${ai.rankingModel.ndcg10}`, `Recall@10: ${ai.rankingModel.recall10}`]} />
        <Card title="Slot Model" lines={[`Status: ${ai.slotModel.status}`, `Top-3 Hit Rate: ${ai.slotModel.top3HitRate}`, `AUC: ${ai.slotModel.auc}`]} />
        <Card title="Fallback" lines={[ai.fallbackHealthy ? 'Healthy: Yes' : 'Healthy: No', 'Rule engine is active when model unavailable']} />
      </div>
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
