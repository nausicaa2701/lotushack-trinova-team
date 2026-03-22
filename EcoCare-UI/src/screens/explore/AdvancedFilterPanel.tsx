import React from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import type { ExploreFilters } from './types';

interface Props {
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
}

const serviceOptions = ['ceramic', 'interior', 'express', 'eco'];

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const numberInputClass =
  'w-full rounded-xl border-none bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-primary/25';

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
        <span>Open Now</span>
        <Checkbox
          inputId="filter-open-now"
          checked={filters.openNow}
          onChange={(e) => onChange({ ...filters, openNow: Boolean(e.checked) })}
        />
      </label>
      <label className="flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>EV Safe</span>
        <Checkbox
          inputId="filter-ev-safe"
          checked={filters.evSafe}
          onChange={(e) => onChange({ ...filters, evSafe: Boolean(e.checked) })}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-600" htmlFor="filter-min-rating">
        <span>Min rating (3–5)</span>
        <InputNumber
          inputId="filter-min-rating"
          value={filters.minRating}
          onValueChange={(e) => {
            const raw = e.value;
            const n = typeof raw === 'number' ? raw : filters.minRating;
            onChange({ ...filters, minRating: clamp(n, 3, 5) });
          }}
          min={3}
          max={5}
          minFractionDigits={0}
          maxFractionDigits={1}
          step={0.1}
          useGrouping={false}
          showButtons
          className="w-full"
          inputClassName={numberInputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-600" htmlFor="filter-radius">
        <span>Radius (km) (1–15)</span>
        <InputNumber
          inputId="filter-radius"
          value={filters.radiusKm}
          onValueChange={(e) => {
            const raw = e.value;
            const n = typeof raw === 'number' ? raw : filters.radiusKm;
            onChange({ ...filters, radiusKm: Math.round(clamp(n, 1, 15)) });
          }}
          min={1}
          max={15}
          step={1}
          useGrouping={false}
          showButtons
          className="w-full"
          inputClassName={numberInputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-600" htmlFor="filter-detour">
        <span>Max detour (km) (1–8)</span>
        <InputNumber
          inputId="filter-detour"
          value={filters.maxDetourKm}
          onValueChange={(e) => {
            const raw = e.value;
            const n = typeof raw === 'number' ? raw : filters.maxDetourKm;
            onChange({ ...filters, maxDetourKm: Math.round(clamp(n, 1, 8)) });
          }}
          min={1}
          max={8}
          step={1}
          useGrouping={false}
          showButtons
          className="w-full"
          inputClassName={numberInputClass}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {serviceOptions.map((option) => {
          const on = filters.serviceTypes.includes(option);
          return (
            <Button
              key={option}
              type="button"
              size="small"
              label={option}
              onClick={() => toggleService(option)}
              text={!on}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase shadow-none ${
                on ? '!bg-primary !text-white' : '!bg-white !text-slate-500'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
