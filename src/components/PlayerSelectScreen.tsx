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
  const [modalOpen, setModalOpen] = useState(false);

  const addPlayer = async () => {
    const cleanName = name.trim();
    if (!cleanName || busy) return;
    setBusy(true);
    try {
      await onAddPlayer({ name: cleanName, avatarIcon, avatarColor });
      setName('');
      setModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return <main className="screen compact-screen"><section className="hero choose-hero compact-card">
    <div className="compact-header">
      <div>
        <p className="eyebrow">Shared Family Server</p>
        <h1>Choose Player</h1>
        <p className="copy">Pick your card. Scores, XP, history, and leaderboard are shared across the home network.</p>
      </div>
      <button className="primary create-player-trigger" onClick={() => setModalOpen(true)}>+ Create Player</button>
    </div>

    <div className="choose-layout compact-choose-layout">
      <section className="player-board">
        <div className="section-title"><span>Players</span><b>{players.length}</b></div>
        <div className="player-grid compact-player-grid">
          {players.map((player, index) => <button key={player.id} className="player-card" style={{ animationDelay: `${index * 45}ms` }} onClick={() => onSelectPlayer(player.id)}>
            <Avatar icon={player.avatarIcon} color={player.avatarColor} />
            <span>{player.name}</span>
            <small>LV {player.level} · Best {player.bestScore}</small>
          </button>)}
          {!players.length && <div className="empty-card">No players yet. Create one to start.</div>}
        </div>
      </section>

      <aside className="leaderboard-panel compact-side-panel">
        <div className="section-title"><span>Family Leaderboard</span></div>
        <Leaderboard leaderboard={leaderboard} />
      </aside>
    </div>
  </section>

  {modalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
    <section className="create-player-modal" onClick={(event) => event.stopPropagation()}>
      <p className="eyebrow">Create Player</p>
      <h2>Pick name + avatar</h2>
      <input value={name} placeholder="Player name" maxLength={18} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addPlayer(); }} autoFocus />
      <div className="avatar-picker">
        {avatarIcons.map((icon) => <button key={icon} className={avatarIcon === icon ? 'icon-choice selected' : 'icon-choice'} onClick={() => setAvatarIcon(icon)}>{icon}</button>)}
      </div>
      <div className="color-picker">
        {avatarColors.map((color) => <button key={color} className={avatarColor === color ? `color-choice ${color} selected` : `color-choice ${color}`} aria-label={color} onClick={() => setAvatarColor(color)} />)}
      </div>
      <div className="modal-actions">
        <button className="primary" disabled={busy || !name.trim()} onClick={addPlayer}>{busy ? 'Creating...' : 'Create Player'}</button>
        <button className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
      </div>
    </section>
  </div>}
  </main>;
}
