import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { BottomNav, type TabType } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { SplitSavingsModal } from './components/common/SplitSavingsModal';
import { ManualDepositModal } from './components/common/ManualDepositModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { PlanView } from './components/plan/PlanView';
import { CreateChallengeView } from './components/create/CreateChallengeView';
import { ChallengeListView } from './components/challenges/ChallengeListView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { PiggyBank } from 'lucide-react';

const AppContent: React.FC = () => {
  const { toasts, removeToast, stats, isLoading, activeChallenge } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isCreatingGoal, setIsCreatingGoal] = useState<boolean>(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [splitInitialAmount, setSplitInitialAmount] = useState<number | undefined>(undefined);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualGoalId, setManualGoalId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30 animate-bounce-subtle mb-4">
          <PiggyBank className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-black tracking-tight">SaveSmart</h2>
        <p className="text-xs text-slate-400 mt-1">Loading your savings vault...</p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setIsCreatingGoal(true);
  };

  const handleCloseCreate = () => {
    setIsCreatingGoal(false);
  };

  const handleCreateSuccess = () => {
    setIsCreatingGoal(false);
    setCurrentTab('dashboard');
  };

  const handleOpenSplit = (amount?: number) => {
    setSplitInitialAmount(amount);
    setIsSplitModalOpen(true);
  };

  const handleOpenManual = (goalId?: string) => {
    setManualGoalId(goalId);
    setIsManualModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Header */}
      <Navbar
        onOpenCreate={handleOpenCreate}
        onOpenChallenges={() => {
          setIsCreatingGoal(false);
          setCurrentTab('challenges');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-24">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* View Switcher */}
        {isCreatingGoal ? (
          <CreateChallengeView
            onSuccess={handleCreateSuccess}
            onCancel={handleCloseCreate}
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardView
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenCreate={handleOpenCreate}
            onOpenSplit={handleOpenSplit}
            onOpenManual={handleOpenManual}
          />
        ) : currentTab === 'plan' ? (
          <PlanView onOpenManual={() => handleOpenManual(activeChallenge?.id)} />
        ) : currentTab === 'challenges' ? (
          <ChallengeListView
            onOpenCreate={handleOpenCreate}
            onSelectChallenge={() => setCurrentTab('dashboard')}
            onOpenSplit={() => handleOpenSplit(undefined)}
            onOpenManual={handleOpenManual}
          />
        ) : currentTab === 'history' ? (
          <HistoryView />
        ) : currentTab === 'settings' ? (
          <SettingsView />
        ) : null}
      </main>

      {/* Multi-Goal Split Savings Modal */}
      <SplitSavingsModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        initialAmount={splitInitialAmount}
      />

      {/* Manual Deposit Modal */}
      <ManualDepositModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        defaultGoalId={manualGoalId}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={isCreatingGoal ? ('challenges' as TabType) : currentTab}
        onSelectTab={(tab) => {
          setIsCreatingGoal(false);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingCount={stats?.pendingEntries}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
