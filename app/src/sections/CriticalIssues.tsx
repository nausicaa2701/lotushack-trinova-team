import { 
  Package, 
  Truck, 
  Headphones, 
  UserX, 
  FileX, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { criticalIssues } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { IssueCategory } from '@/types';

const issueIcons: Record<IssueCategory, React.ElementType> = {
  product_defect: Package,
  slow_delivery: Truck,
  poor_service: Headphones,
  staff_attitude: UserX,
  wrong_description: FileX,
  crisis: AlertTriangle,
  refund_warranty: RefreshCw,
};

const issueColors: Record<IssueCategory, { bg: string; text: string; bar: string }> = {
  product_defect: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  slow_delivery: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  poor_service: { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-500' },
  staff_attitude: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  wrong_description: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  crisis: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  refund_warranty: { bg: 'bg-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-500' },
};

export function CriticalIssues() {
  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Issue Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {criticalIssues.map((issue) => {
            const Icon = issueIcons[issue.category];
            const colors = issueColors[issue.category];
            
            return (
              <div
                key={issue.category}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm',
                  issue.isCritical ? 'bg-red-50 border border-red-100' : 'bg-slate-50 hover:bg-slate-100'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.text)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'text-sm font-medium',
                      issue.isCritical ? 'text-red-700' : 'text-slate-700'
                    )}>
                      {issue.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-lg font-bold',
                        issue.isCritical ? 'text-red-600' : 'text-slate-900'
                      )}>
                        {issue.count}
                      </span>
                      {issue.isCritical && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                      style={{ width: `${Math.min((issue.count / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
