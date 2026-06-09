import { useState } from 'react';
import type { RoundSeconds, Skill } from '../types/game';
import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import { LevelBadge } from './LevelBadge';

export type RushResult = {
  roundSeconds: RoundSeconds;
  score: number;
  correct: number;
  wrong: number;
  accuracy: number;
  bestStreak: number;
  xpEarned: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  strongest: Skill | null;
  weakest: Skill | null;
  newBest: boolean;
  hiddenBefore: number;
  hiddenAfter: number;
  averageTimeMs: number;
};

type ResultTab = 'stats' | 'skills' | 'tune';
const label = (skill: Skill | null) => skill ? skill[0].toUpperCase() + skill.slice(1) : 'No data yet';

export function ResultsScreen({ result, bestScore, onPlayAgain, onBack }: { result: RushResult; bestScore: number; onPlayAgain: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<ResultTab>('stats');
  const level = getLevel(result.levelAfter);
  const progress = levelProgress(result.levelAfter, result.xpAfter);

  return <main className={result.newBest ? 'screen compact-screen best' : 'screen compact-screen'}><section className="hero results compact-card compact-results">
    <section className="result-score-card arcade-panel">
      <p className="eyebrow">{result.roundSeconds}s Rush Complete</p>
      <h1>{result.newBest ? 'New Best!' : 'Results'}</h1>
      <div className="result-score">{result.score}</div>
      <p className="copy">Shared family best score: {bestScore}</p>
      <div className="actions"><button className="primary" onClick={onPlayAgain}>Play Again</button><button className="secondary" onClick={onBack}>Back</button></div>
    </section>

    <section className="result-detail-card arcade-panel">
      <div className="level-row"><LevelBadge level={level.level} label={level.title} />{result.levelAfter > result.levelBefore && <span className="chip">Level Up!</span>}</div>
      <div className="panel-tabs">
        <button className={tab === 'stats' ? 'tab active' : 'tab'} onClick={() => setTab('stats')}>Stats</button>
        <button className={tab === 'skills' ? 'tab active' : 'tab'} onClick={() => setTab('skills')}>Skills</button>
        <button className={tab === 'tune' ? 'tab active' : 'tab'} onClick={() => setTab('tune')}>Tune</button>
      </div>
      {tab === 'stats' && <div className="result-grid compact-result-grid">
        <div className="stat"><span>Round</span><b>{result.roundSeconds}s</b></div><div className="stat"><span>Correct</span><b>{result.correct}</b></div><div className="stat"><span>Wrong</span><b>{result.wrong}</b></div><div className="stat"><span>Accuracy</span><b>{result.accuracy}%</b></div><div className="stat"><span>Streak</span><b>{result.bestStreak}</b></div><div className="stat"><span>XP</span><b>+{result.xpEarned}</b></div>
      </div>}
      {tab === 'skills' && <div className="skill-summary compact-skill-summary"><div><span>Strongest Skill</span><b>{label(result.strongest)}</b></div><div><span>Weakest Skill</span><b>{label(result.weakest)}</b></div><div><span>Avg Speed</span><b>{(result.averageTimeMs / 1000).toFixed(1)}s</b></div></div>}
      {tab === 'tune' && <div className="progress"><div><span>{result.xpAfter} XP total</span><b>{progress.percent}%</b></div><i><em style={{ width: `${progress.percent}%` }} /></i><small>{progress.next ? `${progress.remaining} XP to next level` : 'Maximum level reached'}</small><p className="adaptive">Difficulty tune: {result.hiddenBefore.toFixed(2)} → {result.hiddenAfter.toFixed(2)}</p></div>}
    </section>
  </section></main>;
}
