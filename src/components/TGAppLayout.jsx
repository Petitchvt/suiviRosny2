import React, { useRef, useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ScanBarcode, BarChart3, History, Settings, PieChart } from 'lucide-react';

const tabs = [
  { path: '/suivi', label: 'Suivi', icon: BarChart3 },
  { path: '/', label: 'Scanner', icon: ScanBarcode },
  { path: '/statistiques', label: 'Stats', icon: PieChart },
  { path: '/historique', label: 'Historique', icon: History },
  { path: '/config', label: 'Config', icon: Settings },
];

function LiquidNav() {
  const location = useLocation();
  const activeIndex = tabs.findIndex(t => t.path === location.pathname);
  const tabRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setPillStyle({ left: offsetLeft, width: offsetWidth, opacity: 1 });
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>
      <div className="relative flex items-center h-16 max-w-lg mx-auto px-2">
        {/* Liquid pill */}
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            height: 44,
            opacity: pillStyle.opacity,
            background: 'rgba(99,102,241,0.08)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9), 0 2px 8px rgba(99,102,241,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.12)',
            transition: 'left 0.22s cubic-bezier(0.25,0.46,0.45,0.94), width 0.22s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.15s',
          }}
        />

        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              ref={el => tabRefs.current[i] = el}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-full transition-all duration-300"
            >
              <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-4 pb-2 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-primary tracking-tight">
          TG Pharma
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>

      <LiquidNav />
    </div>
  );
}