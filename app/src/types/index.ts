export type Platform = 'facebook' | 'tiktok' | 'shopee' | 'google';

export type ReviewType = 'complaint' | 'praise' | 'suggestion' | 'inquiry';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type Topic = 'product' | 'delivery' | 'service' | 'staff' | 'price' | 'warranty';

export type IssueCategory = 
  | 'product_defect' 
  | 'slow_delivery' 
  | 'poor_service' 
  | 'staff_attitude' 
  | 'wrong_description' 
  | 'crisis' 
  | 'refund_warranty';

export interface Review {
  id: string;
  platform: Platform;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  content: string;
  createdAt: Date;
  originalUrl?: string;
  type: ReviewType;
  topic: Topic;
  sentiment: Sentiment;
  priority: Priority;
  sla: '1h' | '4h' | '24h' | '48h';
  priorityReason: string;
  suggestedReply?: string;
  internalAction: 'cskh' | 'qa_product' | 'manager' | 'monitor';
  status: 'pending' | 'in_progress' | 'resolved';
  assignedTo?: string;
}

export interface PlatformStats {
  platform: Platform;
  rating: number;
  reviewCount: number;
  trend: number;
}

export interface ReviewVolume {
  period: '24h' | '7d' | '30d';
  count: number;
  change: number;
}

export interface TrendingKeyword {
  keyword: string;
  count: number;
  sentiment: Sentiment;
  platforms: Platform[];
}

export interface CriticalIssue {
  category: IssueCategory;
  categoryName: string;
  count: number;
  isCritical: boolean;
}

export interface UrgentQueueItem {
  review: Review;
  timeInQueue: string;
}

export interface RatingTrend {
  date: string;
  facebook: number;
  tiktok: number;
  shopee: number;
  google: number;
  overall: number;
}
