import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
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
    <InputNumber
      value={value}
      onValueChange={(e) => onChange(Number(e.value ?? 0))}
      minFractionDigits={3}
      maxFractionDigits={6}
      step={0.001}
      className="w-full"
      inputClassName="rounded-xl border-none bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-full"
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
      <Button
        type="button"
        text
        label="Use Current"
        onClick={onUseCurrentLocation}
        title="Set origin from your device location (requires permission)"
        className="rounded-md px-2 py-1 text-xs font-bold text-primary underline-offset-2 hover:bg-primary/10 hover:underline border-none shadow-none"
      />
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
