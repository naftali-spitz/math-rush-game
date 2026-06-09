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

export type SaveData = {
  player: {
    name: string;
    level: number;
    xp: number;
    bestScore: number;
    gamesPlayed: number;
    totalCorrect: number;
    totalWrong: number;
    hiddenDifficultyAdjustment: number;
    skillStats: Record<Skill, SkillStats>;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
};

export type Screen = 'start' | 'countdown' | 'game' | 'results';
