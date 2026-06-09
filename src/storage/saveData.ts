import type { SaveData, SkillStats } from '../types/game';

const KEY = 'math-rush-save-v1';
export const SKILLS = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'] as const;
const blank = (): SkillStats => ({ correct: 0, wrong: 0, totalTimeMs: 0 });

export function defaultSaveData(): SaveData {
  return {
    player: {
      name: 'Player',
      level: 1,
      xp: 0,
      bestScore: 0,
      gamesPlayed: 0,
      totalCorrect: 0,
      totalWrong: 0,
      hiddenDifficultyAdjustment: 0,
      skillStats: { addition: blank(), subtraction: blank(), multiplication: blank(), division: blank(), mixed: blank() },
    },
    settings: { soundEnabled: true, musicEnabled: false },
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSaveData();
    return { ...defaultSaveData(), ...JSON.parse(raw) } as SaveData;
  } catch {
    return defaultSaveData();
  }
}

export function saveData(data: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
