import { useEffect, useState, type CSSProperties } from 'react';
import type { RoundSeconds, Skill } from '../types/game';
import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import { LevelBadge } from './LevelBadge';

export type RushResult = {
  roundSeconds: RoundSeconds;
  score: number; correct: number; wrong: number; accuracy: number;
  bestStreak: number; xpEarned: number; xpAfter: number;
  levelBefore: number; levelAfter: number;
  strongest: Skill | null; weakest: Skill | null;
  newBest: boolean; hiddenBefore: number; hiddenAfter: number; averageTimeMs: number;
};

const CONFETTI_COLORS = ['#f8ff62', '#69ffe5', '#ff42d2', '#8738ff', '#ff9f4a', '#ffffff', '#ff3c6a'];

interface ConfettiPiece {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  col: string;
  sz: number;
  dur: number;
  delay: number;
}

function makeConfetti(): ConfettiPiece[] {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  return Array.from({ length: 86 }, (_, index) => ({
    id: index,
    tx: (Math.random() - 0.5) * width * 0.96,
    ty: -120 - Math.random() * 210,
    rot: (Math.random() - 0.5) * 1080,
    col: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    sz: 7 + Math.random() * 12,
    dur: 2.6 + Math.random() * 1.8,
    delay: Math.random() * 0.85,
  }));
}

const label = (skill: Skill | null) => skill ? skill[0].toUpperCase() + skill.slice(1) : 'No data yet';

export function ResultsScreen({ result, bestScore, onPlayAgain, onBack }: { result: RushResult; bestScore: number; onPlayAgain: () => void; onBack: () => void }) {
  const level = getLevel(result.levelAfter);
  const progress = levelProgress(result.levelAfter, result.xpAfter);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (result.newBest) setConfetti(makeConfetti());
  }, [result.newBest]);

  return <main className={result.newBest ? 'screen center best' : 'screen center'}>
    {confetti.map((piece) => <div
      key={piece.id}
      className="confetti-piece"
      style={{ '--tx': `${piece.tx}px`, '--ty': `${piece.ty}px`, '--rot': `${piece.rot}deg`, '--col': piece.col, '--sz': `${piece.sz}px`, '--dur': `${piece.dur}s`, '--delay': `${piece.delay}s` } as CSSProperties}
    />)}

    <section className="hero results">
      <p className="eyebrow">{result.roundSeconds}s Rush Complete</p>
      <h1>{result.newBest ? 'New Best!' : 'Results'}</h1>
      <div className="result-score">{result.score}</div>
      <p className="copy">Shared family best: {bestScore}</p>

      <div className="result-grid">
        <div className="stat"><span>Round</span><b>{result.roundSeconds}s</b></div>
        <div className="stat"><span>Correct</span><b>{result.correct}</b></div>
        <div className="stat"><span>Wrong</span><b>{result.wrong}</b></div>
        <div className="stat"><span>Accuracy</span><b>{result.accuracy}%</b></div>
        <div className="stat"><span>Best Streak</span><b>{result.bestStreak}</b></div>
        <div className="stat"><span>XP Earned</span><b>+{result.xpEarned}</b></div>
        <div className="stat"><span>Avg Speed</span><b>{(result.averageTimeMs / 1000).toFixed(1)}s</b></div>
      </div>

      <div className="level-row">
        <LevelBadge level={level.level} label={level.title} />
        {result.levelAfter > result.levelBefore && <span className="chip">Level Up!</span>}
      </div>

      <div className="progress">
        <div><span>{result.xpAfter} XP total</span><b>{progress.percent}%</b></div>
        <i><em style={{ width: `${progress.percent}%` }} /></i>
        <small>{progress.next ? `${progress.remaining} XP to next level` : 'Maximum level reached'}</small>
      </div>

      <div className="skill-summary">
        <div><span>Strongest Skill</span><b>{label(result.strongest)}</b></div>
        <div><span>Weakest Skill</span><b>{label(result.weakest)}</b></div>
      </div>

      <p className="adaptive">Difficulty: {result.hiddenBefore.toFixed(2)} → {result.hiddenAfter.toFixed(2)}</p>
      <div className="actions"><button className="primary" onClick={onPlayAgain}>Play Again</button><button className="secondary" onClick={onBack}>Back to Start</button></div>
    </section>
  </main>;
}
