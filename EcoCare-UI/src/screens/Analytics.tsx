import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign, 
  Zap,
  BarChart,
  PieChart,
  Activity,
  ArrowUpRight,
  Droplets
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { fetchForecastSummary } from '../lib/forecastApi';

export const Analytics = () => {
  const navigate = useNavigate();
  const [forecastSummary, setForecastSummary] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchForecastSummary()
      .then((s) => {
        if (!cancelled) setForecastSummary(s);
      })
      .catch(() => {
        if (!cancelled) setForecastSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      revenue: '$124,850',
      activeUsers: 8422,
      avgWashTime: '18.5m',
      energyUsed: '14.2 MWh',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'washnet-admin-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Admin Analytics</h2>
          <p className="mt-1 text-slate-500">Real-time performance metrics for WashNet network operators.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <select className="rounded-xl border-none bg-surface-container-low px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Year to Date</option>
          </select>
          <button type="button" onClick={handleExportReport} className="rounded-xl px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 power-gradient">
            Export Report
          </button>
        </div>
      </header>

      {forecastSummary && Object.keys(forecastSummary).length > 0 ? (
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <h3 className="font-headline text-lg font-bold text-on-surface">Demand forecast (summary)</h3>
          <p className="mt-1 text-sm text-slate-500">Zone-level demand signals from the forecasting service.</p>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            {typeof forecastSummary.forecastStats === 'object' && forecastSummary.forecastStats != null ? (
              <>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Rows</dt>
                  <dd className="font-headline text-xl font-extrabold">
                    {String((forecastSummary.forecastStats as { rowCount?: number }).rowCount ?? '—')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Avg demand</dt>
                  <dd className="font-headline text-xl font-extrabold">
                    {Number((forecastSummary.forecastStats as { avgPredictedDemand?: number }).avgPredictedDemand ?? 0).toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Zones tracked</dt>
                  <dd className="font-headline text-xl font-extrabold">
                    {Array.isArray(forecastSummary.topZones) ? forecastSummary.topZones.length : '—'}
                  </dd>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Forecast data is loading or unavailable.</p>
            )}
          </dl>
        </section>
      ) : null}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign} 
          label="Total Revenue" 
          value="$124,850" 
          trend="+12.5%" 
          isPositive={true} 
          color="primary"
        />
        <StatCard 
          icon={Users} 
          label="Active Users" 
          value="8,422" 
          trend="+5.2%" 
          isPositive={true} 
          color="secondary"
        />
        <StatCard 
          icon={Clock} 
          label="Avg. Wash Time" 
          value="18.5m" 
          trend="-2.1%" 
          isPositive={true} 
          color="tertiary"
        />
        <StatCard 
          icon={Zap} 
          label="Energy Used" 
          value="14.2 MWh" 
          trend="+8.4%" 
          isPositive={false} 
          color="primary"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="col-span-12 rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm sm:p-8 lg:col-span-8">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-headline text-xl font-bold">Revenue Growth</h4>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400">Daily earnings vs target</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs font-bold text-slate-500">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span className="text-xs font-bold text-slate-500">Target</span>
              </div>
            </div>
          </div>
          
          <div className="-mx-1 overflow-x-auto pb-2 sm:mx-0 md:overflow-visible">
            <div className="flex h-56 min-w-[520px] items-end justify-between gap-1.5 sm:h-64 sm:min-w-0 sm:gap-2 md:w-full">
            {[40, 65, 45, 90, 75, 55, 85, 60, 95, 70, 50, 80].map((h, i) => (
              <div key={i} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.8 }}
                    className="absolute bottom-0 left-0 right-0 power-gradient rounded-t-lg group-hover:opacity-80 transition-opacity"
                  ></motion.div>
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Lane Occupancy */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10">
            <h4 className="font-headline text-xl font-bold mb-6">Live Lane Status</h4>
            <div className="space-y-4">
              <LaneStatus lane="01" status="Occupied" time="12m left" type="Premium" />
              <LaneStatus lane="02" status="Available" time="Ready" type="N/A" isAvailable />
              <LaneStatus lane="03" status="Maintenance" time="2h left" type="Repair" isMaintenance />
              <LaneStatus lane="04" status="Occupied" time="4m left" type="Basic" />
            </div>
            <button type="button" onClick={() => navigate('/admin/merchants')} className="w-full mt-6 py-3 rounded-xl bg-surface-container-low text-slate-600 font-bold text-sm hover:bg-surface-container-high transition-colors">
              Manage All Lanes
            </button>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <Activity className="absolute -right-6 -bottom-6 text-white/10 w-32 h-32" />
            <h4 className="font-headline text-lg font-bold mb-2">Network Health</h4>
            <div className="flex items-center gap-2 text-tertiary-fixed mb-6">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping"></div>
              <span className="text-xs font-bold uppercase tracking-widest">All Systems Nominal</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white/60">Server Load</span>
                <span>24%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed w-[24%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eco Metrics */}
      <section className="rounded-[2rem] border border-tertiary/10 bg-tertiary-container/20 p-6 sm:p-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center">
          <div className="w-12 h-12 rounded-2xl bg-tertiary flex items-center justify-center text-white">
            <Droplets size={24} />
          </div>
          <div>
            <h4 className="font-headline text-xl font-extrabold text-tertiary sm:text-2xl">Sustainability Dashboard</h4>
            <p className="text-tertiary/70 font-medium">Network-wide environmental impact tracking</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-tertiary/60">Water Recycled</p>
            <p className="font-headline text-4xl font-extrabold text-tertiary sm:text-5xl">84.2%</p>
            <p className="text-xs text-tertiary/80 leading-relaxed">Average across 34 stations this month. Target: 90%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-tertiary/60">Renewable Energy</p>
            <p className="font-headline text-4xl font-extrabold text-tertiary sm:text-5xl">100%</p>
            <p className="text-xs text-tertiary/80 leading-relaxed">All stations powered by certified solar and wind offsets.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-tertiary/60">Plastic Reduced</p>
            <p className="font-headline text-4xl font-extrabold text-tertiary sm:text-5xl">1.2t</p>
            <p className="text-xs text-tertiary/80 leading-relaxed">Through bulk chemical delivery and refillable containers.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, isPositive, color }: any) => {
  const colorClasses: any = {
    primary: "bg-primary-container/20 text-primary",
    secondary: "bg-secondary-container/30 text-on-secondary-container",
    tertiary: "bg-tertiary-container/30 text-tertiary"
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses[color])}>
          <Icon size={20} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
          isPositive ? "bg-tertiary-fixed/30 text-tertiary" : "bg-red-100 text-red-600"
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-headline font-extrabold text-on-surface">{value}</p>
      </div>
    </div>
  );
};

const LaneStatus = ({ lane, status, time, type, isAvailable, isMaintenance }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all">
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
        isAvailable ? "bg-tertiary-fixed text-on-tertiary-fixed" : 
        isMaintenance ? "bg-slate-200 text-slate-500" : 
        "bg-primary-container text-primary"
      )}>
        {lane}
      </div>
      <div>
        <p className="font-bold text-sm">{status}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{type}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs font-bold text-slate-700">{time}</p>
      <ArrowUpRight size={14} className="text-slate-300 ml-auto mt-1" />
    </div>
  </div>
);
