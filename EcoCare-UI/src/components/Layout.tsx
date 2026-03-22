import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Detect mobile on mount and resize
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen min-h-dvh bg-surface overflow-x-hidden pb-20 lg:pb-0">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <Button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[10040] !h-full !w-full !rounded-none border-0 bg-slate-900/40 p-0 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="lg:ml-64 min-h-screen min-h-dvh flex flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
        <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8 text-center text-slate-400 text-xs font-medium">
          © 2024 WashNet • Precision Fluidity Design System • v2.4.0
        </footer>
      </div>
    </div>
  );
};
