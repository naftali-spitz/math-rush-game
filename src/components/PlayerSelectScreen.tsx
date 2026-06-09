import { useState } from 'react';
import type { AvatarColor, CreatePlayerInput, LeaderboardEntry, PlayerData } from '../types/game';

const avatarIcons = ['🚀', '⚡', '🧠', '🔥', '⭐', '🐺', '🦊', '🐼', '🦁', '🐯'];
const avatarColors: AvatarColor[] = ['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue'];

function Avatar({ icon, color }: { icon: string; color: AvatarColor }) {
  return <span className={`avatar ${color}`}>{icon}</span>;
}

function Leaderboard({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  if (!leaderboard.length) return <p className="empty-state">Create the first family player to start the leaderboard.</p>;
  return <ol className="leaderboard-list">
    {leaderboard.slice(0, 5).map((entry, index) => <li key={entry.id}>
      <span className="rank">#{index + 1}</span>
      <Avatar icon={entry.avatarIcon} color={entry.avatarColor} />
      <span>{entry.name}</span>
      <b>{entry.bestScore}</b>
    </li>)}
  </ol>;
}

export function PlayerSelectScreen({ players, leaderboard, onSelectPlayer, onAddPlayer }: { players: PlayerData[]; leaderboard: LeaderboardEntry[]; onSelectPlayer: (playerId: string) => void; onAddPlayer: (input: CreatePlayerInput) => Promise<void> }) {
  const [name, setName] = useState('');
  const [avatarIcon, setAvatarIcon] = useState(avatarIcons[0]);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('cyan');
  const [busy, setBusy] = useState(false);

  const addPlayer = async () => {
    const cleanName = name.trim();
    if (!cleanName || busy) return;
    setBusy(true);
    try {
      await onAddPlayer({ name: cleanName, avatarIcon, avatarColor });
      setName('');
    } finally {
      setBusy(false);
    }
  };

  return <main className="screen center"><section className="hero choose-hero">
    <p className="eyebrow">Shared Family Server</p>
    <h1>Math Rush</h1>
    <p className="copy">Choose your player each time you open the game. Scores, XP, history, and leaderboard are shared across the home network.</p>

    <div className="choose-layout">
      <section>
        <div className="section-title"><span>Choose Player</span><b>{players.length}</b></div>
        <div className="player-grid">
          {players.map((player) => <button key={player.id} className="player-card" onClick={() => onSelectPlayer(player.id)}>
            <Avatar icon={player.avatarIcon} color={player.avatarColor} />
            <span>{player.name}</span>
            <small>LV {player.level} · Best {player.bestScore}</small>
          </button>)}
          {!players.length && <div className="empty-card">No players yet. Create one below.</div>}
        </div>
      </section>

      <section className="create-player-card">
        <div className="section-title"><span>Create Player</span></div>
        <input value={name} placeholder="Player name" maxLength={18} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addPlayer(); }} />
        <div className="avatar-picker">
          {avatarIcons.map((icon) => <button key={icon} className={avatarIcon === icon ? 'icon-choice selected' : 'icon-choice'} onClick={() => setAvatarIcon(icon)}>{icon}</button>)}
        </div>
        <div className="color-picker">
          {avatarColors.map((color) => <button key={color} className={avatarColor === color ? `color-choice ${color} selected` : `color-choice ${color}`} aria-label={color} onClick={() => setAvatarColor(color)} />)}
        </div>
        <button className="primary create-button" disabled={busy || !name.trim()} onClick={addPlayer}>{busy ? 'Creating...' : 'Create Player'}</button>
      </section>
    </div>

    <section className="leaderboard-panel">
      <div className="section-title"><span>Family Leaderboard</span></div>
      <Leaderboard leaderboard={leaderboard} />
    </section>
  </section></main>;
}
