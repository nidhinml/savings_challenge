import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  SavingsChallenge,
  SavingsEntry,
  AppSettings,
  ChallengeStats,
  SavingsFrequency,
  GenerationMode,
  AppBackupData,
  SplitTransaction,
} from '../types/challenge';
import * as db from '../lib/db';
import { generateConstrainedPartition, generateNextSurpriseAmount } from '../lib/partition';
import { generateScheduledDates, getNextDateForFrequency, getTodayDateString, isEntryMissed } from '../lib/scheduler';
import { formatCurrency } from '../lib/currency';
import { playSuccessChime, playUndoTone } from '../lib/sound';
import { fireConfetti, fireGrandCelebration } from '../lib/confetti';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface CreateChallengeInput {
  name: string;
  targetAmount: number;
  minimumAmount: number;
  maximumAmount: number;
  currency: string;
  startDate: string;
  frequency: SavingsFrequency;
  generationMode: GenerationMode;
  notes?: string;
}

interface AppContextType {
  settings: AppSettings;
  challenges: SavingsChallenge[];
  activeChallenge: SavingsChallenge | null;
  activeChallengeEntries: SavingsEntry[];
  splitTransactions: SplitTransaction[];
  stats: ChallengeStats | null;
  toasts: ToastMessage[];
  isLoading: boolean;
  isOnline: boolean;
  canInstallPwa: boolean;
  deferredPrompt: any;
  promptPwaInstall: () => Promise<void>;
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  setActiveChallengeId: (id: string) => void;
  createChallenge: (input: CreateChallengeInput) => Promise<SavingsChallenge>;
  updateChallenge: (challenge: SavingsChallenge) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  markEntryAsSaved: (entryId: string) => Promise<void>;
  undoEntrySaved: (entryId: string) => Promise<void>;
  regeneratePlan: (challengeId: string) => Promise<void>;
  generateNextSurpriseEntry: (challengeId: string) => Promise<SavingsEntry | null>;
  rerollSurpriseAmount: (entryId: string) => Promise<void>;
  splitAmountAcrossChallenges: (
    totalAmount: number,
    allocations: { challengeId: string; amount: number }[],
    note?: string
  ) => Promise<void>;
  deleteSplitTransaction: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (backup: AppBackupData) => Promise<void>;
  resetData: () => Promise<void>;
  refreshActiveEntries: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(db.DEFAULT_SETTINGS);
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([]);
  const [activeChallengeId, setActiveChallengeIdState] = useState<string | null>(null);
  const [activeChallengeEntries, setActiveChallengeEntries] = useState<SavingsEntry[]>([]);
  const [splitTransactions, setSplitTransactions] = useState<SplitTransaction[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);

