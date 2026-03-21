import React from 'react';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 px-4 font-sans text-sm glass-effect sm:gap-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-center rounded-full bg-surface-container-low px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20 sm:px-4 sm:py-2.5 md:max-w-md lg:max-w-xl">
          <Search size={18} className="mr-2 shrink-0 text-slate-400" />
          <input
            className="w-full min-w-0 border-none bg-transparent text-sm outline-none placeholder:text-slate-400 focus:ring-0"
            placeholder="Search services or vehicles..."
            type="search"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="relative text-slate-500 transition-colors hover:text-primary"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>
          <button
            type="button"
            className="hidden text-slate-500 transition-colors hover:text-primary sm:block"
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <button
          type="button"
          className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
        >
          <div className="hidden text-right sm:block">
            <p className="mb-1 font-headline text-xs font-bold leading-none">Alex Rivera</p>
            <p className="text-[10px] leading-none text-slate-500">Model S Plaid</p>
          </div>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow-sm sm:h-10 sm:w-10">
            <img
              alt="User Avatar"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk1EDQ05LTK150eWybllRKFWJnlzJMY-RpTeVvq-RMDWqeFhSgmOZwD2AjmltZVzE60jHVzltvxA11m0kaNEIesMtdTQ33kZ03tYmuazZuqkAC3jIzYlxFR0wFzFNpXpHY4B-b9t9iGfS3sP6fpUfffDbZyuawy0d3ojBrgmtYSONn-rUhqfMHkyVfKEuf_r4FdzMY4kAnPMPB51lDPE5hBEDH_vgBdSpMOzFqYYNuaNh7zrDucCmul_s4j_GzfkGfBN0gJ8bZaTxX"
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
      </div>
    </header>
  );
};
