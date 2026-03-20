import { Clock, MessageSquare, ArrowRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockReviews } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Priority, Platform, Review } from '@/types';

const priorityColors: Record<Priority, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-slate-900',
  low: 'bg-slate-400 text-white',
};

const priorityLabels: Record<Priority, string> = {
  critical: 'P1',
  high: 'P2',
  medium: 'P3',
  low: 'P4',
};

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
  google: 'Google',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface UrgentQueueProps {
  onSelectReview: (review: Review) => void;
}

export function UrgentQueue({ onSelectReview }: UrgentQueueProps) {
  const urgentReviews = mockReviews
    .filter(r => r.priority !== 'low' && r.status !== 'resolved')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Urgent Review Feed
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {urgentReviews.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {urgentReviews.map((review) => (
            <div
              key={review.id}
              onClick={() => onSelectReview(review)}
              className="group flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all duration-200"
            >
              <Badge className={cn('text-xs font-bold flex-shrink-0', priorityColors[review.priority])}>
                {priorityLabels[review.priority]}
              </Badge>
              
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0', platformColors[review.platform])}>
                {platformNames[review.platform][0]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {review.customerName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {review.content.substring(0, 50)}...
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{formatTimeAgo(review.createdAt)}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-indigo-600 font-medium">SLA: {review.sla}</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-8"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Reply
              </Button>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" className="w-full mt-3 text-sm text-slate-600 hover:text-slate-900 rounded-xl">
          View all urgent cases
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
