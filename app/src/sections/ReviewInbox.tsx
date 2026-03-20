import { useState } from 'react';
import { 
  Filter, 
  Search, 
  Star, 
  MessageSquare, 
  User,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { mockReviews } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Priority, Platform, Sentiment, Review } from '@/types';

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

const sentimentColors: Record<Sentiment, string> = {
  positive: 'text-green-600 bg-green-50',
  neutral: 'text-slate-600 bg-slate-50',
  negative: 'text-red-600 bg-red-50',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface ReviewInboxProps {
  onSelectReview: (review: Review) => void;
  selectedReviewId?: string;
}

export function ReviewInbox({ onSelectReview, selectedReviewId }: ReviewInboxProps) {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReviews = mockReviews.filter(review => {
    if (filterPlatform !== 'all' && review.platform !== filterPlatform) return false;
    if (filterSentiment !== 'all' && review.sentiment !== filterSentiment) return false;
    if (searchQuery && !review.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !review.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <Card className="h-full rounded-2xl border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Review Inbox
            <Badge variant="secondary" className="ml-2">{filteredReviews.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
          <select 
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="shopee">Shopee</option>
            <option value="google">Google</option>
          </select>
          <select 
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
          >
            <option value="all">All Sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              onClick={() => onSelectReview(review)}
              className={cn(
                'p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50',
                selectedReviewId === review.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox className="mt-1" />
                
                <img 
                  src={review.customerAvatar} 
                  alt={review.customerName}
                  className="w-10 h-10 rounded-full bg-slate-100"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">{review.customerName}</span>
                    <Badge className={cn('text-xs', platformColors[review.platform])}>
                      {platformNames[review.platform]}
                    </Badge>
                    <Badge className={cn('text-xs font-bold', priorityColors[review.priority])}>
                      {priorityLabels[review.priority]}
                    </Badge>
                    {review.suggestedReply && (
                      <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-3 h-3',
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-slate-200 text-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{formatTimeAgo(review.createdAt)}</span>
                    <Badge className={cn('text-xs capitalize', sentimentColors[review.sentiment])}>
                      {review.sentiment}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {review.content}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 capitalize">{review.topic}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-blue-600 font-medium">SLA: {review.sla}</span>
                    {review.assignedTo && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {review.assignedTo}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <ChevronRight className={cn(
                  'w-5 h-5 transition-colors',
                  selectedReviewId === review.id ? 'text-indigo-500' : 'text-slate-300'
                )} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
