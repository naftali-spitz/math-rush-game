export const MAX_LEVEL = 9;

export const LEVELS = [
  { level: 1, title: 'Addition Rookie', xp: 0, description: 'Addition up to 10' },
  { level: 2, title: 'Subtraction Starter', xp: 100, description: 'Subtraction up to 10' },
  { level: 3, title: 'Number Runner', xp: 250, description: 'Addition and subtraction up to 20' },
  { level: 4, title: 'Times Table Rookie', xp: 500, description: 'Multiplication 2–5' },
  { level: 5, title: 'Multiplication Master', xp: 900, description: 'Multiplication 2–10' },
  { level: 6, title: 'Mixed Mode', xp: 1400, description: 'Mixed operations' },
  { level: 7, title: 'Division Dash', xp: 2000, description: 'Division and negatives' },
  { level: 8, title: 'Negative Speed', xp: 2800, description: 'Medium division and negative multiplication' },
  { level: 9, title: 'Math Boss', xp: 3800, description: 'Hard mixed operations' },
] as const;

export function getLevel(level: number) {
  return LEVELS.find((item) => item.level === level) ?? LEVELS[0];
}

export function xpForLevel(level: number) {
  return getLevel(level).xp;
}

export function xpForNextLevel(level: number) {
  return LEVELS.find((item) => item.level === level + 1)?.xp ?? null;
}

export function accuracyRequirement(nextLevel: number) {
  if (nextLevel <= 3) return 75;
  if (nextLevel <= 6) return 80;
  return 85;
}
