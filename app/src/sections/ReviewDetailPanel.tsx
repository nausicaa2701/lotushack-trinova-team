import { useState } from 'react';
import { 
  X, 
  Star, 
  ExternalLink, 
  Sparkles, 
  MessageSquare, 
  Send, 
  User, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Review, Platform, Priority, Sentiment } from '@/types';

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

const priorityColors: Record<Priority, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-slate-900',
  low: 'bg-slate-400 text-white',
};

const sentimentColors: Record<Sentiment, string> = {
  positive: 'text-green-600 bg-green-50 border-green-200',
  neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  negative: 'text-red-600 bg-red-50 border-red-200',
};

const topicLabels: Record<string, string> = {
  product: 'Sản phẩm',
  delivery: 'Giao hàng',
  service: 'Dịch vụ',
  staff: 'Nhân viên',
  price: 'Giá cả',
  warranty: 'Bảo hành',
};

const typeLabels: Record<string, string> = {
  complaint: 'Khiếu nại',
  praise: 'Khen ngợi',
  suggestion: 'Góp ý',
  inquiry: 'Hỏi đáp',
};

interface ReviewDetailPanelProps {
  review: Review | null;
  onClose: () => void;
}

export function ReviewDetailPanel({ review, onClose }: ReviewDetailPanelProps) {
  const [replyText, setReplyText] = useState(review?.suggestedReply || '');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!review) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Select a review to view details</p>
        </div>
      </div>
    );
  }

  const handleGenerateReply = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReplyText(review.suggestedReply || '');
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold', platformColors[review.platform])}>
            {platformNames[review.platform][0]}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Review Details</h3>
            <p className="text-xs text-slate-500">{platformNames[review.platform]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Customer Info */}
        <div className="flex items-start gap-3">
          <img 
            src={review.customerAvatar} 
            alt={review.customerName}
            className="w-12 h-12 rounded-full bg-slate-100"
          />
          <div className="flex-1">
            <h4 className="font-medium text-slate-900">{review.customerName}</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-4 h-4',
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-slate-200 text-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-500">{review.rating}/5</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {review.createdAt.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Review Content */}
        <Card className="rounded-xl border-slate-200 bg-slate-50">
          <CardContent className="p-4">
            <p className="text-slate-700 leading-relaxed">{review.content}</p>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <div>
          <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            AI Analysis
          </h5>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Type</p>
              <Badge variant="outline" className="text-xs">
                {typeLabels[review.type]}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Topic</p>
              <Badge variant="outline" className="text-xs">
                {topicLabels[review.topic]}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Sentiment</p>
              <Badge className={cn('text-xs capitalize', sentimentColors[review.sentiment])}>
                {review.sentiment}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Priority</p>
              <Badge className={cn('text-xs uppercase', priorityColors[review.priority])}>
                {review.priority}
              </Badge>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-900">SLA Target</span>
              <Badge className="bg-indigo-500 text-white text-xs">{review.sla}</Badge>
            </div>
            <p className="text-xs text-indigo-700">{review.priorityReason}</p>
          </div>
        </div>

        {/* Suggested Actions */}
        <div>
          <h5 className="text-sm font-semibold text-slate-900 mb-3">Recommended Actions</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-700">Contact customer privately</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-slate-700">Escalate to {review.internalAction === 'manager' ? 'Manager' : 'CSKH'}</span>
            </div>
          </div>
        </div>

        {/* AI Suggested Reply */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Suggested Reply
            </h5>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleGenerateReply} disabled={isGenerating}>
                <RefreshCw className={cn('w-3 h-3 mr-1', isGenerating && 'animate-spin')} />
                Regenerate
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="AI will suggest a reply based on brand tone..."
              className="min-h-[120px] rounded-xl border-slate-200 resize-none"
            />
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs rounded-lg">
                Softer
              </Button>
              <Button variant="outline" size="sm" className="text-xs rounded-lg">
                Formal
              </Button>
              <Button variant="outline" size="sm" className="text-xs rounded-lg">
                Apology
              </Button>
              <Button variant="outline" size="sm" className="text-xs rounded-lg">
                Compensation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Button className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl">
            <Send className="w-4 h-4 mr-2" />
            Approve & Send
          </Button>
          <Button variant="outline" className="rounded-xl">
            <User className="w-4 h-4 mr-2" />
            Assign
          </Button>
          <Button variant="outline" className="rounded-xl">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
