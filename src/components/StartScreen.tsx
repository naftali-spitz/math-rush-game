import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import type { SaveData } from '../types/game';
import { LevelBadge } from './LevelBadge';
import { SettingsPanel } from './SettingsPanel';

export function StartScreen({ saveData, onStart, onSettingsChange }: { saveData: SaveData; onStart: () => void; onSettingsChange: (s: SaveData['settings']) => void }) {
  const level = getLevel(saveData.player.level);
  const progress = levelProgress(saveData.player.level, saveData.player.xp);
  return <main className="screen center"><section className="hero">
    <p className="eyebrow">90 Second Number Sprint</p>
    <h1>Math Rush</h1>
    <p className="copy">Answer fast. Build streaks. Level up. Keep your rhythm clean and your score climbing.</p>
    <div className="start-stats"><LevelBadge level={level.level} label={level.title} /><div className="stat"><span>Best Score</span><b>{saveData.player.bestScore}</b></div><div className="stat"><span>XP</span><b>{saveData.player.xp}</b></div></div>
    <div className="progress"><div><span>{level.description}</span><b>{progress.percent}%</b></div><i><em style={{ width: `${progress.percent}%` }} /></i><small>{progress.next ? `${progress.remaining} XP to next level` : 'Maximum level reached'}</small></div>
    <button className="primary" onClick={onStart}>Start 90s Rush</button>
    <SettingsPanel settings={saveData.settings} onChange={onSettingsChange} />
  </section></main>;
}
