import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, SavingsChallenge, SavingsEntry, AppBackupData, SplitTransaction } from '../types/challenge';

interface SaveSmartDB extends DBSchema {
  challenges: {
    key: string;
    value: SavingsChallenge;
    indexes: {
      'by-status': string;
      'by-created': string;
    };
  };
  entries: {
    key: string;
    value: SavingsEntry;
    indexes: {
      'by-challenge': string;
      'by-challenge-seq': [string, number];
      'by-status': string;
      'by-date': string;
    };
  };
  split_transactions: {
    key: string;
    value: SplitTransaction;
    indexes: {
      'by-date': string;
      'by-timestamp': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'savesmart_db';
const DB_VERSION = 2;

export const DEFAULT_SETTINGS: AppSettings = {
  displayName: 'SaveSmart User',
  currency: 'INR',
  defaultTargetAmount: 10000,
  defaultMinimumAmount: 100,
  defaultMaximumAmount: 1500,
  defaultFrequency: 'daily',
  defaultGenerationMode: 'complete_plan',
  themeMode: 'system',
  accentColor: 'emerald',
  reminderEnabled: true,
  reminderTime: '20:00',
  soundEffects: true,
  confettiEnabled: true,
};

let dbPromise: Promise<IDBPDatabase<SaveSmartDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<SaveSmartDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SaveSmartDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        if (oldVersion < 1) {
          // Challenges Store
          const challengeStore = db.createObjectStore('challenges', { keyPath: 'id' });
          challengeStore.createIndex('by-status', 'status');
          challengeStore.createIndex('by-created', 'createdAt');

          // Entries Store
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
          entryStore.createIndex('by-challenge', 'challengeId');
          entryStore.createIndex('by-challenge-seq', ['challengeId', 'sequenceNumber']);
          entryStore.createIndex('by-status', 'status');
          entryStore.createIndex('by-date', 'plannedDate');

          // Settings Store
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('split_transactions')) {
            const splitStore = db.createObjectStore('split_transactions', { keyPath: 'id' });
            splitStore.createIndex('by-date', 'date');
            splitStore.createIndex('by-timestamp', 'timestamp');
          }
        }
      },
    });
  }
  return dbPromise;
}

// ---------------- CHALLENGES REPOSITORY ---------------- //

export async function getAllChallenges(): Promise<SavingsChallenge[]> {
  const db = await getDatabase();
  const all = await db.getAll('challenges');
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getChallengeById(id: string): Promise<SavingsChallenge | undefined> {
  const db = await getDatabase();
  return db.get('challenges', id);
}

export async function saveChallenge(challenge: SavingsChallenge): Promise<void> {
  const db = await getDatabase();
  await db.put('challenges', challenge);
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(['challenges', 'entries'], 'readwrite');
  
  // Delete challenge
  await tx.objectStore('challenges').delete(challengeId);

  // Delete associated entries
  const index = tx.objectStore('entries').index('by-challenge');
  let cursor = await index.openCursor(challengeId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

// ---------------- ENTRIES REPOSITORY ---------------- //

export async function getEntriesForChallenge(challengeId: string): Promise<SavingsEntry[]> {
  const db = await getDatabase();
  const entries = await db.getAllFromIndex('entries', 'by-challenge', challengeId);
  return entries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export async function saveEntriesBatch(entries: SavingsEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await getDatabase();
  const tx = db.transaction('entries', 'readwrite');
  for (const entry of entries) {
    await tx.store.put(entry);
  }
  await tx.done;
}

export async function updateEntryRecord(entry: SavingsEntry): Promise<void> {
  const db = await getDatabase();
  await db.put('entries', entry);
}

export async function deleteEntryRecord(entryId: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('entries', entryId);
}

export async function deleteEntriesForChallenge(challengeId: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('entries', 'readwrite');
  const index = tx.store.index('by-challenge');
  let cursor = await index.openCursor(challengeId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ---------------- SPLIT TRANSACTIONS REPOSITORY ---------------- //

export async function getAllSplitTransactions(): Promise<SplitTransaction[]> {
  const db = await getDatabase();
  const list = await db.getAll('split_transactions');
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function saveSplitTransaction(txRecord: SplitTransaction): Promise<void> {
  const db = await getDatabase();
  await db.put('split_transactions', txRecord);
}

export async function deleteSplitTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('split_transactions', id);
}

// ---------------- SETTINGS REPOSITORY ---------------- //

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = await getDatabase();
    const record = await db.get('settings', 'app_config');
    if (record && record.value) {
      return { ...DEFAULT_SETTINGS, ...record.value };
    }
  } catch (err) {
    console.error('Error reading app settings from IDB:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const db = await getDatabase();
  await db.put('settings', { key: 'app_config', value: settings });
}

// ---------------- BACKUP & RESTORE ---------------- //

export async function exportAllData(): Promise<AppBackupData> {
  const db = await getDatabase();
  const [challenges, entries, settings, splitTransactions] = await Promise.all([
    db.getAll('challenges'),
    db.getAll('entries'),
    getAppSettings(),
    db.getAll('split_transactions'),
  ]);

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    challenges,
    entries,
    splitTransactions,
  };
}

export async function importAllData(backup: AppBackupData): Promise<void> {
  if (!backup || !backup.challenges || !backup.entries) {
    throw new Error('Invalid backup file format.');
  }

  const db = await getDatabase();
  const tx = db.transaction(['challenges', 'entries', 'settings', 'split_transactions'], 'readwrite');

  // Clear existing
  await tx.objectStore('challenges').clear();
  await tx.objectStore('entries').clear();
  await tx.objectStore('settings').clear();
  await tx.objectStore('split_transactions').clear();

  // Import challenges
  for (const c of backup.challenges) {
    await tx.objectStore('challenges').put(c);
  }

  // Import entries
  for (const e of backup.entries) {
    await tx.objectStore('entries').put(e);
  }

  // Import split transactions
  if (backup.splitTransactions) {
    for (const s of backup.splitTransactions) {
      await tx.objectStore('split_transactions').put(s);
    }
  }

  // Import settings
  if (backup.settings) {
    await tx.objectStore('settings').put({ key: 'app_config', value: backup.settings });
  }

  await tx.done;
}

export async function resetAllData(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(['challenges', 'entries', 'settings', 'split_transactions'], 'readwrite');
  await tx.objectStore('challenges').clear();
  await tx.objectStore('entries').clear();
  await tx.objectStore('settings').clear();
  await tx.objectStore('split_transactions').clear();
  await tx.done;
}
