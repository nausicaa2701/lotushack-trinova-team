import React from 'react';
import { SelectButton } from 'primereact/selectbutton';
import type { SearchMode } from './types';

interface Props {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

const modeOptions: { label: string; value: SearchMode }[] = [
  { label: 'Nearby', value: 'nearby' },
  { label: 'On Route', value: 'on-route' },
];

export const SearchModeToggle: React.FC<Props> = ({ mode, onChange }) => (
  <SelectButton
    value={mode}
    options={modeOptions}
    optionLabel="label"
    optionValue="value"
    onChange={(e) => {
      const v = e.value as SearchMode | null;
      if (v) onChange(v);
    }}
    className="grid w-full grid-cols-2 gap-0 rounded-2xl bg-surface-container-low p-1 [&_.p-button]:flex-1 [&_.p-button]:rounded-xl [&_.p-button]:border-none [&_.p-button]:px-3 [&_.p-button]:py-2 [&_.p-button]:text-xs [&_.p-button]:font-bold [&_.p-button]:uppercase [&_.p-button]:tracking-wide"
  />
);
