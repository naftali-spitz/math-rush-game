export const FAST_ANSWER_MS = 3000;

export function scoreAnswer(input: { correct: boolean; timeMs: number; level: number; streak: number }) {
  if (!input.correct) return { points: 0, fast: false, combo: false };
  const fast = input.timeMs < FAST_ANSWER_MS;
  const combo = input.streak > 0 && input.streak % 5 === 0;
  const points = 10 + (fast ? 5 : 0) + input.level * 2 + (combo ? 25 : 0);
  return { points, fast, combo };
}

export function accuracy(correct: number, wrong: number) {
  const total = correct + wrong;
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function rushXp(input: { correct: number; fast: number; newBest: boolean; accuracy: number }) {
  return 10 + input.correct * 2 + input.fast + (input.newBest ? 25 : 0) + (input.accuracy > 90 ? 20 : 0);
}
