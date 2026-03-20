import { Star, MessageSquare, AlertTriangle, Clock, TrendingUp, TrendingDown, ThumbsDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  icon: React.ElementType;
  iconColor: string;
  sparkline?: number[];
}

function KPICard({ title, value, subtext, trend, icon: Icon, iconColor, sparkline }: KPICardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 rounded-2xl border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{title}</p>
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-slate-400">{subtext}</p>
        </div>

        {/* Sparkline */}
        {sparkline && (
          <div className="mt-3 h-8 flex items-end gap-0.5">
            {sparkline.map((value, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-sm transition-all duration-300',
                  trend && trend >= 0 ? 'bg-green-200' : 'bg-slate-200'
                )}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICards() {
  const kpis = [
    {
      title: 'Average Rating',
      value: '4.2',
      subtext: '+0.3 vs last 7 days',
      trend: 7.7,
      icon: Star,
      iconColor: 'bg-yellow-500',
      sparkline: [60, 65, 70, 68, 75, 80, 82],
    },
    {
      title: 'New Reviews',
      value: '+128',
      subtext: 'in last 24 hours',
      trend: 12,
      icon: MessageSquare,
      iconColor: 'bg-indigo-500',
      sparkline: [40, 55, 50, 65, 70, 85, 90],
    },
    {
      title: 'Urgent Cases',
      value: '18',
      subtext: 'P1/P2 cases pending',
      trend: -5,
      icon: AlertTriangle,
      iconColor: 'bg-red-500',
      sparkline: [80, 75, 70, 65, 60, 55, 50],
    },
    {
      title: 'Response Rate',
      value: '94%',
      subtext: 'of reviews replied',
      trend: 3,
      icon: Clock,
      iconColor: 'bg-green-500',
      sparkline: [85, 87, 88, 90, 91, 93, 94],
    },
    {
      title: 'Avg Response Time',
      value: '2.4h',
      subtext: 'target: < 4 hours',
      trend: -15,
      icon: TrendingUp,
      iconColor: 'bg-blue-500',
      sparkline: [90, 85, 80, 75, 70, 65, 60],
    },
    {
      title: 'Negative Ratio',
      value: '8.2%',
      subtext: 'of total reviews',
      trend: -2,
      icon: ThumbsDown,
      iconColor: 'bg-orange-500',
      sparkline: [15, 14, 13, 12, 11, 10, 8],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
