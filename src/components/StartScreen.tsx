import { useState } from 'react';
import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import type { AppData, AppSettings } from '../types/game';
import { LevelBadge } from './LevelBadge';
import { SettingsPanel } from './SettingsPanel';

export function StartScreen({ appData, onStart, onSettingsChange, onSelectPlayer, onAddPlayer }: { appData: AppData; onStart: () => void; onSettingsChange: (s: AppSettings) => void; onSelectPlayer: (playerId: string) => void; onAddPlayer: (name: string) => void }) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const level = getLevel(appData.player.level);
  const progress = levelProgress(appData.player.level, appData.player.xp);

  const addPlayer = () => {
    onAddPlayer(newPlayerName);
    setNewPlayerName('');
  };

  return <main className="screen center"><section className="hero">
    <p className="eyebrow">90 Second Number Sprint</p>
    <h1>Math Rush</h1>
    <p className="copy">Answer fast. Build streaks. Level up. Keep your rhythm clean and your score climbing.</p>

    <div className="player-panel">
      <div>
        <span className="micro-label">Local Player</span>
        <select value={appData.player.id} onChange={(event) => onSelectPlayer(event.target.value)}>
          {appData.players.map((player) => <option key={player.id} value={player.id}>{player.name} · LV {player.level}</option>)}
        </select>
      </div>
      <div className="player-actions">
        <input value={newPlayerName} placeholder="New player name" maxLength={18} onChange={(event) => setNewPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addPlayer(); }} />
        <button className="secondary compact" onClick={addPlayer}>Add Player</button>
      </div>
    </div>

    <div className="start-stats"><LevelBadge level={level.level} label={level.title} /><div className="stat"><span>Best Score</span><b>{appData.player.bestScore}</b></div><div className="stat"><span>XP</span><b>{appData.player.xp}</b></div></div>
    <div className="progress"><div><span>{level.description}</span><b>{progress.percent}%</b></div><i><em style={{ width: `${progress.percent}%` }} /></i><small>{progress.next ? `${progress.remaining} XP to next level` : 'Maximum level reached'}</small></div>
    <button className="primary" onClick={onStart}>Start 90s Rush</button>
    <SettingsPanel settings={appData.settings} onChange={onSettingsChange} />
  </section></main>;
}
