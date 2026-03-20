import { useState } from 'react';
import { Sidebar } from '@/sections/Sidebar';
import { Header } from '@/sections/Header';
import { KPICards } from '@/sections/KPICards';
import { RatingSummary } from '@/sections/RatingSummary';
import { ReviewVolume } from '@/sections/ReviewVolume';
import { TrendingKeywords } from '@/sections/TrendingKeywords';
import { CriticalIssues } from '@/sections/CriticalIssues';
import { UrgentQueue } from '@/sections/UrgentQueue';
import { ReviewInbox } from '@/sections/ReviewInbox';
import { ReviewDetailPanel } from '@/sections/ReviewDetailPanel';
import type { Review } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, TrendingUp, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import './App.css';

// Dashboard Overview Component
function DashboardOverview({ onSelectReview }: { onSelectReview: (review: Review) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <KPICards />

      {/* Row 2: Rating by Platform + Review Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatingSummary />
        <ReviewVolume />
      </div>

      {/* Row 3: Trending Keywords + Critical Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendingKeywords />
        <CriticalIssues />
      </div>

      {/* Row 4: Urgent Queue */}
      <UrgentQueue onSelectReview={onSelectReview} />
    </div>
  );
}

// Review Inbox Page Component
function ReviewInboxPage({ selectedReview, onSelectReview }: { 
  selectedReview: Review | null; 
  onSelectReview: (review: Review) => void;
}) {
  return (
    <div className="h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <ReviewInbox 
          onSelectReview={onSelectReview} 
          selectedReviewId={selectedReview?.id}
        />
        <div className="hidden lg:block h-full border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <ReviewDetailPanel review={selectedReview} onClose={() => onSelectReview(null as unknown as Review)} />
        </div>
      </div>
    </div>
  );
}

// AI Summary Dialog Content
function AISummaryContent() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          Trong 7 ngày qua, sentiment tổng thể <span className="font-semibold text-orange-600">giảm nhẹ</span> do tăng phản ánh về 
          <span className="font-semibold"> giao hàng chậm</span> trên Shopee và Facebook. 
          <span className="font-semibold text-red-600"> 3 chi nhánh</span> có số review 1 sao tăng bất thường. 
          <span className="font-semibold text-orange-600"> 12 case</span> cần xử lý trong 4 giờ tới.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">Key Risks</span>
          </div>
          <ul className="space-y-1 text-xs text-red-600">
            <li>• Giao hàng chậm tăng 38%</li>
            <li>• 3 case có nguy cơ viral</li>
            <li>• Shopee rating giảm 0.2</li>
          </ul>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">Notable Trends</span>
          </div>
          <ul className="space-y-1 text-xs text-green-600">
            <li>• Đóng gói đẹp +24%</li>
            <li>• Response time cải thiện</li>
            <li>• Positive reviews tăng</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">Recommended Actions</span>
        </div>
        <ul className="space-y-1 text-xs text-blue-600">
          <li>• Liên hệ đơn vị vận chuyển để giải quyết tình trạng giao hàng chậm</li>
          <li>• Escalate 3 case P1 cho manager xử lý ngay</li>
          <li>• Tăng cường monitoring trên Shopee</li>
        </ul>
      </div>
    </div>
  );
}

// Placeholder Pages
function PlaceholderPage({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500">This feature is coming soon</p>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showAISummary, setShowAISummary] = useState(false);

  const handleSelectReview = (review: Review) => {
    setSelectedReview(review);
    if (window.innerWidth < 1024) {
      // On mobile, navigate to inbox tab
      setActiveTab('inbox');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'inbox': return 'Reviews Inbox';
      case 'urgent': return 'Urgent Cases';
      case 'trends': return 'Trends & Insights';
      case 'ai': return 'AI Suggestions';
      case 'platforms': return 'Platforms';
      case 'analytics': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onSelectReview={handleSelectReview} />;
      case 'inbox':
        return <ReviewInboxPage selectedReview={selectedReview} onSelectReview={handleSelectReview} />;
      case 'urgent':
        return <PlaceholderPage title="Urgent Cases" icon={AlertCircle} />;
      case 'trends':
        return <PlaceholderPage title="Trends & Insights" icon={TrendingUp} />;
      case 'ai':
        return <PlaceholderPage title="AI Suggestions" icon={Sparkles} />;
      case 'platforms':
        return <PlaceholderPage title="Platforms" icon={MessageSquare} />;
      case 'analytics':
        return <PlaceholderPage title="Reports" icon={TrendingUp} />;
      case 'settings':
        return <PlaceholderPage title="Settings" icon={MessageSquare} />;
      default:
        return <DashboardOverview onSelectReview={handleSelectReview} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="ml-64">
        <Header 
          title={getPageTitle()} 
          onGenerateSummary={() => setShowAISummary(true)}
        />
        
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* AI Summary Dialog */}
      <Dialog open={showAISummary} onOpenChange={setShowAISummary}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Summary - Last 7 Days
            </DialogTitle>
          </DialogHeader>
          <AISummaryContent />
        </DialogContent>
      </Dialog>

      {/* Mobile Review Detail Drawer */}
      {selectedReview && window.innerWidth < 1024 && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setSelectedReview(null)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <ReviewDetailPanel review={selectedReview} onClose={() => setSelectedReview(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
