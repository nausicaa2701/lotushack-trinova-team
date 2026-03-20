import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reviewVolumes } from '@/data/mockData';
import { cn } from '@/lib/utils';

const periodLabels: Record<string, string> = {
  '24h': '24h',
  '7d': '7 days',
  '30d': '30 days',
};

export function ReviewVolume() {
  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Review Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {reviewVolumes.map((volume) => (
            <div key={volume.period} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {volume.count}
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {periodLabels[volume.period]}
              </div>
              <div className={cn(
                'flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                volume.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {volume.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {volume.change >= 0 ? '+' : ''}{volume.change}%
              </div>
            </div>
          ))}
        </div>
        
        {/* Mini Chart */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-end gap-1 h-16">
            {[45, 52, 48, 61, 55, 67, 72, 68, 75, 82, 78, 85].map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-indigo-200 rounded-t hover:bg-indigo-300 transition-colors"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>12 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
