import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { getLevel } from '../engine/levels';
import { generateQuestion } from '../engine/questionGenerator';
import { scoreAnswer } from '../engine/scoringEngine';
import { playSound } from '../engine/soundEngine';
import type { AppSettings, Question, RoundSeconds, Skill } from '../types/game';
import { LevelBadge } from './LevelBadge';
import { QuestionCard } from './QuestionCard';
import { ScorePanel } from './ScorePanel';
import { TimerBar } from './TimerBar';

export type AnswerRecord = { question: Question; correct: boolean; timeMs: number; fast: boolean; streak: number };
export type RushSummary = { score: number; bestStreak: number; answers: AnswerRecord[]; roundSeconds: RoundSeconds };

type TimerMilestone = 50 | 75 | 90 | 95;

let particleId = 0;
interface Particle {
  id: number;
  tx: number;
  ty: number;
  col: string;
  sz: number;
  dur: number;
  sq: boolean;
}

const BURST_COLORS = ['#69ffe5', '#f8ff62', '#ff42d2', '#8738ff', '#ffffff'];
const WRONG_COLORS = ['#ff3c6a', '#ff7090', '#ff9f4a'];
const TIMER_MILESTONES: TimerMilestone[] = [50, 75, 90, 95];

function createBurst(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
    const distance = 38 + Math.random() * 42;
    return {
      id: particleId++,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      col: colors[index % colors.length],
      sz: 2.5 + Math.random() * 3.5,
      dur: 0.32 + Math.random() * 0.18,
      sq: Math.random() < 0.32,
    };
  });
}

function milestoneSound(milestone: TimerMilestone) {
  if (milestone === 50) return 'halfway' as const;
  if (milestone === 75) return 'warning' as const;
  if (milestone === 90) return 'danger' as const;
  return 'critical' as const;
}

