import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-lg font-semibold text-slate-900">StockHub SMS</span>
        </header>
        <main className="flex-1 overflow-x-hidden p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
