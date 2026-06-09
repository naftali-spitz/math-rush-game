import { useCallback, useEffect, useRef, useState } from 'react';
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

export function GameScreen({ level, hiddenDifficultyAdjustment, settings, roundSeconds, onFinished }: { level: number; hiddenDifficultyAdjustment: number; settings: AppSettings; roundSeconds: RoundSeconds; onFinished: (s: RushSummary) => void }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(roundSeconds);
  const [question, setQuestion] = useState(() => generateQuestion(level, hiddenDifficultyAdjustment));
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
  const startRef = useRef(Date.now());
  const answersRef = useRef<AnswerRecord[]>([]);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const finishedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    playSound('gameOver', settings.soundEnabled);
    onFinished({ score: scoreRef.current, bestStreak: bestRef.current, answers: answersRef.current, roundSeconds });
  }, [onFinished, roundSeconds, settings.soundEnabled]);

  useEffect(() => {
    const id = window.setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { window.clearInterval(id); finish(); return 0; }
      return s - 1;
    }), 1000);
    return () => { window.clearInterval(id); if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [finish]);

  const nextQuestion = useCallback(() => {
    if (finishedRef.current) return;
    setQuestion(generateQuestion(level, hiddenDifficultyAdjustment));
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
      setScore(scoreRef.current); setStreak(nextStreak); setBestStreak(bestRef.current); setCorrect((n) => n + 1); setFeedback('correct'); setPulse(true);
      playSound(scored.combo ? 'streak' : 'correct', settings.soundEnabled);
      window.setTimeout(() => setPulse(false), 220);
      timeoutRef.current = window.setTimeout(nextQuestion, scored.combo ? 360 : 180);
    } else {
      setStreak(0); setWrong((n) => n + 1); setFeedback('wrong'); setCorrectAnswer(question.answer);
      playSound('wrong', settings.soundEnabled);
      timeoutRef.current = window.setTimeout(nextQuestion, 950);
    }
  }, [level, locked, nextQuestion, question, settings.soundEnabled, streak, value]);

  const levelInfo = getLevel(level);
  return <main className={secondsLeft <= 10 ? 'screen game danger-bg' : 'screen game'}>
    <div className="topbar"><TimerBar secondsLeft={secondsLeft} totalSeconds={roundSeconds} /><LevelBadge level={levelInfo.level} label={levelInfo.title} /></div>
    <ScorePanel score={score} streak={streak} bestStreak={bestStreak} correct={correct} wrong={wrong} pulse={pulse} />
    <QuestionCard question={question} value={value} feedback={feedback} correctAnswer={correctAnswer} disabled={locked} onChange={setValue} onSubmit={submit} />
    <p className="hint">{roundSeconds}s Rush · Numbers · Backspace · Minus · Enter</p>
  </main>;
}

export function rankSkills(answers: AnswerRecord[]) {
  const stats: Record<Skill, { correct: number; wrong: number; time: number }> = { addition: { correct: 0, wrong: 0, time: 0 }, subtraction: { correct: 0, wrong: 0, time: 0 }, multiplication: { correct: 0, wrong: 0, time: 0 }, division: { correct: 0, wrong: 0, time: 0 }, mixed: { correct: 0, wrong: 0, time: 0 } };
  answers.forEach((a) => { const s = stats[a.question.skill]; a.correct ? s.correct++ : s.wrong++; s.time += a.timeMs; });
  const ranked = (Object.keys(stats) as Skill[]).map((skill) => ({ skill, attempts: stats[skill].correct + stats[skill].wrong, acc: stats[skill].correct / Math.max(1, stats[skill].correct + stats[skill].wrong), time: stats[skill].time })).filter((x) => x.attempts > 0);
  return { stats, strongest: ranked.sort((a, b) => b.acc - a.acc || a.time - b.time)[0]?.skill ?? null, weakest: ranked.sort((a, b) => a.acc - b.acc || b.time - a.time)[0]?.skill ?? null };
}