  // Toast manager
  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // PWA Install prompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptPwaInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addToast('Thank you for installing SaveSmart!', 'success');
      setCanInstallPwa(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, addToast]);

  // Apply theme & accent class to HTML document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (settings.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }

    root.setAttribute('data-accent', settings.accentColor || 'emerald');
  }, [settings.themeMode, settings.accentColor]);

  // Initial load from IndexedDB
  const initApp = useCallback(async () => {
    try {
      setIsLoading(true);
      const [savedSettings, savedChallenges, savedSplits] = await Promise.all([
        db.getAppSettings(),
        db.getAllChallenges(),
        db.getAllSplitTransactions(),
      ]);

      setSettings(savedSettings);
      setChallenges(savedChallenges);
      setSplitTransactions(savedSplits);

      if (savedChallenges.length > 0) {
        const active = savedChallenges.find((c) => c.status === 'active') || savedChallenges[0];
        setActiveChallengeIdState(active.id);
        const entries = await db.getEntriesForChallenge(active.id);
        setActiveChallengeEntries(entries);
      } else {
        const initialChallenge: SavingsChallenge = {
          id: 'demo-10k-challenge',
          name: 'First Savings Goal',
          targetAmount: 10000,
          minimumAmount: 100,
          maximumAmount: 1500,
          currency: 'INR',
          startDate: getTodayDateString(),
          frequency: 'daily',
          generationMode: 'complete_plan',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const partition = generateConstrainedPartition(10000, 100, 1500);
        const dates = generateScheduledDates(initialChallenge.startDate, partition.length, 'daily');
        const nowIso = new Date().toISOString();

        const entries: SavingsEntry[] = partition.map((amount, idx) => ({
          id: `entry-${idx + 1}`,
          challengeId: initialChallenge.id,
          sequenceNumber: idx + 1,
          plannedDate: dates[idx],
          amount,
          status: 'pending',
          completedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        }));

        await db.saveChallenge(initialChallenge);
        await db.saveEntriesBatch(entries);

        setChallenges([initialChallenge]);
        setActiveChallengeIdState(initialChallenge.id);
        setActiveChallengeEntries(entries);
      }
    } catch (err) {
      console.error('Failed to initialize application from IDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const refreshActiveEntries = useCallback(async () => {
    if (!activeChallengeId) {
      setActiveChallengeEntries([]);
      return;
    }
    const entries = await db.getEntriesForChallenge(activeChallengeId);
    setActiveChallengeEntries(entries);
  }, [activeChallengeId]);

  const setActiveChallengeId = useCallback(
    async (id: string) => {
      setActiveChallengeIdState(id);
      const entries = await db.getEntriesForChallenge(id);
      setActiveChallengeEntries(entries);
    },
    []
  );

  const activeChallenge = useMemo(() => {
    return challenges.find((c) => c.id === activeChallengeId) || null;
  }, [challenges, activeChallengeId]);

  // Compute stats for current active challenge
  const stats: ChallengeStats | null = useMemo(() => {
    if (!activeChallenge) return null;

    const totalSaved = activeChallengeEntries
      .filter((e) => e.status === 'saved')
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingAmount = Math.max(0, activeChallenge.targetAmount - totalSaved);
    const progressPercentage =
      activeChallenge.targetAmount > 0
        ? Math.min(100, Math.round((totalSaved / activeChallenge.targetAmount) * 100))
        : 0;

    const completedEntries = activeChallengeEntries.filter((e) => e.status === 'saved').length;
    const pendingEntries = activeChallengeEntries.filter((e) => e.status === 'pending').length;
    const missedEntries = activeChallengeEntries.filter((e) => isEntryMissed(e.plannedDate, e.status)).length;

    const nextPendingEntry = activeChallengeEntries.find((e) => e.status === 'pending') || null;

    let streak = 0;
    const today = getTodayDateString();
    const sortedSaved = [...activeChallengeEntries]
      .filter((e) => e.status === 'saved' && e.completedAt)
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1));

    if (sortedSaved.length > 0) {
      const lastSavedDate = sortedSaved[0].completedAt?.slice(0, 10);
      if (lastSavedDate === today || lastSavedDate === getTodayDateString()) {
        streak = completedEntries;
      }
    }

    const avgSaved = completedEntries > 0 ? Math.round(totalSaved / completedEntries) : 0;
    const projectedCompletionDate =
      activeChallengeEntries.length > 0
        ? activeChallengeEntries[activeChallengeEntries.length - 1].plannedDate
        : null;

    return {
      targetAmount: activeChallenge.targetAmount,
      totalSaved,
      remainingAmount,
      progressPercentage,
      totalEntries: activeChallengeEntries.length,
      completedEntries,
      pendingEntries,
      missedEntries,
      currentStreak: streak,
      projectedCompletionDate,
      averageSavedPerDay: avgSaved,
      nextPendingEntry,
    };
  }, [activeChallenge, activeChallengeEntries]);

  // Create Challenge
  const createChallenge = useCallback(
    async (input: CreateChallengeInput): Promise<SavingsChallenge> => {
      const challengeId = 'ch_' + Math.random().toString(36).substring(2, 11);
      const nowIso = new Date().toISOString();

      const newChallenge: SavingsChallenge = {
        id: challengeId,
        name: input.name.trim() || 'New Savings Goal',
        targetAmount: input.targetAmount,
        minimumAmount: input.minimumAmount,
        maximumAmount: input.maximumAmount,
        currency: input.currency,
        startDate: input.startDate,
        frequency: input.frequency,
        generationMode: input.generationMode,
        status: 'active',
        notes: input.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      let entries: SavingsEntry[] = [];

      if (input.generationMode === 'complete_plan') {
        const amounts = generateConstrainedPartition(
          input.targetAmount,
          input.minimumAmount,
          input.maximumAmount
        );
        const dates = generateScheduledDates(input.startDate, amounts.length, input.frequency);

        entries = amounts.map((amount, idx) => ({
          id: `entry_${challengeId}_${idx + 1}`,
          challengeId,
          sequenceNumber: idx + 1,
          plannedDate: dates[idx],
          amount,
          status: 'pending',
          completedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        }));
      } else {
        const firstAmount = generateNextSurpriseAmount(
          input.targetAmount,
          input.minimumAmount,
          input.maximumAmount
        );

        entries = [
          {
            id: `entry_${challengeId}_1`,
            challengeId,
            sequenceNumber: 1,
            plannedDate: input.startDate,
            amount: firstAmount,
            status: 'pending',
            completedAt: null,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }

      await db.saveChallenge(newChallenge);
      await db.saveEntriesBatch(entries);

      setChallenges((prev) => [newChallenge, ...prev]);
      setActiveChallengeIdState(challengeId);
      setActiveChallengeEntries(entries);

      addToast(`Challenge "${newChallenge.name}" created!`, 'success');
      return newChallenge;
    },
    [addToast]
  );

  // Update Challenge
  const updateChallenge = useCallback(
    async (challenge: SavingsChallenge) => {
      const updated = { ...challenge, updatedAt: new Date().toISOString() };
      await db.saveChallenge(updated);
      setChallenges((prev) => prev.map((c) => (c.id === challenge.id ? updated : c)));
      addToast(`Challenge updated`, 'info');
    },
    [addToast]
  );

  // Delete Challenge
  const deleteChallenge = useCallback(
    async (id: string) => {
      await db.deleteChallenge(id);
      const remaining = challenges.filter((c) => c.id !== id);
      setChallenges(remaining);

      if (activeChallengeId === id) {
        if (remaining.length > 0) {
          setActiveChallengeIdState(remaining[0].id);
          const entries = await db.getEntriesForChallenge(remaining[0].id);
          setActiveChallengeEntries(entries);
        } else {
          setActiveChallengeIdState(null);
          setActiveChallengeEntries([]);
        }
      }
      addToast('Challenge deleted', 'info');
    },
    [challenges, activeChallengeId, addToast]
  );

  // Mark entry as saved
  const markEntryAsSaved = useCallback(
    async (entryId: string) => {
      const entry = activeChallengeEntries.find((e) => e.id === entryId);
      if (!entry) return;

      if (entry.status === 'saved') return;

      const updatedEntry: SavingsEntry = {
        ...entry,
        status: 'saved',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.updateEntryRecord(updatedEntry);

      const nextEntries = activeChallengeEntries.map((e) => (e.id === entryId ? updatedEntry : e));
      setActiveChallengeEntries(nextEntries);

      playSuccessChime(settings.soundEffects);

      const formattedAmount = formatCurrency(entry.amount, activeChallenge?.currency || 'INR');
      addToast(`${formattedAmount} marked as saved!`, 'success');

      const totalSavedAfter = nextEntries
        .filter((e) => e.status === 'saved')
        .reduce((sum, e) => sum + e.amount, 0);

      if (activeChallenge && totalSavedAfter >= activeChallenge.targetAmount) {
        fireGrandCelebration(settings.confettiEnabled);
        addToast(`🎉 Goal Reached! You have saved ${formatCurrency(activeChallenge.targetAmount, activeChallenge.currency)}!`, 'success');
        
        const completedChallenge: SavingsChallenge = {
          ...activeChallenge,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        };
        await db.saveChallenge(completedChallenge);
        setChallenges((prev) => prev.map((c) => (c.id === activeChallenge.id ? completedChallenge : c)));
      } else {
        fireConfetti(settings.confettiEnabled);
      }
    },
    [activeChallengeEntries, activeChallenge, settings, addToast]
  );

  // Undo saved entry
  const undoEntrySaved = useCallback(
    async (entryId: string) => {
      const entry = activeChallengeEntries.find((e) => e.id === entryId);
      if (!entry || entry.status === 'pending') return;

      const updatedEntry: SavingsEntry = {
        ...entry,
        status: 'pending',
        completedAt: null,
        updatedAt: new Date().toISOString(),
      };

      await db.updateEntryRecord(updatedEntry);

      const nextEntries = activeChallengeEntries.map((e) => (e.id === entryId ? updatedEntry : e));
      setActiveChallengeEntries(nextEntries);

      playUndoTone(settings.soundEffects);

      if (activeChallenge && activeChallenge.status === 'completed') {
        const reactivatedChallenge: SavingsChallenge = {
          ...activeChallenge,
          status: 'active',
          updatedAt: new Date().toISOString(),
        };
        await db.saveChallenge(reactivatedChallenge);
        setChallenges((prev) => prev.map((c) => (c.id === activeChallenge.id ? reactivatedChallenge : c)));
      }

      addToast(`Day ${entry.sequenceNumber} completion reversed.`, 'info');
    },
    [activeChallengeEntries, activeChallenge, settings.soundEffects, addToast]
  );

  // Regenerate plan for challenge
  const regeneratePlan = useCallback(
    async (challengeId: string) => {
      const targetChallenge = challenges.find((c) => c.id === challengeId);
      if (!targetChallenge) return;

      const amounts = generateConstrainedPartition(
        targetChallenge.targetAmount,
        targetChallenge.minimumAmount,
        targetChallenge.maximumAmount
      );
      const dates = generateScheduledDates(targetChallenge.startDate, amounts.length, targetChallenge.frequency);
      const nowIso = new Date().toISOString();

      const newEntries: SavingsEntry[] = amounts.map((amount, idx) => ({
        id: `entry_${challengeId}_${idx + 1}`,
        challengeId,
        sequenceNumber: idx + 1,
        plannedDate: dates[idx],
        amount,
        status: 'pending',
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      }));

      await db.deleteEntriesForChallenge(challengeId);
      await db.saveEntriesBatch(newEntries);

      if (activeChallengeId === challengeId) {
        setActiveChallengeEntries(newEntries);
      }

      addToast('New randomized savings plan generated!', 'success');
    },
    [challenges, activeChallengeId, addToast]
  );

  // Generate next surprise entry for Mode B
  const generateNextSurpriseEntry = useCallback(
    async (challengeId: string): Promise<SavingsEntry | null> => {
      const targetChallenge = challenges.find((c) => c.id === challengeId);
      if (!targetChallenge) return null;

      const existingEntries = await db.getEntriesForChallenge(challengeId);

      const existingPending = existingEntries.find((e) => e.status === 'pending');
      if (existingPending) {
        return existingPending;
      }

      const currentSaved = existingEntries
        .filter((e) => e.status === 'saved')
        .reduce((sum, e) => sum + e.amount, 0);

      const remaining = targetChallenge.targetAmount - currentSaved;
      if (remaining <= 0) {
        return null;
      }

      const nextAmount = generateNextSurpriseAmount(
        remaining,
        targetChallenge.minimumAmount,
        targetChallenge.maximumAmount
      );

      const lastDate =
        existingEntries.length > 0
          ? existingEntries[existingEntries.length - 1].plannedDate
          : targetChallenge.startDate;

      const nextPlannedDate =
        existingEntries.length === 0
          ? targetChallenge.startDate
          : getNextDateForFrequency(lastDate, targetChallenge.frequency);

      const nowIso = new Date().toISOString();
      const nextSequence = existingEntries.length + 1;

      const newEntry: SavingsEntry = {
        id: `entry_${challengeId}_${nextSequence}`,
        challengeId,
        sequenceNumber: nextSequence,
        plannedDate: nextPlannedDate,
        amount: nextAmount,
        status: 'pending',
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.saveEntriesBatch([newEntry]);
      const updatedEntries = [...existingEntries, newEntry];

      if (activeChallengeId === challengeId) {
        setActiveChallengeEntries(updatedEntries);
      }

      return newEntry;
    },
    [challenges, activeChallengeId]
  );

  // Re-roll surprise amount for pending entry
  const rerollSurpriseAmount = useCallback(
    async (entryId: string) => {
      const entry = activeChallengeEntries.find((e) => e.id === entryId);
      if (!entry || entry.status !== 'pending' || !activeChallenge) return;

      const totalSavedExcluding = activeChallengeEntries
        .filter((e) => e.status === 'saved' && e.id !== entryId)
        .reduce((sum, e) => sum + e.amount, 0);

      const remaining = activeChallenge.targetAmount - totalSavedExcluding;
      const newAmount = generateNextSurpriseAmount(
        remaining,
        activeChallenge.minimumAmount,
        activeChallenge.maximumAmount
      );

      const updated = {
        ...entry,
        amount: newAmount,
        updatedAt: new Date().toISOString(),
      };

      await db.updateEntryRecord(updated);
      setActiveChallengeEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
      addToast('Daily surprise amount re-rolled!', 'info');
    },
    [activeChallengeEntries, activeChallenge, addToast]
  );

  // ---------------- MULTI-GOAL SPLIT SAVINGS ---------------- //
  const splitAmountAcrossChallenges = useCallback(
    async (
      totalAmount: number,
      allocations: { challengeId: string; amount: number }[],
      note?: string
    ) => {
      if (totalAmount <= 0 || allocations.length === 0) return;

      const nowIso = new Date().toISOString();
      const todayStr = getTodayDateString();

      // Process each allocation
      for (const alloc of allocations) {
        if (alloc.amount <= 0) continue;

        const targetChallenge = challenges.find((c) => c.id === alloc.challengeId);
        if (!targetChallenge) continue;

        const entries = await db.getEntriesForChallenge(alloc.challengeId);
        let remainingAlloc = alloc.amount;
        const pendingEntries = entries.filter((e) => e.status === 'pending');

        for (const entry of pendingEntries) {
          if (remainingAlloc <= 0) break;

          if (entry.amount <= remainingAlloc) {
            // Mark entire pending entry as saved
            entry.status = 'saved';
            entry.completedAt = nowIso;
            entry.updatedAt = nowIso;
            await db.updateEntryRecord(entry);
            remainingAlloc -= entry.amount;
          } else {
            // Partial split of pending entry:
            // 1. Current entry marked saved with alloc portion
            // 2. Remainder kept as pending entry
            const remainderAmount = entry.amount - remainingAlloc;

            const savedPortion: SavingsEntry = {
              ...entry,
              amount: remainingAlloc,
              status: 'saved',
              completedAt: nowIso,
              updatedAt: nowIso,
            };

            const pendingRemainder: SavingsEntry = {
              id: `entry_${alloc.challengeId}_rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              challengeId: alloc.challengeId,
              sequenceNumber: entry.sequenceNumber + 0.5,
              plannedDate: entry.plannedDate,
              amount: remainderAmount,
              status: 'pending',
              completedAt: null,
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            await db.updateEntryRecord(savedPortion);
            await db.saveEntriesBatch([pendingRemainder]);
            remainingAlloc = 0;
            break;
          }
        }

        // If amount remaining after all pending entries (or in surprise mode)
        if (remainingAlloc > 0) {
          const directEntry: SavingsEntry = {
            id: `entry_${alloc.challengeId}_split_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            challengeId: alloc.challengeId,
            sequenceNumber: entries.length + 1,
            plannedDate: todayStr,
            amount: remainingAlloc,
            status: 'saved',
            completedAt: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          await db.saveEntriesBatch([directEntry]);
        }

        // Check if challenge is now 100% completed
        const updatedEntries = await db.getEntriesForChallenge(alloc.challengeId);
        const newTotalSaved = updatedEntries
          .filter((e) => e.status === 'saved')
          .reduce((sum, e) => sum + e.amount, 0);

        if (newTotalSaved >= targetChallenge.targetAmount && targetChallenge.status !== 'completed') {
          const completedCh = { ...targetChallenge, status: 'completed' as const, updatedAt: nowIso };
          await db.saveChallenge(completedCh);
          setChallenges((prev) => prev.map((c) => (c.id === alloc.challengeId ? completedCh : c)));
        }
      }

      // Record SplitTransaction
      const splitRecord: SplitTransaction = {
        id: 'split_' + Math.random().toString(36).substring(2, 11),
        totalAmount,
        allocations: allocations.map((a) => {
          const ch = challenges.find((c) => c.id === a.challengeId);
          return {
            challengeId: a.challengeId,
            challengeName: ch ? ch.name : 'Savings Goal',
            amount: a.amount,
          };
        }),
        date: todayStr,
        timestamp: nowIso,
        note,
      };

      await db.saveSplitTransaction(splitRecord);
      setSplitTransactions((prev) => [splitRecord, ...prev]);

      // Refresh active challenge entries if affected
      if (activeChallengeId) {
        const freshEntries = await db.getEntriesForChallenge(activeChallengeId);
        setActiveChallengeEntries(freshEntries);
      }

      playSuccessChime(settings.soundEffects);
      fireConfetti(settings.confettiEnabled);
      addToast(
        `${formatCurrency(totalAmount, settings.currency)} split across ${allocations.length} goals!`,
        'success'
      );
    },
    [challenges, activeChallengeId, settings, addToast]
  );

  const deleteSplitTransaction = useCallback(
    async (id: string) => {
      await db.deleteSplitTransaction(id);
      setSplitTransactions((prev) => prev.filter((s) => s.id !== id));
      addToast('Split record deleted', 'info');
    },
    [addToast]
  );

  // Update Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await db.saveAppSettings(updated);
      addToast('Preferences saved', 'success');
    },
    [settings, addToast]
  );

  // Export Data JSON
  const exportData = useCallback(async () => {
    try {
      const backup = await db.exportAllData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SaveSmart_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      addToast('Data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  }, [addToast]);

  // Import Data JSON
  const importData = useCallback(
    async (backup: AppBackupData) => {
      try {
        await db.importAllData(backup);
        await initApp();
        addToast('Backup restored successfully!', 'success');
      } catch (err: any) {
        addToast(`Import failed: ${err.message || 'Corrupted file'}`, 'error');
        throw err;
      }
    },
    [initApp, addToast]
  );

  // Reset Data
  const resetData = useCallback(async () => {
    try {
      await db.resetAllData();
      await initApp();
      addToast('All data has been reset to defaults.', 'info');
    } catch {
      addToast('Failed to reset data', 'error');
    }
  }, [initApp, addToast]);

  return (
    <AppContext.Provider
      value={{
        settings,
        challenges,
        activeChallenge,
        activeChallengeEntries,
        splitTransactions,
        stats,
        toasts,
        isLoading,
        isOnline,
        canInstallPwa,
        deferredPrompt,
        promptPwaInstall,
        addToast,
        removeToast,
        setActiveChallengeId,
        createChallenge,
        updateChallenge,
        deleteChallenge,
        markEntryAsSaved,
        undoEntrySaved,
        regeneratePlan,
        generateNextSurpriseEntry,
        rerollSurpriseAmount,
        splitAmountAcrossChallenges,
        deleteSplitTransaction,
        updateSettings,
        exportData,
        importData,
        resetData,
        refreshActiveEntries,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
