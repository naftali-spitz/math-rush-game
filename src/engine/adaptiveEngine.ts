export function updateHiddenDifficultyAdjustment(input: { current: number; accuracy: number; answered: number; averageTimeMs: number }) {
  let next = input.current;
  if (input.accuracy >= 90 && input.answered >= 20 && input.averageTimeMs <= 4200) next += 0.25;
  else if (input.accuracy <= 60 && input.answered >= 5) next -= 0.35;
  return Math.max(-2, Math.min(2, Number(next.toFixed(2))));
}
