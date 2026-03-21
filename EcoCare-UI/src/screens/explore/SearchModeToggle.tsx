import React from 'react';
import type { SearchMode } from './types';

interface Props {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export const SearchModeToggle: React.FC<Props> = ({ mode, onChange }) => (
  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-container-low p-1">
    <button
      type="button"
      onClick={() => onChange('nearby')}
      className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide ${mode === 'nearby' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
    >
      Nearby
    </button>
    <button
      type="button"
      onClick={() => onChange('on-route')}
      className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide ${mode === 'on-route' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
    >
      On Route
    </button>
  </div>
);
