import type { AppData, AppSettings, PlayerData, RushHistoryRecord, Skill, SkillStats } from '../types/game';

const DB_NAME = 'math-rush-local-db';
const DB_VERSION = 1;
const SETTINGS_ID = 'global';
const LEGACY_LOCAL_STORAGE_KEY = 'math-rush-save-v1';

const SKILLS: Skill[] = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'];

const blankSkillStats = (): SkillStats => ({ correct: 0, wrong: 0, totalTimeMs: 0 });

export function createDefaultSkillStats(): Record<Skill, SkillStats> {
  return {
    addition: blankSkillStats(),
    subtraction: blankSkillStats(),
    multiplication: blankSkillStats(),
    division: blankSkillStats(),
    mixed: blankSkillStats(),
  };
}

function makeId(prefix: string) {
  if ('crypto' in window && 'randomUUID' in window.crypto) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultPlayer(name = 'Player'): PlayerData {
  const now = new Date().toISOString();
  return {
    id: makeId('player'),
    name,
    level: 1,
    xp: 0,
    bestScore: 0,
    gamesPlayed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    hiddenDifficultyAdjustment: 0,
    skillStats: createDefaultSkillStats(),
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultSettings(selectedPlayerId: string | null = null): AppSettings {
  return {
    id: SETTINGS_ID,
    selectedPlayerId,
    soundEnabled: true,
    musicEnabled: false,
  };
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('players')) db.createObjectStore('players', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('rushResults')) {
        const rushResults = db.createObjectStore('rushResults', { keyPath: 'id' });
        rushResults.createIndex('playerId', 'playerId', { unique: false });
        rushResults.createIndex('playedAt', 'playedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll<T>(db: IDBDatabase, storeName: string) {
  const transaction = db.transaction(storeName, 'readonly');
  return requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
}

async function getOne<T>(db: IDBDatabase, storeName: string, key: IDBValidKey) {
  const transaction = db.transaction(storeName, 'readonly');
  return requestToPromise<T | undefined>(transaction.objectStore(storeName).get(key));
}

async function putOne<T>(db: IDBDatabase, storeName: string, value: T) {
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
}

function migrateLegacyLocalStoragePlayer(): PlayerData | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as { player?: Partial<PlayerData> };
    if (!legacy.player) return null;
    const player = createDefaultPlayer(legacy.player.name || 'Player');
    return {
      ...player,
      ...legacy.player,
      id: player.id,
      skillStats: { ...createDefaultSkillStats(), ...legacy.player.skillStats },
      createdAt: player.createdAt,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function loadAppData(db: IDBDatabase): Promise<AppData> {
  let players = await getAll<PlayerData>(db, 'players');
  let settings = await getOne<AppSettings>(db, 'settings', SETTINGS_ID);

  if (players.length === 0) {
    const migrated = migrateLegacyLocalStoragePlayer();
    const firstPlayer = migrated ?? createDefaultPlayer('Player 1');
    await putOne(db, 'players', firstPlayer);
    players = [firstPlayer];
  }

  if (!settings) {
    settings = defaultSettings(players[0].id);
    await putOne(db, 'settings', settings);
  }

  let player = players.find((candidate) => candidate.id === settings.selectedPlayerId) ?? players[0];

  if (settings.selectedPlayerId !== player.id) {
    settings = { ...settings, selectedPlayerId: player.id };
    await putOne(db, 'settings', settings);
  }

  players = players.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  player = players.find((candidate) => candidate.id === player.id) ?? players[0];

  return { players, player, settings };
}

export async function initializeAppData() {
  const db = await openDb();
  try {
    return await loadAppData(db);
  } finally {
    db.close();
  }
}

export async function saveSettings(settings: AppSettings) {
  const db = await openDb();
  try {
    await putOne(db, 'settings', settings);
  } finally {
    db.close();
  }
}

export async function savePlayer(player: PlayerData) {
  const db = await openDb();
  try {
    await putOne(db, 'players', { ...player, updatedAt: new Date().toISOString() });
  } finally {
    db.close();
  }
}

export async function saveRushResult(result: RushHistoryRecord) {
  const db = await openDb();
  try {
    await putOne(db, 'rushResults', result);
  } finally {
    db.close();
  }
}

export async function selectPlayer(playerId: string) {
  const db = await openDb();
  try {
    const settings = (await getOne<AppSettings>(db, 'settings', SETTINGS_ID)) ?? defaultSettings(playerId);
    await putOne(db, 'settings', { ...settings, selectedPlayerId: playerId });
    return await loadAppData(db);
  } finally {
    db.close();
  }
}

export async function createPlayer(name: string) {
  const db = await openDb();
  try {
    const player = createDefaultPlayer(name.trim() || 'Player');
    await putOne(db, 'players', player);
    const settings = (await getOne<AppSettings>(db, 'settings', SETTINGS_ID)) ?? defaultSettings(player.id);
    await putOne(db, 'settings', { ...settings, selectedPlayerId: player.id });
    return await loadAppData(db);
  } finally {
    db.close();
  }
}

export function makeRushResultId() {
  return makeId('rush');
}

export function cloneSkillStats(stats: Record<Skill, SkillStats>) {
  return SKILLS.reduce((copy, skill) => {
    copy[skill] = { ...stats[skill] };
    return copy;
  }, {} as Record<Skill, SkillStats>);
}
