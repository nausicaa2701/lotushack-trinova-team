import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopBar />
        <main className="p-8 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <footer className="p-8 text-center text-slate-400 text-xs font-medium">
          © 2024 WashConnect • Precision Fluidity Design System • v2.4.0
        </footer>
      </div>
    </div>
  );
};
