import React from 'react';
import { MapPin, Star } from 'lucide-react';
import type { Merchant } from './types';

interface Props {
  merchant: Merchant;
  selected: boolean;
  onSelect: () => void;
  onBook: () => void;
}

export const MerchantCard: React.FC<Props> = ({ merchant, selected, onSelect, onBook }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onSelect}
    onKeyDown={(evt) => evt.key === 'Enter' && onSelect()}
    className={`rounded-3xl border p-5 shadow-sm transition ${selected ? 'border-primary bg-primary-container/10' : 'border-outline-variant/20 bg-surface-container-lowest'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <h4 className="font-headline text-lg font-bold">{merchant.name}</h4>
      <div className="flex items-center gap-1 text-primary">
        <Star size={14} className="fill-primary" />
        <span className="font-bold">{merchant.rating.toFixed(1)}</span>
      </div>
    </div>
    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
      <MapPin size={12} />
      <span>{merchant.distanceFromRouteKm?.toFixed(1) ?? '0.0'} km</span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {merchant.reasonTags.map((tag) => (
        <span key={tag} className="rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          {tag}
        </span>
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between">
      <p className="font-bold text-slate-700">${merchant.priceFrom}</p>
      <button type="button" onClick={onBook} className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
        Book
      </button>
    </div>
  </div>
);
