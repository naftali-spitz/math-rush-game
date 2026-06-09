import { getLevel } from '../engine/levels';
import { levelProgress } from '../engine/progressionEngine';
import type { AppSettings, LeaderboardEntry, PlayerData, RoundSeconds, RushHistoryRecord } from '../types/game';
import { LevelBadge } from './LevelBadge';
import { SettingsPanel } from './SettingsPanel';

const roundOptions: RoundSeconds[] = [30, 60, 90];
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function Avatar({ player }: { player: PlayerData }) {
  return <span className={`avatar large ${player.avatarColor}`}>{player.avatarIcon}</span>;
}

function Leaderboard({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return <ol className="leaderboard-list compact-list">
    {leaderboard.slice(0, 5).map((entry, index) => <li key={entry.id}>
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
    {history.slice(0, 5).map((item) => <div key={item.id} className="history-row">
      <b>{item.score}</b>
      <span>{item.roundSeconds}s</span>
      <span>{item.accuracy}%</span>
      <small>{dateFormat.format(new Date(item.playedAt))}</small>
    </div>)}
  </div>;
}

export function StartScreen({ player, leaderboard, history, roundSeconds, onRoundSecondsChange, onStart, onSettingsChange, onBackToPlayers }: { player: PlayerData; leaderboard: LeaderboardEntry[]; history: RushHistoryRecord[]; roundSeconds: RoundSeconds; onRoundSecondsChange: (roundSeconds: RoundSeconds) => void; onStart: () => void; onSettingsChange: (settings: AppSettings) => void; onBackToPlayers: () => void }) {
  const level = getLevel(player.level);
  const progress = levelProgress(player.level, player.xp);
  const settings = { soundEnabled: player.soundEnabled, musicEnabled: player.musicEnabled };

  return <main className="screen center"><section className="hero player-home">
    <div className="player-home-top">
      <div className="player-title">
        <Avatar player={player} />
        <div>
          <p className="eyebrow">Player Ready</p>
          <h1>{player.name}</h1>
        </div>
      </div>
      <button className="secondary" onClick={onBackToPlayers}>Switch Player</button>
    </div>

    <p className="copy">Answer fast. Build streaks. Level up. Keep your rhythm clean and your family score climbing.</p>

    <div className="start-stats"><LevelBadge level={level.level} label={level.title} /><div className="stat"><span>Best Score</span><b>{player.bestScore}</b></div><div className="stat"><span>XP</span><b>{player.xp}</b></div></div>
    <div className="progress"><div><span>{level.description}</span><b>{progress.percent}%</b></div><i><em style={{ width: `${progress.percent}%` }} /></i><small>{progress.next ? `${progress.remaining} XP to next level` : 'Maximum level reached'}</small></div>

    <div className="round-panel">
      <span className="micro-label">Rush Length</span>
      <div className="round-options">
        {roundOptions.map((option) => <button key={option} className={roundSeconds === option ? 'round-choice active' : 'round-choice'} onClick={() => onRoundSecondsChange(option)}>{option}s</button>)}
      </div>
    </div>

    <button className="primary" onClick={onStart}>Start {roundSeconds}s Rush</button>
    <SettingsPanel settings={settings} onChange={onSettingsChange} />

    <div className="dashboard-grid">
      <section className="dashboard-card"><div className="section-title"><span>Family Leaderboard</span></div><Leaderboard leaderboard={leaderboard} /></section>
      <section className="dashboard-card"><div className="section-title"><span>Recent Rushes</span></div><History history={history} /></section>
    </div>
  </section></main>;
}
