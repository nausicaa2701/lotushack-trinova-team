import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformStats, overallRating } from '@/data/mockData';
import type { Platform } from '@/types';
import { cn } from '@/lib/utils';

const platformColors: Record<Platform, string> = {
  facebook: 'bg-blue-600',
  tiktok: 'bg-slate-900',
  shopee: 'bg-orange-500',
  google: 'bg-blue-500',
};

const platformNames: Record<Platform, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  shopee: 'Shopee',
  google: 'Google Maps',
};

export function RatingSummary() {
  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Rating by Platform
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
            <div className="flex-1">
              <p className="text-sm opacity-80">Overall Rating</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{overallRating.average.toFixed(1)}</span>
                <span className="text-lg opacity-80">/ 5.0</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm opacity-80">{overallRating.totalReviews.toLocaleString()} reviews</span>
                <span className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/20',
                  overallRating.trend >= 0 ? 'text-green-300' : 'text-red-300'
                )}>
                  {overallRating.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {overallRating.trend >= 0 ? '+' : ''}{overallRating.trend}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-6 h-6',
                    star <= Math.round(overallRating.average)
                      ? 'fill-yellow-300 text-yellow-300'
                      : 'fill-white/20 text-white/20'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-3">
            {platformStats.map((platform) => (
              <div key={platform.platform} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                  platformColors[platform.platform]
                )}>
                  {platformNames[platform.platform][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {platformNames[platform.platform]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {platform.rating.toFixed(1)}
                      </span>
                      <span className={cn(
                        'text-xs flex items-center',
                        platform.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {platform.trend >= 0 ? '+' : ''}{platform.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', platformColors[platform.platform])}
                        style={{ width: `${(platform.rating / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {platform.reviewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
