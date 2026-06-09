import { MAX_LEVEL, accuracyRequirement, xpForLevel, xpForNextLevel } from './levels';

export function applyLevelProgression(level: number, xp: number, recentAccuracy: number) {
  if (level >= MAX_LEVEL) return MAX_LEVEL;
  const next = level + 1;
  const nextXp = xpForNextLevel(level);
  if (nextXp === null) return level;
  return xp >= nextXp && recentAccuracy >= accuracyRequirement(next) ? next : level;
}

export function levelProgress(level: number, xp: number) {
  const floor = xpForLevel(level);
  const next = xpForNextLevel(level);
  if (next === null) return { percent: 100, remaining: 0, next: null as number | null };
  const needed = next - floor;
  const earned = Math.max(0, xp - floor);
  return { percent: Math.min(100, Math.round((earned / needed) * 100)), remaining: Math.max(0, next - xp), next };
}
