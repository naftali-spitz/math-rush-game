export type Skill = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
export type AvatarColor = 'cyan' | 'purple' | 'yellow' | 'pink' | 'green' | 'orange' | 'blue';
export type ThemeColor = AvatarColor;
export type StyleTheme = 'futuristic' | 'modern' | 'kids';
export type RoundSeconds = 30 | 60 | 90;

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
  avatarIcon: string;
  avatarColor: AvatarColor;
  themeColor: ThemeColor;
  styleTheme: StyleTheme;
  soundEnabled: boolean;
  musicEnabled: boolean;
  skillStats: Record<Skill, SkillStats>;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  themeColor: ThemeColor;
  styleTheme: StyleTheme;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  level: number;
  bestScore: number;
  gamesPlayed: number;
  avatarIcon: string;
  avatarColor: AvatarColor;
  themeColor: ThemeColor;
  styleTheme: StyleTheme;
};

export type AppData = {
  players: PlayerData[];
  leaderboard: LeaderboardEntry[];
};

export type RushHistoryRecord = {
  id: string;
  playerId: string;
  roundSeconds: RoundSeconds;
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

export type CreatePlayerInput = {
  name: string;
  avatarIcon: string;
  avatarColor: AvatarColor;
  themeColor?: ThemeColor;
  styleTheme?: StyleTheme;
};

export type SaveRushResultInput = {
  playerId: string;
  roundSeconds: RoundSeconds;
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

export type Screen = 'choose' | 'admin' | 'start' | 'countdown' | 'game' | 'results';