export function GameScreen({ level, hiddenDifficultyAdjustment, settings, roundSeconds, onFinished }: { level: number; hiddenDifficultyAdjustment: number; settings: AppSettings; roundSeconds: RoundSeconds; onFinished: (s: RushSummary) => void }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(roundSeconds);
  const [question, setQuestion] = useState(() => generateQuestion(level, hiddenDifficultyAdjustment));
  const [questionKey, setQuestionKey] = useState(0);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [flashClass, setFlashClass] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);

  const startRef = useRef(Date.now());
  const answersRef = useRef<AnswerRecord[]>([]);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const finishedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const firedMilestonesRef = useRef<Set<TimerMilestone>>(new Set());

  const addBurst = useCallback((newParticles: Particle[]) => {
    setParticles((current) => [...current, ...newParticles]);
    const ids = new Set(newParticles.map((particle) => particle.id));
    const maxDurationMs = Math.max(...newParticles.map((particle) => particle.dur)) * 1000 + 80;
    window.setTimeout(() => setParticles((current) => current.filter((particle) => !ids.has(particle.id))), maxDurationMs);
  }, []);

  const flash = useCallback((className: string, ms: number) => {
    setFlashClass(className);
    window.setTimeout(() => setFlashClass(''), ms);
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    playSound('gameOver', settings.soundEnabled);
    onFinished({ score: scoreRef.current, bestStreak: bestRef.current, answers: answersRef.current, roundSeconds });
  }, [onFinished, roundSeconds, settings.soundEnabled]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          finish();
          return 0;
        }

        const next = current - 1;
        const elapsedPercent = ((roundSeconds - next) / roundSeconds) * 100;
        const milestone = TIMER_MILESTONES.find((candidate) => elapsedPercent >= candidate && !firedMilestonesRef.current.has(candidate));

        if (milestone) {
          firedMilestonesRef.current.add(milestone);
          playSound(milestoneSound(milestone), settings.soundEnabled);
        } else if (next <= 5) {
          playSound('tickFinal', settings.soundEnabled);
        } else if (next <= 10) {
          playSound('tick', settings.soundEnabled);
        }

        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(id);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [finish, roundSeconds, settings.soundEnabled]);

  const nextQuestion = useCallback(() => {
    if (finishedRef.current) return;
    setQuestion(generateQuestion(level, hiddenDifficultyAdjustment));
    setQuestionKey((current) => current + 1);
    setValue('');
    setFeedback('idle');
    setCorrectAnswer(null);
    setLocked(false);
    startRef.current = Date.now();
  }, [hiddenDifficultyAdjustment, level]);

  const submit = useCallback(() => {
    if (locked || value.trim() === '' || value.trim() === '-') return;
    const typed = Number(value);
    if (!Number.isInteger(typed)) return;

    const timeMs = Date.now() - startRef.current;
    const isCorrect = typed === question.answer;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const scored = scoreAnswer({ correct: isCorrect, timeMs, level, streak: nextStreak });

    answersRef.current = [...answersRef.current, { question, correct: isCorrect, timeMs, fast: scored.fast, streak: nextStreak }];
    setLocked(true);

    if (isCorrect) {
      scoreRef.current += scored.points;
      bestRef.current = Math.max(bestRef.current, nextStreak);
      setScore(scoreRef.current);
      setStreak(nextStreak);
      setBestStreak(bestRef.current);
      setCorrect((current) => current + 1);
      setFeedback('correct');
      setPulse(true);
      flash('flash-correct', 180);
      if (scored.combo) addBurst(createBurst(8, BURST_COLORS));
      else addBurst(createBurst(4, BURST_COLORS));
      playSound(scored.combo ? 'streak' : 'correct', settings.soundEnabled, nextStreak);
      window.setTimeout(() => setPulse(false), 180);
      timeoutRef.current = window.setTimeout(nextQuestion, scored.combo ? 330 : 185);
    } else {
      setStreak(0);
      setWrong((current) => current + 1);
      setFeedback('wrong');
      setCorrectAnswer(question.answer);
      flash('flash-wrong', 360);
      addBurst(createBurst(6, WRONG_COLORS));
      playSound('wrong', settings.soundEnabled);
      timeoutRef.current = window.setTimeout(nextQuestion, 950);
    }
  }, [addBurst, flash, level, locked, nextQuestion, question, settings.soundEnabled, streak, value]);

  const levelInfo = getLevel(level);
  const remainingPercent = (secondsLeft / roundSeconds) * 100;
  const backgroundClass = remainingPercent <= 10 ? 'screen game panic-bg' : remainingPercent <= 25 ? 'screen game danger-bg' : 'screen game';

  return <main className={backgroundClass}>
    <div className={`screen-flash ${flashClass}`} />

    {particles.map((particle) => <div
      key={particle.id}
      className={`particle${particle.sq ? ' sq' : ''}`}
      style={{ '--tx': `${particle.tx}px`, '--ty': `${particle.ty}px`, '--col': particle.col, '--sz': `${particle.sz}px`, '--dur': `${particle.dur}s` } as CSSProperties}
    />)}

    <div className="topbar"><TimerBar secondsLeft={secondsLeft} totalSeconds={roundSeconds} /><LevelBadge level={levelInfo.level} label={levelInfo.title} /></div>
    <ScorePanel score={score} streak={streak} bestStreak={bestStreak} correct={correct} wrong={wrong} pulse={pulse} />
    <QuestionCard key={questionKey} question={question} value={value} feedback={feedback} correctAnswer={correctAnswer} disabled={locked} onChange={setValue} onSubmit={submit} />
    <p className="hint">{roundSeconds}s Rush · Numbers · Backspace · Minus · Enter</p>
  </main>;
}

export function rankSkills(answers: AnswerRecord[]) {
  const stats: Record<Skill, { correct: number; wrong: number; time: number }> = { addition: { correct: 0, wrong: 0, time: 0 }, subtraction: { correct: 0, wrong: 0, time: 0 }, multiplication: { correct: 0, wrong: 0, time: 0 }, division: { correct: 0, wrong: 0, time: 0 }, mixed: { correct: 0, wrong: 0, time: 0 } };
  answers.forEach((answer) => {
    const skill = stats[answer.question.skill];
    answer.correct ? skill.correct++ : skill.wrong++;
    skill.time += answer.timeMs;
  });
  const ranked = (Object.keys(stats) as Skill[])
    .map((skill) => ({ skill, attempts: stats[skill].correct + stats[skill].wrong, acc: stats[skill].correct / Math.max(1, stats[skill].correct + stats[skill].wrong), time: stats[skill].time }))
    .filter((item) => item.attempts > 0);
  return {
    stats,
    strongest: ranked.sort((a, b) => b.acc - a.acc || a.time - b.time)[0]?.skill ?? null,
    weakest: ranked.sort((a, b) => a.acc - b.acc || b.time - a.time)[0]?.skill ?? null,
  };
}
