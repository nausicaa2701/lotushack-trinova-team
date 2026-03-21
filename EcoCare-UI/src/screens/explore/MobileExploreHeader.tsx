import React from 'react';
import { Locate, SlidersHorizontal, MapPinned } from 'lucide-react';
import type { SearchMode } from './types';

interface MobileExploreHeaderProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onFiltersClick: () => void;
  onLocationClick: () => void;
  loading: boolean;
  resultsCount: number;
}

export const MobileExploreHeader: React.FC<MobileExploreHeaderProps> = ({
  mode,
  onModeChange,
  onFiltersClick,
  onLocationClick,
  loading,
  resultsCount,
}) => {
  return (
    <div className="lg:hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant/20">
        {/* Search Mode Toggle */}
        <div className="flex items-center justify-between p-3">
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('nearby')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                mode === 'nearby'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low text-slate-600'
              }`}
            >
              Nearby
            </button>
            <button
              onClick={() => onModeChange('on-route')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                mode === 'on-route'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low text-slate-600'
              }`}
            >
              On Route
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onLocationClick}
              className="p-2 rounded-full bg-surface-container-low text-slate-600 active:bg-surface-container-high"
              aria-label="Use current location"
            >
              <Locate size={20} />
            </button>
            <button
              onClick={onFiltersClick}
              className="p-2 rounded-full bg-surface-container-low text-slate-600 active:bg-surface-container-high"
              aria-label="Filters"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>
        
        {/* Results Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  Searching...
                </span>
              ) : (
                <>
                  <MapPinned size={14} className="inline mr-1" />
                  <strong>{resultsCount}</strong> places found
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
