import { Search, Bell, RefreshCw, Sparkles, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
  onGenerateSummary?: () => void;
}

export function Header({ title, onGenerateSummary }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search reviews, customers..." 
            className="pl-10 w-64 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Quick Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
              <Calendar className="w-4 h-4 mr-2" />
              Last 7 days
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Last 24 hours</DropdownMenuItem>
            <DropdownMenuItem>Last 7 days</DropdownMenuItem>
            <DropdownMenuItem>Last 30 days</DropdownMenuItem>
            <DropdownMenuItem>Custom range</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
              <Filter className="w-4 h-4 mr-2" />
              All Platforms
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All Platforms</DropdownMenuItem>
            <DropdownMenuItem>Facebook</DropdownMenuItem>
            <DropdownMenuItem>TikTok</DropdownMenuItem>
            <DropdownMenuItem>Shopee</DropdownMenuItem>
            <DropdownMenuItem>Google Maps</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sync Button */}
        <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync
        </Button>

        {/* AI Summary Button */}
        <Button 
          size="sm" 
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
          onClick={onGenerateSummary}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Summary
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-sm">Notifications</p>
            </div>
            <div className="max-h-80 overflow-auto">
              <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Critical Review Detected</p>
                    <p className="text-xs text-slate-500">Nguyễn Văn A posted a complaint</p>
                    <p className="text-xs text-slate-400 mt-1">15 minutes ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">SLA Warning</p>
                    <p className="text-xs text-slate-500">3 reviews need attention within 1h</p>
                    <p className="text-xs text-slate-400 mt-1">30 minutes ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-4 py-3 cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Daily Report Ready</p>
                    <p className="text-xs text-slate-500">Your 24h review summary is ready</p>
                    <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
