export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'archived';

export type SavingsFrequency = 'daily' | 'weekdays' | 'weekly';

export type GenerationMode = 'complete_plan' | 'daily_surprise';

export type EntryStatus = 'pending' | 'saved';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor = 'emerald' | 'teal' | 'indigo' | 'rose' | 'amber';

export interface SavingsChallenge {
  id: string;
  name: string;
  targetAmount: number;
  minimumAmount: number;
  maximumAmount: number;
  currency: string;
  startDate: string; // YYYY-MM-DD
  frequency: SavingsFrequency;
  generationMode: GenerationMode;
  status: ChallengeStatus;
  themeColor?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface SavingsEntry {
  id: string;
  challengeId: string;
  sequenceNumber: number; // 1, 2, 3...
  plannedDate: string; // YYYY-MM-DD
  amount: number; // integer in currency units (e.g. ₹500)
  status: EntryStatus;
  completedAt: string | null; // ISO string when marked saved
  createdAt: string;
  updatedAt: string;
  note?: string;
  isManual?: boolean;
}

export interface AllGoalsSummary {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  overallProgress: number;
  activeCount: number;
  completedCount: number;
  totalGoals: number;
}

export interface SplitAllocation {
  challengeId: string;
  challengeName: string;
  amount: number;
}

export interface SplitTransaction {
  id: string;
  totalAmount: number;
  allocations: SplitAllocation[];
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  note?: string;
}

export interface AppSettings {
  displayName: string;
  currency: string;
  defaultTargetAmount: number;
  defaultMinimumAmount: number;
  defaultMaximumAmount: number;
  defaultFrequency: SavingsFrequency;
  defaultGenerationMode: GenerationMode;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  reminderEnabled: boolean;
  reminderTime: string;
  soundEffects: boolean;
  confettiEnabled: boolean;
}

export interface ChallengeStats {
  targetAmount: number;
  totalSaved: number;
  remainingAmount: number;
  progressPercentage: number;
  totalEntries: number;
  completedEntries: number;
  pendingEntries: number;
  missedEntries: number;
  currentStreak: number;
  projectedCompletionDate: string | null;
  averageSavedPerDay: number;
  nextPendingEntry: SavingsEntry | null;
}

export interface PartitionValidationResult {
  isValid: boolean;
  errorMessage?: string;
  suggestedTarget?: number;
  minPossibleTarget?: number;
  minDays?: number;
  maxDays?: number;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  challenges: SavingsChallenge[];
  entries: SavingsEntry[];
  splitTransactions?: SplitTransaction[];
}
