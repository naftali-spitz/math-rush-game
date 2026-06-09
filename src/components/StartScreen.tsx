import { useState } from 'react';
import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import type { AppSettings, LeaderboardEntry, PlayerData, RoundSeconds, RushHistoryRecord } from '../types/game';
import { LevelBadge } from './LevelBadge';
import { SettingsPanel } from './SettingsPanel';

const roundOptions: RoundSeconds[] = [30, 60, 90];
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
type HomeTab = 'progress' | 'history' | 'leaderboard';

function Avatar({ player }: { player: PlayerData }) {
  return <span className={`avatar large ${player.avatarColor}`}>{player.avatarIcon}</span>;
}

function Leaderboard({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  if (!leaderboard.length) return <p className="empty-state">No scores yet.</p>;
  return <ol className="leaderboard-list compact-list">
    {leaderboard.slice(0, 6).map((entry, index) => <li key={entry.id}>
      <span className="rank">#{index + 1}</span>
      <span className={`avatar mini ${entry.avatarColor}`}>{entry.avatarIcon}</span>
      <span>{entry.name}</span>
      <b>{entry.bestScore}</b>
    </li>)}
  </ol>;
}

function History({ history }: { history: RushHistoryRecord[] }) {
  if (!history.length) return <p className="empty-state">No rushes yet for this player.</p>;
  return <div className="history-list">
    {history.slice(0, 6).map((item) => <div key={item.id} className="history-row">
      <b>{item.score}</b>
      <span>{item.roundSeconds}s</span>
      <span>{item.accuracy}%</span>
      <small>{dateFormat.format(new Date(item.playedAt))}</small>
    </div>)}
  </div>;
}

export function StartScreen({ player, leaderboard, history, roundSeconds, onRoundSecondsChange, onStart, onSettingsChange, onBackToPlayers }: { player: PlayerData; leaderboard: LeaderboardEntry[]; history: RushHistoryRecord[]; roundSeconds: RoundSeconds; onRoundSecondsChange: (roundSeconds: RoundSeconds) => void; onStart: () => void; onSettingsChange: (settings: AppSettings) => void; onBackToPlayers: () => void }) {
  const [tab, setTab] = useState<HomeTab>('progress');
  const level = getLevel(player.level);
  const progress = levelProgress(player.level, player.xp);
  const settings = { soundEnabled: player.soundEnabled, musicEnabled: player.musicEnabled };

  return <main className="screen compact-screen"><section className="hero player-home compact-card home-dashboard">
    <div className="home-top-grid">
      <section className="home-identity arcade-panel">
        <Avatar player={player} />
        <div>
          <p className="eyebrow">Ready Player</p>
          <h1>{player.name}</h1>
          <LevelBadge level={level.level} label={level.title} />
        </div>
      </section>

      <section className="home-start-zone arcade-panel">
        <button className="primary big-start-button" onClick={onStart}>Start {roundSeconds}s Rush</button>
        <div className="round-options centered-rounds">
          {roundOptions.map((option) => <button key={option} className={roundSeconds === option ? 'round-choice active' : 'round-choice'} onClick={() => onRoundSecondsChange(option)}>{option}s</button>)}
        </div>
      </section>

      <section className="home-controls arcade-panel">
        <SettingsPanel settings={settings} onChange={onSettingsChange} />
        <button className="secondary switch-player-button" onClick={onBackToPlayers}>Switch Player</button>
      </section>
    </div>

    <div className="home-main-grid">
      <section className="arcade-panel progress-focus">
        <p className="eyebrow">Level Progress</p>
        <div className="progress-ring" style={{ '--progress': `${progress.percent}%` } as React.CSSProperties}>
          <div><b>{progress.percent}%</b><small>{progress.next ? `${progress.remaining} XP to next` : 'Max level'}</small></div>
        </div>
        <div className="start-stats compact-stats"><div className="stat"><span>Best</span><b>{player.bestScore}</b></div><div className="stat"><span>XP</span><b>{player.xp}</b></div><div className="stat"><span>Games</span><b>{player.gamesPlayed}</b></div></div>
      </section>

      <section className="arcade-panel info-tabs-panel">
        <div className="panel-tabs">
          <button className={tab === 'progress' ? 'tab active' : 'tab'} onClick={() => setTab('progress')}>Progress</button>
          <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>History</button>
          <button className={tab === 'leaderboard' ? 'tab active' : 'tab'} onClick={() => setTab('leaderboard')}>Board</button>
        </div>
        <div className="panel-body">
          {tab === 'progress' && <div className="progress-copy"><h2>{level.description}</h2><p className="copy">Keep accuracy high to unlock the next level. Fast answers and streaks add bonus XP.</p></div>}
          {tab === 'history' && <History history={history} />}
          {tab === 'leaderboard' && <Leaderboard leaderboard={leaderboard} />}
        </div>
      </section>
    </div>
  </section></main>;
}
