import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map as MapIcon, 
  Car, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut,
  Droplets
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CalendarDays, label: 'Bookings', path: '/bookings' },
  { icon: MapIcon, label: 'Explore', path: '/explore' },
  { icon: Car, label: 'Vehicles', path: '/vehicles' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ open = false, onClose }: SidebarProps) => {
  const linkClose = () => onClose?.();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen h-dvh w-64 flex-col border-r border-slate-200/50 bg-slate-50 p-4 transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="mb-8 flex items-center gap-3 px-2 sm:mb-10 sm:px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl power-gradient text-white shadow-lg">
          <Droplets size={24} fill="currentColor" />
        </div>
        <div className="min-w-0">
          <h1 className="font-headline text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">WashNet</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Precision Fluidity</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={linkClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-r-4 border-primary bg-white font-bold text-primary shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <item.icon size={20} className="shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-200/50 pt-4 sm:pt-6">
        <button
          type="button"
          className="mb-4 w-full rounded-full py-3.5 font-bold text-white shadow-xl shadow-primary/20 power-gradient transition-transform active:scale-95 sm:mb-6 sm:py-4"
        >
          Start Wash
        </button>
        <NavLink
          to="/settings"
          onClick={linkClose}
          className="flex items-center gap-3 px-4 py-3 font-headline text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <NavLink
          to="/support"
          onClick={linkClose}
          className="flex items-center gap-3 px-4 py-3 font-headline text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <HelpCircle size={20} />
          <span>Support</span>
        </NavLink>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 font-headline text-sm font-medium text-slate-500 transition-colors hover:text-error"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
