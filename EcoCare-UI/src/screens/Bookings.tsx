import React from 'react';
import { motion } from 'motion/react';
import { MapPin, CheckCircle2, Timer, Zap, Download, BatteryCharging as EvStation, Car, Droplets, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Bookings = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">My Bookings</h2>
          <p className="font-medium text-slate-500">Manage your ongoing and historical service sessions.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-tertiary-fixed px-4 py-2 font-bold text-xs text-on-tertiary-fixed">
          <CheckCircle2 size={16} fill="currentColor" />
          System Online
        </span>
      </div>

      {/* Active Booking Card */}
      <section>
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border-none bg-surface-container-lowest p-5 shadow-sm sm:p-6 md:flex-row md:items-center md:gap-8 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 power-gradient opacity-[0.03] blur-3xl -mr-20 -mt-20"></div>
          <div className="relative w-full md:w-1/3">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-low group">
              <img 
                alt="Car wash facility" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAteTMtMlzOjv7OXyVRX0QnZ6ABOwPm9Mwm_uGvFQh_3-9AiYJefck5p2kbXWk5vBgcaQrcX_r4VeMDYvQQn6r4DRUmcpX5n2oBs8n9_vQRjhgZuLLiil8-IpTe4T7fsWqLXksn7ky6cG0mifEgA7LjRkN29x56iNmqldvP-6ybg0c-KmH5LLZuszPBFAkGpBrPp07i1yR118vhIZxPKK12AYXl8OlbWgLXBE1jr3jWe0bMI2EuHhlXw_roIEEyiJpu4Xl5eqHWquYk"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">In Progress</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-headline text-xl font-bold sm:text-2xl">Sparkle Station West</h3>
                <p className="mt-1 flex items-center gap-2 text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="text-sm">Bay 04 • 1.2 miles away</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estimated Completion</p>
                <p className="font-headline text-xl font-extrabold text-primary">14:45</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500 uppercase tracking-tighter">Premium Eco-Shine Session</span>
                <span className="text-primary">75% Complete</span>
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden p-1">
                <div className="h-full power-gradient rounded-full w-3/4 shadow-[0_0_12px_rgba(0,91,193,0.3)]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1 rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Service Stage</p>
                <div className="flex items-center gap-2 text-on-surface font-semibold">
                  <Droplets size={16} className="text-tertiary" />
                  Osmosis Rinse
                </div>
              </div>
              <div className="flex-1 rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EV Status</p>
                <div className="flex items-center gap-2 text-on-surface font-semibold">
                  <Zap size={16} className="text-tertiary" />
                  Fast Charging Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent History */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-headline text-xl font-bold tracking-tight sm:text-2xl">Recent History</h2>
          <button type="button" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            Download All Receipts
            <Download size={16} />
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
          <div className="-mx-px overflow-x-auto overscroll-x-contain">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-6 bg-surface-container-low px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:px-8 sm:py-5">
                <div className="col-span-2">Service Center</div>
                <div>Date & Time</div>
                <div>Service Type</div>
                <div>Cost</div>
                <div className="text-right">Action</div>
              </div>
              <div className="divide-y divide-slate-100">
                <HistoryRow 
                  icon={EvStation}
                  name="VoltFlow Premium Hub"
                  location="Downtown District"
                  date="Oct 24, 2023"
                  time="10:15 AM"
                  type="Wash + EV Charge"
                  cost={42.50}
                />
                <HistoryRow 
                  icon={Car}
                  name="The Glass Finish"
                  location="Northside Plaza"
                  date="Oct 18, 2023"
                  time="02:40 PM"
                  type="Express Exterior"
                  cost={18.00}
                />
                <HistoryRow 
                  icon={Droplets}
                  name="Ocean Mist Auto Care"
                  location="Marina Bay"
                  date="Oct 12, 2023"
                  time="09:00 AM"
                  type="Eco-Friendly Deep Clean"
                  cost={55.00}
                  isEco
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button className="px-8 py-3 bg-surface-container-high text-slate-600 rounded-full text-sm font-bold hover:bg-surface-variant transition-colors">
            View More History
          </button>
        </div>
      </section>

      {/* Bottom Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-full flex items-center justify-center">
              <Droplets size={20} className="text-on-tertiary-fixed" />
            </div>
            <h4 className="font-headline font-bold">Eco Impact</h4>
          </div>
          <p className="text-3xl font-extrabold font-headline">128L <span className="text-sm font-medium text-slate-400">saved</span></p>
          <p className="text-xs text-slate-500 leading-relaxed">Through our recycled water systems, you've saved enough water to fill two bathtubs this month.</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h4 className="font-headline font-bold">Rewards Progress</h4>
          </div>
          <p className="text-3xl font-extrabold font-headline">850 <span className="text-sm font-medium text-slate-400">points</span></p>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[85%]"></div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Only 150 points until your next Free Premium Wash voucher.</p>
        </div>

        <div className="power-gradient p-6 rounded-3xl shadow-lg text-white space-y-4 relative overflow-hidden group">
          <Sparkles className="absolute -right-4 -bottom-4 text-[120px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h4 className="font-headline font-bold">Premium Perk</h4>
          </div>
          <p className="text-xl font-bold font-headline leading-tight">Monthly Subscription: Platinum Plus</p>
          <p className="text-xs text-white/80 leading-relaxed">Enjoy unlimited exterior washes and 20% off all fast-charging sessions at partner stations.</p>
          <button className="bg-white text-primary px-4 py-2 rounded-full text-xs font-bold w-fit">Manage Plan</button>
        </div>
      </section>
    </motion.div>
  );
};

const HistoryRow = ({ icon: Icon, name, location, date, time, type, cost, isEco }: any) => (
  <div className="group grid grid-cols-6 items-center px-4 py-5 transition-colors hover:bg-surface-container-low sm:px-8 sm:py-6">
    <div className="col-span-2 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-bold font-headline">{name}</p>
        <p className="text-xs text-slate-400">{location}</p>
      </div>
    </div>
    <div className="text-sm">
      <p className="font-semibold">{date}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
    <div className="text-sm">
      <span className={cn(
        "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
        isEco ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary-container text-on-secondary-container"
      )}>
        {type}
      </span>
    </div>
    <div className="text-sm font-extrabold font-headline">
      ${cost.toFixed(2)}
    </div>
    <div className="text-right">
      <button className="px-5 py-2 rounded-full border border-outline-variant hover:border-primary hover:text-primary font-bold text-xs transition-all">
        Re-book
      </button>
    </div>
  </div>
);
