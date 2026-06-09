import type { Question, Skill } from '../types/game';

let sequence = 0;
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: T[]) => items[rand(0, items.length - 1)];
const neg = (n: number, chance = 0.35) => (Math.random() < chance ? -n : n);

function q(text: string, answer: number, skill: Skill, difficulty: number): Question {
  sequence += 1;
  return { id: `${Date.now()}-${sequence}`, text, answer, skill, difficulty };
}

function add(max: number, allowNegative = false, d = 1) {
  const a = allowNegative ? neg(rand(0, max)) : rand(0, max);
  const b = allowNegative ? neg(rand(0, max)) : rand(0, max);
  return q(`${a} + ${b}`, a + b, 'addition', d);
}

function sub(max: number, allowNegative = false, d = 1) {
  let a = rand(0, max);
  let b = rand(0, max);
  if (!allowNegative && b > a) [a, b] = [b, a];
  if (allowNegative) {
    a = neg(a);
    b = neg(b, 0.25);
  }
  return q(`${a} − ${b}`, a - b, 'subtraction', d);
}

function mul(min: number, max: number, allowNegative = false, d = 1) {
  const a = allowNegative ? neg(rand(min, max)) : rand(min, max);
  const b = rand(min, max);
  return q(`${a} × ${b}`, a * b, 'multiplication', d);
}

function div(maxAnswer: number, maxDivisor: number, allowNegative = false, d = 1) {
  const answer = allowNegative ? neg(rand(1, maxAnswer), 0.25) : rand(1, maxAnswer);
  const divisor = rand(2, maxDivisor);
  return q(`${answer * divisor} ÷ ${divisor}`, answer, 'division', d);
}

function twoStep() {
  const a = rand(2, 12);
  const b = rand(2, 12);
  const c = rand(5, 30);
  return q(`${a} × ${b} − ${c}`, a * b - c, 'mixed', 9);
}

function easy(level: number) {
  if (level < 3) return add(8, false, 1);
  if (level < 5) return pick([add(12, false, 2), sub(12, false, 2)]);
  return pick([mul(2, 5, false, 3), div(6, 5, false, 3)]);
}

export function generateQuestion(level: number, hiddenDifficultyAdjustment: number): Question {
  const l = Math.max(1, Math.min(9, level));
  const challenge = hiddenDifficultyAdjustment >= 0.75 && Math.random() < 0.22;
  if (hiddenDifficultyAdjustment <= -0.75 && Math.random() < 0.25) return easy(l);

  if (l === 1) return add(challenge ? 14 : 10, false, 1);
  if (l === 2) return sub(challenge ? 14 : 10, false, 2);
  if (l === 3) return Math.random() < 0.5 ? add(challenge ? 26 : 20, false, 3) : sub(challenge ? 26 : 20, false, 3);
  if (l === 4) return mul(2, challenge ? 6 : 5, false, 4);
  if (l === 5) return mul(2, challenge ? 12 : 10, false, 5);
  if (l === 6) return pick([add(30, challenge, 6), sub(30, challenge, 6), mul(2, 10, false, 6), div(10, 8, false, 6)]);
  if (l === 7) return pick([div(12, 10, false, 7), div(12, 10, false, 7), add(35, true, 7), sub(40, true, 7), mul(2, 10, false, 7)]);
  if (l === 8) return pick([div(16, 12, true, 8), mul(2, 12, true, 8), mul(10, 12, false, 8), sub(60, true, 8)]);
  return Math.random() < 0.16 || challenge ? twoStep() : pick([div(20, 15, true, 9), mul(6, 14, true, 9), add(90, true, 9), sub(90, true, 9)]);
}
