import React from 'react';
import { Star, MapPinned, Zap, Clock } from 'lucide-react';
import type { Merchant } from './types';

interface MobileMerchantCardProps {
  merchant: Merchant;
  isSelected: boolean;
  onSelect: () => void;
  onBook: () => void;
}

export const MobileMerchantCard: React.FC<MobileMerchantCardProps> = ({
  merchant,
  isSelected,
  onSelect,
  onBook,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-primary shadow-lg scale-[1.02]'
          : 'border-outline-variant/20 shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* Card Header with Image Placeholder */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPinned size={48} className="text-primary/40" />
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {merchant.openNow && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Clock size={10} />
              Open
            </span>
          )}
          {merchant.evSafe && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Zap size={10} />
              EV Safe
            </span>
          )}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Name & Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
            {merchant.name}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="font-bold text-sm text-slate-900">
              {merchant.rating.toFixed(1)}
            </span>
          </div>
        </div>
        
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPinned size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600 line-clamp-2">
            {merchant.address}
          </p>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{merchant.distanceKm?.toFixed(1)} km</span>
            <span>away</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{merchant.detourMin} min</span>
            <span>detour</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-primary">${merchant.priceFrom}</span>
            <span>from</span>
          </div>
        </div>
        
        {/* Service Tags */}
        {merchant.serviceTypes && merchant.serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {merchant.serviceTypes.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-surface-container-low text-slate-600 text-xs rounded-md"
              >
                {service}
              </span>
            ))}
            {merchant.serviceTypes.length > 3 && (
              <span className="px-2 py-1 bg-surface-container-low text-slate-400 text-xs rounded-md">
                +{merchant.serviceTypes.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl active:bg-primary/90 transition-colors"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};
