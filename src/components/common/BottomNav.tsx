import React from 'react';
import { LayoutDashboard, CalendarDays, Target, History, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'plan' | 'challenges' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, pendingCount }) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'plan' as TabType,
      label: 'Plan',
      icon: CalendarDays,
      badge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'challenges' as TabType,
      label: 'Challenges',
      icon: Target,
    },
    {
      id: 'history' as TabType,
      label: 'History',
      icon: History,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 pb-safe transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.4] text-brand-600 dark:text-brand-400' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400 mt-0.5 animate-scale-up" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
