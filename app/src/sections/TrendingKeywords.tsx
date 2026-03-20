import { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trendingKeywords } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Sentiment, Platform } from '@/types';

type TimeFilter = '1d' | '7d' | '30d';

const sentimentConfig: Record<Sentiment, { bg: string; text: string; icon: string }> = {
  positive: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-500' },
  negative: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' },
};

const platformColors: Record<Platform, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-slate-100 text-slate-700',
  shopee: 'bg-orange-100 text-orange-700',
  google: 'bg-blue-100 text-blue-700',
};

export function TrendingKeywords() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Trending Keywords
          </CardTitle>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['1d', '7d', '30d'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
                  timeFilter === filter
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {filter === '1d' ? '24h' : filter === '7d' ? '7d' : '30d'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trendingKeywords.map((keyword, index) => {
            const config = sentimentConfig[keyword.sentiment];
            const trend = Math.random() > 0.5 ? 'up' : 'down';
            
            return (
              <div
                key={keyword.keyword}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
                  <span className={cn('text-lg font-bold', config.text)}>{index + 1}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{keyword.keyword}</span>
                    <span className={cn('text-xs', config.text)}>
                      ({keyword.count})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {keyword.platforms.map((platform) => (
                      <span
                        key={platform}
                        className={cn(
                          'w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold',
                          platformColors[platform]
                        )}
                      >
                        {platform[0].toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {trend === 'up' ? (
                    <ArrowUpRight className={cn('w-4 h-4', config.icon)} />
                  ) : (
                    <ArrowDownRight className={cn('w-4 h-4', config.icon)} />
                  )}
                  <span className={cn('text-xs font-medium', config.text)}>
                    {Math.floor(Math.random() * 30) + 5}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
