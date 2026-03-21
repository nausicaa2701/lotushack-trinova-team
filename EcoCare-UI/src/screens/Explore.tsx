import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Star, Search, Filter, Navigation, Plus, Minus, Zap, Droplets, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Explore = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-160px)] relative bg-surface-container-low rounded-[2rem] overflow-hidden"
    >
      {/* Map Background Placeholder */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Detailed minimalist city map" 
          className="w-full h-full object-cover grayscale opacity-40" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV7ayU4CSgHpKcuDVB4RH52H1anE8aX0E2WunP78Q5kQhCWjtf8g2epjcJqr_qVFs2nlipvQSagM3xPfHzB_ofawandjvhybSp9KI5U-eQVir_t2vsKNnRiR83-kw1i_1sti5wv_PS8eLeXup45EI3YaQzyUyGzOoBpcaTq0vgOvRGhnLy_Ma71T5WRlN-jJg2AJFMsfqLyQJk473a4tY6yicQ2zlxOOBVWqGNcUhQHtOOFAgiC9FgSKZnLEI26PBuKp5lDGYZJAot"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none"></div>
        
        {/* Custom Pins */}
        <div className="absolute top-[30%] left-[45%] group cursor-pointer">
          <div className="relative">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 border-4 border-white animate-pulse">
              <Droplets size={24} fill="currentColor" />
            </div>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap text-xs font-bold border border-slate-100">
              EcoGloss Elite • 0.8mi
            </div>
          </div>
        </div>

        <div className="absolute top-[55%] left-[60%] group cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white">
            <Zap size={20} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Floating UI Elements */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <button className="bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-white/50 flex items-center gap-2 text-sm font-semibold text-slate-700 hover:bg-white transition-all">
          <Search size={16} className="text-primary" />
          Search this area
        </button>
      </div>

      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-2">
        <button className="w-12 h-12 glass-effect flex items-center justify-center rounded-xl shadow-md text-slate-700 hover:text-primary transition-colors">
          <Navigation size={20} />
        </button>
        <div className="flex flex-col glass-effect rounded-xl shadow-md overflow-hidden divide-y divide-slate-200/50">
          <button className="w-12 h-12 flex items-center justify-center text-slate-700 hover:text-primary transition-colors">
            <Plus size={20} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-700 hover:text-primary transition-colors">
            <Minus size={20} />
          </button>
        </div>
      </div>

      {/* Filter Chips Overlay */}
      <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
        <button className="bg-primary text-white flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg font-medium text-sm">
          <Filter size={18} />
          Filters
        </button>
        <div className="flex flex-col gap-2">
          {['EV Specialist', 'Fast Lane', 'Ceramic Coat'].map(filter => (
            <button key={filter} className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-slate-700 hover:bg-white flex items-center justify-between group w-40">
              <span>{filter}</span>
              <CheckCircle2 size={14} className="text-tertiary opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      {/* Selected Station Card Carousel */}
      <div className="absolute bottom-8 left-8 right-32 z-20 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 w-max">
          <div className="w-[420px] bg-white rounded-3xl p-5 shadow-2xl flex gap-5 border border-white relative overflow-hidden">
            <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 relative">
              <img 
                alt="EcoGloss Elite" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4dnM83JpQZXhxEWNWquZBkmYvwcKtO9Os-yseBTe6bTf4eXIvyHqOwMOgU3saMRbVdWH8yJRgqXYe9vzSDUwqY-d__eoqgBrLxaQSW-tbbeCoxT-LUPsD3y-aBbsdWsUf4LOdv3LUY_FEEJk8sqjoGfMV9BpQzPMew67BDtyN0y3BUfGPGiXOaR93Grf3Etr__HlAtZIhDIcgvLBzXOS45pDe1eNsm31a5vpI9wCX7spR52uv6bk9CQ5i-_6gVPyiLL-QfGl9VLjl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-0.5 rounded-sm">ECO-CERTIFIED</div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">EcoGloss Elite</h3>
                  <div className="flex items-center gap-1 text-primary">
                    <Star size={14} className="fill-primary" />
                    <span className="font-bold">4.9</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin size={12} />
                  1422 Marina Blvd, San Francisco
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-medium text-slate-600">EV Ceramic</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-medium text-slate-600">Interior Detail</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-slate-900">
                  <span className="text-xs text-slate-400">Starts at</span>
                  <div className="font-bold text-lg leading-none">$45.00</div>
                </div>
                <button className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 transition-transform">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
