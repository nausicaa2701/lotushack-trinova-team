import React from 'react';
import { Button } from 'primereact/button';
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
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant/20">
        <div className="flex items-center justify-between p-3">
          <div className="flex gap-2">
            <Button
              type="button"
              text={mode !== 'nearby'}
              label="Nearby"
              onClick={() => onModeChange('nearby')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-none shadow-none ${
                mode === 'nearby'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low text-slate-600'
              }`}
            />
            <Button
              type="button"
              text={mode !== 'on-route'}
              label="On Route"
              onClick={() => onModeChange('on-route')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-none shadow-none ${
                mode === 'on-route'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low text-slate-600'
              }`}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              text
              rounded
              onClick={onLocationClick}
              title="Use current location"
              className="p-2 rounded-full bg-surface-container-low text-slate-600 transition-colors hover:bg-surface-container-high border-none shadow-none"
              aria-label="Use current location"
            >
              <Locate size={20} />
            </Button>
            <Button
              type="button"
              text
              rounded
              onClick={onFiltersClick}
              className="p-2 rounded-full bg-surface-container-low text-slate-600 active:bg-surface-container-high border-none shadow-none"
              aria-label="Filters"
            >
              <SlidersHorizontal size={20} />
            </Button>
          </div>
        </div>

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
