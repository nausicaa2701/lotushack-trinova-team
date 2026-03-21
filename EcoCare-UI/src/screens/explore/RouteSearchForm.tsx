import React from 'react';
import type { LatLng, SearchMode } from './types';

interface Props {
  mode: SearchMode;
  origin: LatLng;
  destination: LatLng;
  onOriginChange: (value: LatLng) => void;
  onDestinationChange: (value: LatLng) => void;
  onUseCurrentLocation: () => void;
}

const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <input
      type="number"
      value={value}
      step={0.001}
      onChange={(evt) => onChange(Number(evt.target.value))}
      className="rounded-xl border-none bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
    />
  </label>
);

export const RouteSearchForm: React.FC<Props> = ({
  mode,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onUseCurrentLocation,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-slate-500">Search Input</h3>
      <button type="button" onClick={onUseCurrentLocation} className="text-xs font-bold text-primary">
        Use Current
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <NumberInput label="Origin Lat" value={origin.lat} onChange={(lat) => onOriginChange({ ...origin, lat })} />
      <NumberInput label="Origin Lng" value={origin.lng} onChange={(lng) => onOriginChange({ ...origin, lng })} />
    </div>
    {mode === 'on-route' && (
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="Destination Lat" value={destination.lat} onChange={(lat) => onDestinationChange({ ...destination, lat })} />
        <NumberInput label="Destination Lng" value={destination.lng} onChange={(lng) => onDestinationChange({ ...destination, lng })} />
      </div>
    )}
  </div>
);
