import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-8 h-16 w-full glass-effect border-none font-sans text-sm">
      <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-full w-96 transition-all focus-within:ring-2 focus-within:ring-primary/20">
        <Search size={18} className="text-slate-400 mr-2" />
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none" 
          placeholder="Search services or vehicles..." 
          type="text"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-primary transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="text-slate-500 hover:text-primary transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold font-headline leading-none mb-1">Alex Rivera</p>
            <p className="text-[10px] text-slate-500 leading-none">Model S Plaid</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow-sm">
            <img 
              alt="User Avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk1EDQ05LTK150eWybllRKFWJnlzJMY-RpTeVvq-RMDWqeFhSgmOZwD2AjmltZVzE60jHVzltvxA11m0kaNEIesMtdTQ33kZ03tYmuazZuqkAC3jIzYlxFR0wFzFNpXpHY4B-b9t9iGfS3sP6fpUfffDbZyuawy0d3ojBrgmtYSONn-rUhqfMHkyVfKEuf_r4FdzMY4kAnPMPB51lDPE5hBEDH_vgBdSpMOzFqYYNuaNh7zrDucCmul_s4j_GzfkGfBN0gJ8bZaTxX"
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
      </div>
    </header>
  );
};
