import { 
  LayoutDashboard, 
  Inbox, 
  AlertCircle, 
  BarChart3, 
  Settings,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Reviews Inbox', icon: Inbox },
  { id: 'urgent', label: 'Urgent Cases', icon: AlertCircle, badge: 5 },
  { id: 'trends', label: 'Trends & Insights', icon: TrendingUp },
  { id: 'ai', label: 'AI Suggestions', icon: Sparkles },
  { id: 'platforms', label: 'Platforms', icon: Layers },
  { id: 'analytics', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 z-50 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-lg text-white">ReviewHub</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider">AI Command Center</span>
          </div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 py-3">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">Acme Corp</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-auto">
        <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          Main
        </div>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 py-2 mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
          System
        </div>
        {navItems.slice(5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" 
            alt="Admin" 
            className="w-9 h-9 rounded-full bg-slate-700"
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">Sarah Chen</p>
            <p className="text-xs text-slate-400">CX Manager</p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </button>
      </div>
    </aside>
  );
}
