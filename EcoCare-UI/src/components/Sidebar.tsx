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
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Bookings', path: '/bookings' },
  { icon: MapIcon, label: 'Explore', path: '/explore' },
  { icon: Car, label: 'Vehicles', path: '/vehicles' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200/50 flex flex-col p-4 z-50">
      <div className="mb-10 px-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl power-gradient flex items-center justify-center text-white shadow-lg">
          <Droplets size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-headline leading-tight">WashConnect</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Precision Fluidity</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-headline text-sm font-medium",
              isActive 
                ? "bg-white text-primary shadow-sm font-bold border-r-4 border-primary" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200/50 space-y-1">
        <button className="w-full power-gradient text-white font-bold py-4 rounded-full mb-6 shadow-xl shadow-primary/20 active:scale-95 transition-transform">
          Start Wash
        </button>
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 transition-colors font-headline text-sm font-medium"
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <NavLink
          to="/support"
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 transition-colors font-headline text-sm font-medium"
        >
          <HelpCircle size={20} />
          <span>Support</span>
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-error transition-colors font-headline text-sm font-medium">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
