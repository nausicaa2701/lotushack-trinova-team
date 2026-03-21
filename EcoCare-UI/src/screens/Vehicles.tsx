import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Droplets, 
  Calendar, 
  CreditCard, 
  History, 
  ShieldCheck, 
  Headset as SupportAgent, 
  LogOut,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Lock,
  MapPin
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Vehicles = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header>
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Vehicles & Impact</h2>
        <p className="mt-1 text-slate-500">Manage your EV profile and monitor your sustainability contribution.</p>
      </header>

      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        {/* Main Profile Card */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="group relative overflow-hidden rounded-[2rem] border border-transparent bg-surface-container-lowest p-5 shadow-sm transition-all duration-500 hover:border-primary/10 sm:p-8">
            <div className="absolute right-0 top-0 p-4 sm:p-8">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-1/2 relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
                <img 
                  alt="Tesla Model 3" 
                  className="relative z-10 w-full object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgzzi6jHn-ElmE3sx2DEur1zzBxqBPnSWyMS93z0w2rv-Nn3GfMgMPCxIBz5tq4n6drSOnYxr39sHx-fVSu-oApHVsuQ9T4NU5oubS5XHdQv8jC5ErIqOspLVtVjx-gULS4XkEhcT2oOFkBA2sOTX27P8MnhwqzX0sQwLKBfXDdaM-EXF53Ojg6WdNet8BIeQf9Lb-dI2Dm5C7bTHnALp7ZXfm4KjR0bKZmdGB_mIAqJP_MUIG0-1IF3bWeRlkpGDI7pX57jrF1Tdf"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <h3 className="font-headline text-2xl font-extrabold text-on-surface sm:text-3xl md:text-4xl">Tesla Model 3</h3>
                  <p className="text-slate-500 font-medium tracking-wide mt-1">Dual Motor Long Range • Midnight Silver</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low rounded-2xl p-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Mileage</p>
                    <p className="text-xl font-headline font-bold text-on-surface">12,482 mi</p>
                  </div>
                  <div className="bg-surface-container-low rounded-2xl p-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Battery Health</p>
                    <p className="text-xl font-headline font-bold text-tertiary">98%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 bg-surface-container-highest/50 p-4 rounded-2xl">
                  <Calendar size={18} className="text-primary" />
                  <span>Next Service Due: <strong className="text-on-surface">Oct 14, 2024</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty & Eco Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-headline text-xl font-bold">Loyalty Points</h4>
                  <p className="text-slate-500 text-sm">Earned from eco-washes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                  <Sparkles size={24} fill="currentColor" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-headline font-extrabold text-on-surface">750</span>
                <span className="text-slate-500 font-medium">Total Points</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-3 mb-8">
                <div className="power-gradient h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="space-y-3">
                <RewardItem icon={Sparkles} title="Free Interior Clean" pts={500} />
                <RewardItem icon={Zap} title="Express Charging" pts={250} />
              </div>
            </div>

            <div className="eco-gradient rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-tertiary/20">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Droplets size={32} className="text-tertiary-fixed" fill="currentColor" />
                  <h4 className="font-headline text-xl font-bold">Eco Impact</h4>
                </div>
                <p className="text-white/80 text-sm leading-relaxed max-w-[200px]">Your commitment to eco-friendly washing has directly saved:</p>
              </div>
              <div className="relative z-10 mt-8">
                <p className="text-4xl font-extrabold mb-1">420L</p>
                <p className="text-lg font-bold text-tertiary-fixed uppercase tracking-wider">Pristine Water Saved</p>
                <div className="mt-6 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 w-fit">
                  <span className="text-xs font-bold">CO2 Offset: 12.4kg</span>
                  <TrendingUp size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Settings & Upcoming */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm">
            <h4 className="font-headline text-xl font-bold mb-6">Quick Settings</h4>
            <div className="space-y-4">
              <SettingsButton 
                icon={CreditCard} 
                title="Payment Methods" 
                subtitle="Apple Pay • Visa ...4292" 
                color="primary"
              />
              <SettingsButton 
                icon={History} 
                title="Service History" 
                subtitle="Last wash: 12 days ago" 
                color="secondary"
              />
              <SettingsButton 
                icon={ShieldCheck} 
                title="Privacy & Safety" 
                subtitle="Location sharing active" 
                color="tertiary"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm overflow-hidden relative border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-primary" size={20} />
              <h4 className="font-headline text-lg font-bold">Upcoming Wash</h4>
            </div>
            <div className="relative pl-6 border-l-2 border-primary-container">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest"></div>
              <p className="text-sm font-bold text-primary mb-1">Thursday, Sept 28</p>
              <p className="font-headline font-extrabold text-xl mb-4">Precision Eco-Steam</p>
              <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl mb-6">
                <MapPin size={14} className="text-slate-500" />
                <p className="text-xs font-medium">Bayside Professional Wash, SF</p>
              </div>
              <button type="button" onClick={() => navigate('/owner/bookings')} className="w-full bg-surface-container-high py-3 rounded-full text-xs font-bold hover:bg-surface-container-highest transition-colors">
                Reschedule or Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RewardItem = ({ icon: Icon, title, pts }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group cursor-pointer">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-tertiary" />
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <span className="text-xs font-bold text-primary px-2 py-1 bg-primary-container rounded-lg group-hover:scale-105 transition-transform">{pts} pts</span>
  </div>
);

const SettingsButton = ({ icon: Icon, title, subtitle, color }: any) => {
  const colorClasses: any = {
    primary: "bg-primary-container text-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container"
  };

  return (
    <button type="button" disabled title="Planned for post-MVP" className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest transition-all group border border-transparent opacity-70">
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", colorClasses[color])}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </button>
  );
};
