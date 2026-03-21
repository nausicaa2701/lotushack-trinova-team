import React from 'react';
import type { ExploreFilters } from './types';

interface Props {
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
}

const serviceOptions = ['ceramic', 'interior', 'express', 'eco'];

export const AdvancedFilterPanel: React.FC<Props> = ({ filters, onChange }) => {
  const toggleService = (service: string) => {
    const exists = filters.serviceTypes.includes(service);
    onChange({
      ...filters,
      serviceTypes: exists ? filters.serviceTypes.filter((item) => item !== service) : [...filters.serviceTypes, service],
    });
  };

  return (
    <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Advanced Filters</p>
      <label className="flex items-center justify-between text-sm font-semibold text-slate-600">
        Open Now
        <input type="checkbox" checked={filters.openNow} onChange={(evt) => onChange({ ...filters, openNow: evt.target.checked })} />
      </label>
      <label className="flex items-center justify-between text-sm font-semibold text-slate-600">
        EV Safe
        <input type="checkbox" checked={filters.evSafe} onChange={(evt) => onChange({ ...filters, evSafe: evt.target.checked })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
        Min Rating: {filters.minRating}
        <input type="range" min={3} max={5} step={0.1} value={filters.minRating} onChange={(evt) => onChange({ ...filters, minRating: Number(evt.target.value) })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
        Radius (km): {filters.radiusKm}
        <input type="range" min={1} max={15} step={1} value={filters.radiusKm} onChange={(evt) => onChange({ ...filters, radiusKm: Number(evt.target.value) })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
        Max Detour (km): {filters.maxDetourKm}
        <input type="range" min={1} max={8} step={1} value={filters.maxDetourKm} onChange={(evt) => onChange({ ...filters, maxDetourKm: Number(evt.target.value) })} />
      </label>
      <div className="flex flex-wrap gap-2">
        {serviceOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleService(option)}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${filters.serviceTypes.includes(option) ? 'bg-primary text-white' : 'bg-white text-slate-500'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
