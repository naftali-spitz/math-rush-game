export type Skill = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';

export type Question = {
  id: string;
  text: string;
  answer: number;
  skill: Skill;
  difficulty: number;
};

export type SkillStats = {
  correct: number;
  wrong: number;
  totalTimeMs: number;
};

export type PlayerData = {
  id: string;
  name: string;
  level: number;
  xp: number;
  bestScore: number;
  gamesPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  hiddenDifficultyAdjustment: number;
  skillStats: Record<Skill, SkillStats>;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  id: 'global';
  selectedPlayerId: string | null;
  soundEnabled: boolean;
  musicEnabled: boolean;
};

export type AppData = {
  players: PlayerData[];
  player: PlayerData;
  settings: AppSettings;
};

export type RushHistoryRecord = {
  id: string;
  playerId: string;
  score: number;
  correct: number;
  wrong: number;
  accuracy: number;
  bestStreak: number;
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  averageTimeMs: number;
  playedAt: string;
};

export type SaveData = {
  player: PlayerData;
  settings: AppSettings;
};

export type Screen = 'start' | 'countdown' | 'game' | 'results';
