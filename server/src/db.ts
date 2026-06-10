import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = process.env.MATH_RUSH_DATA_DIR ?? path.resolve(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'math-rush.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const skills = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'] as const;
type Skill = typeof skills[number];
type AvatarColor = 'cyan' | 'purple' | 'yellow' | 'pink' | 'green' | 'orange' | 'blue';
type ThemeColor = AvatarColor;
type StyleTheme = 'futuristic' | 'modern' | 'kids';

const themeColors = new Set<ThemeColor>(['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue']);
const styleThemes = new Set<StyleTheme>(['futuristic', 'modern', 'kids']);

type SkillStats = { correct: number; wrong: number; totalTimeMs: number };
type PlayerRow = {
  id: string; name: string; level: number; xp: number; bestScore: number; gamesPlayed: number;
  totalCorrect: number; totalWrong: number; hiddenDifficultyAdjustment: number; avatarIcon: string;
  avatarColor: AvatarColor; themeColor: ThemeColor; styleTheme: StyleTheme; soundEnabled: number; musicEnabled: number; createdAt: string; updatedAt: string;
};

type Player = Omit<PlayerRow, 'soundEnabled' | 'musicEnabled'> & {
  soundEnabled: boolean;
  musicEnabled: boolean;
  skillStats: Record<Skill, SkillStats>;
};

type RushPayload = {
  playerId: string;
  roundSeconds: 30 | 60 | 90;
  score: number;
  correct: number;
  wrong: number;
  accuracy: number;
  bestStreak: number;
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  averageTimeMs: number;
  hiddenDifficultyAdjustment: number;
  skillStatsDelta: Record<Skill, { correct: number; wrong: number; time: number }>;
};

function now() { return new Date().toISOString(); }
function id() { return crypto.randomUUID(); }
function bool(n: number) { return n === 1; }
function int(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.trunc(n) : fallback; }
function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function cleanThemeColor(value: unknown, fallback: ThemeColor = 'cyan'): ThemeColor { return themeColors.has(value as ThemeColor) ? value as ThemeColor : fallback; }
function cleanStyleTheme(value: unknown, fallback: StyleTheme = 'futuristic'): StyleTheme { return styleThemes.has(value as StyleTheme) ? value as StyleTheme : fallback; }
function ensureColumn(columnName: string, ddl: string) {
  try { db.prepare(`SELECT ${columnName} FROM players LIMIT 1`).get(); }
  catch { db.exec(ddl); }
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      bestScore INTEGER NOT NULL DEFAULT 0,
      gamesPlayed INTEGER NOT NULL DEFAULT 0,
      totalCorrect INTEGER NOT NULL DEFAULT 0,
      totalWrong INTEGER NOT NULL DEFAULT 0,
      hiddenDifficultyAdjustment REAL NOT NULL DEFAULT 0,
      avatarIcon TEXT NOT NULL DEFAULT '🚀',
      avatarColor TEXT NOT NULL DEFAULT 'cyan',
      themeColor TEXT NOT NULL DEFAULT 'cyan',
      styleTheme TEXT NOT NULL DEFAULT 'futuristic',
      soundEnabled INTEGER NOT NULL DEFAULT 1,
      musicEnabled INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS skill_stats (
      playerId TEXT NOT NULL,
      skill TEXT NOT NULL,
      correct INTEGER NOT NULL DEFAULT 0,
      wrong INTEGER NOT NULL DEFAULT 0,
      totalTimeMs INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playerId, skill),
      FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS rush_results (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      roundSeconds INTEGER NOT NULL,
      score INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      wrong INTEGER NOT NULL,
      accuracy INTEGER NOT NULL,
      bestStreak INTEGER NOT NULL,
      xpEarned INTEGER NOT NULL,
      levelBefore INTEGER NOT NULL,
      levelAfter INTEGER NOT NULL,
      averageTimeMs INTEGER NOT NULL,
      playedAt TEXT NOT NULL,
      FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_rush_results_player_played ON rush_results(playerId, playedAt DESC);
  `);

  ensureColumn('themeColor', "ALTER TABLE players ADD COLUMN themeColor TEXT NOT NULL DEFAULT 'cyan'");
  ensureColumn('styleTheme', "ALTER TABLE players ADD COLUMN styleTheme TEXT NOT NULL DEFAULT 'futuristic'");
}

function emptySkillStats(): Record<Skill, SkillStats> {
  return { addition: { correct: 0, wrong: 0, totalTimeMs: 0 }, subtraction: { correct: 0, wrong: 0, totalTimeMs: 0 }, multiplication: { correct: 0, wrong: 0, totalTimeMs: 0 }, division: { correct: 0, wrong: 0, totalTimeMs: 0 }, mixed: { correct: 0, wrong: 0, totalTimeMs: 0 } };
}

function ensureSkillRows(playerId: string) {
  const stmt = db.prepare('INSERT OR IGNORE INTO skill_stats (playerId, skill) VALUES (?, ?)');
  for (const skill of skills) stmt.run(playerId, skill);
}

function getSkillStats(playerId: string) {
  ensureSkillRows(playerId);
  const stats = emptySkillStats();
  const rows = db.prepare('SELECT skill, correct, wrong, totalTimeMs FROM skill_stats WHERE playerId = ?').all(playerId) as Array<{ skill: Skill; correct: number; wrong: number; totalTimeMs: number }>;
  for (const row of rows) stats[row.skill] = { correct: row.correct, wrong: row.wrong, totalTimeMs: row.totalTimeMs };
  return stats;
}

function toPlayer(row: PlayerRow): Player {
  return { ...row, themeColor: cleanThemeColor(row.themeColor), styleTheme: cleanStyleTheme(row.styleTheme), soundEnabled: bool(row.soundEnabled), musicEnabled: bool(row.musicEnabled), skillStats: getSkillStats(row.id) };
}

export function getPlayers() {
  const rows = db.prepare('SELECT * FROM players ORDER BY createdAt ASC').all() as PlayerRow[];
  return rows.map(toPlayer);
}

export function getPlayer(playerId: string) {
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as PlayerRow | undefined;
  return row ? toPlayer(row) : null;
}

export function getLeaderboard() {
  return db.prepare('SELECT id, name, level, bestScore, gamesPlayed, avatarIcon, avatarColor, themeColor, styleTheme FROM players ORDER BY bestScore DESC, xp DESC, name ASC LIMIT 10').all();
}

export function createPlayer(input: { name: string; avatarIcon?: string; avatarColor?: AvatarColor; themeColor?: ThemeColor; styleTheme?: StyleTheme }) {
  const cleanName = String(input.name ?? '').trim().slice(0, 18);
  if (!cleanName) throw new Error('Player name is required.');
  const playerId = id();
  const createdAt = now();
  const themeColor = cleanThemeColor(input.themeColor, cleanThemeColor(input.avatarColor, 'cyan'));
  const styleTheme = cleanStyleTheme(input.styleTheme);
  db.prepare('INSERT INTO players (id, name, avatarIcon, avatarColor, themeColor, styleTheme, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(playerId, cleanName, input.avatarIcon || '🚀', input.avatarColor || 'cyan', themeColor, styleTheme, createdAt, createdAt);
  ensureSkillRows(playerId);
  return getPlayer(playerId)!;
}

export function updatePlayer(playerId: string, input: Partial<{ name: string; avatarIcon: string; avatarColor: AvatarColor; themeColor: ThemeColor; styleTheme: StyleTheme; soundEnabled: boolean; musicEnabled: boolean }>) {
  const existing = getPlayer(playerId);
  if (!existing) throw new Error('Player not found.');
  const next = {
    name: input.name === undefined ? existing.name : String(input.name).trim().slice(0, 18),
    avatarIcon: input.avatarIcon ?? existing.avatarIcon,
    avatarColor: input.avatarColor ?? existing.avatarColor,
    themeColor: input.themeColor === undefined ? existing.themeColor : cleanThemeColor(input.themeColor, existing.themeColor),
    styleTheme: input.styleTheme === undefined ? existing.styleTheme : cleanStyleTheme(input.styleTheme, existing.styleTheme),
    soundEnabled: input.soundEnabled === undefined ? existing.soundEnabled : Boolean(input.soundEnabled),
    musicEnabled: input.musicEnabled === undefined ? existing.musicEnabled : Boolean(input.musicEnabled),
    updatedAt: now(),
  };
  db.prepare('UPDATE players SET name = ?, avatarIcon = ?, avatarColor = ?, themeColor = ?, styleTheme = ?, soundEnabled = ?, musicEnabled = ?, updatedAt = ? WHERE id = ?')
    .run(next.name || existing.name, next.avatarIcon, next.avatarColor, next.themeColor, next.styleTheme, next.soundEnabled ? 1 : 0, next.musicEnabled ? 1 : 0, next.updatedAt, playerId);
  return getPlayer(playerId)!;
}

export function getHistory(playerId: string, limit = 10) {
  return db.prepare('SELECT * FROM rush_results WHERE playerId = ? ORDER BY playedAt DESC LIMIT ?').all(playerId, limit);
}

export const saveRushResult = db.transaction((payload: RushPayload) => {
  const player = getPlayer(payload.playerId);
  if (!player) throw new Error('Player not found.');
  const score = Math.max(0, int(payload.score));
  const correct = Math.max(0, int(payload.correct));
  const wrong = Math.max(0, int(payload.wrong));
  const xpEarned = Math.max(0, int(payload.xpEarned));
  const playedAt = now();
  const levelAfter = Math.max(1, int(payload.levelAfter, player.level));
  db.prepare('INSERT INTO rush_results (id, playerId, roundSeconds, score, correct, wrong, accuracy, bestStreak, xpEarned, levelBefore, levelAfter, averageTimeMs, playedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id(), player.id, int(payload.roundSeconds, 60), score, correct, wrong, int(payload.accuracy), int(payload.bestStreak), xpEarned, int(payload.levelBefore, player.level), levelAfter, int(payload.averageTimeMs), playedAt);
  db.prepare('UPDATE players SET level = ?, xp = ?, bestScore = ?, gamesPlayed = gamesPlayed + 1, totalCorrect = totalCorrect + ?, totalWrong = totalWrong + ?, hiddenDifficultyAdjustment = ?, updatedAt = ? WHERE id = ?')
    .run(levelAfter, player.xp + xpEarned, Math.max(player.bestScore, score), correct, wrong, num(payload.hiddenDifficultyAdjustment), playedAt, player.id);
  const skillStmt = db.prepare('UPDATE skill_stats SET correct = correct + ?, wrong = wrong + ?, totalTimeMs = totalTimeMs + ? WHERE playerId = ? AND skill = ?');
  for (const skill of skills) {
    const delta = payload.skillStatsDelta?.[skill] ?? { correct: 0, wrong: 0, time: 0 };
    skillStmt.run(Math.max(0, int(delta.correct)), Math.max(0, int(delta.wrong)), Math.max(0, int(delta.time)), player.id, skill);
  }
  return getPlayer(player.id)!;
});
