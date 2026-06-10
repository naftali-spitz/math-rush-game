import { useEffect, useRef, useState } from 'react';
import type { AvatarColor, CreatePlayerInput, LeaderboardEntry, PlayerData, StyleTheme } from '../types/game';

const avatarIcons = ['🚀', '⚡', '🧠', '🔥', '⭐', '🐺', '🦊', '🐼', '🦁', '🐯'];
const avatarColors: AvatarColor[] = ['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue'];
const styleThemes: Array<{ id: StyleTheme; label: string }> = [
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'modern', label: 'Modern' },
  { id: 'kids', label: 'Kids' },
];

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

export function PlayerSelectScreen({ players, leaderboard, onSelectPlayer, onAddPlayer, onOpenAdmin }: { players: PlayerData[]; leaderboard: LeaderboardEntry[]; onSelectPlayer: (playerId: string) => void; onAddPlayer: (input: CreatePlayerInput) => Promise<void>; onOpenAdmin: () => void }) {
  const [name, setName] = useState('');
  const [avatarIcon, setAvatarIcon] = useState(avatarIcons[0]);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('cyan');
  const [styleTheme, setStyleTheme] = useState<StyleTheme>('futuristic');
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!createOpen) return;
    const id = window.setTimeout(() => nameRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setCreateOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, createOpen]);

  const addPlayer = async () => {
    const cleanName = name.trim();
    if (!cleanName || busy) return;
    setBusy(true);
    try {
      await onAddPlayer({ name: cleanName, avatarIcon, avatarColor, themeColor: avatarColor, styleTheme });
      setName('');
      setAvatarIcon(avatarIcons[0]);
      setAvatarColor('cyan');
      setStyleTheme('futuristic');
      setCreateOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return <main className="screen center"><section className="hero choose-hero">
    <div className="choose-topbar">
      <div>
        <p className="eyebrow">Shared Family Server</p>
        <h1>Math Rush</h1>
      </div>
      <button className="secondary" onClick={onOpenAdmin}>Admin Hub</button>
    </div>
    <p className="copy">Choose your player each time you open the game. Scores, XP, history, and leaderboard are shared across the home network.</p>

    <div className="choose-layout single-create-action">
      <section>
        <div className="section-title"><span>Choose Player</span><b>{players.length}</b></div>
        <div className="player-grid">
          {players.map((player) => <button key={player.id} className="player-card" onClick={() => onSelectPlayer(player.id)}>
            <Avatar icon={player.avatarIcon} color={player.avatarColor} />
            <span>{player.name}</span>
            <small>LV {player.level} · Best {player.bestScore}</small>
          </button>)}
          {!players.length && <div className="empty-card">No players yet. Create one to start.</div>}
        </div>
      </section>

      <section className="create-player-teaser">
        <div className="section-title"><span>Create Player</span></div>
        <div className="create-teaser-icon"><Avatar icon={avatarIcon} color={avatarColor} /></div>
        <p>New kid, guest, or family member? Add a player profile and keep their score history separate.</p>
        <button className="primary create-button" onClick={() => setCreateOpen(true)}>Create Player</button>
      </section>
    </div>

    <section className="leaderboard-panel">
      <div className="section-title"><span>Family Leaderboard</span></div>
      <Leaderboard leaderboard={leaderboard} />
    </section>

    {createOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!busy) setCreateOpen(false); }}>
      <section className="modal-card create-player-modal" role="dialog" aria-modal="true" aria-labelledby="create-player-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close create player" disabled={busy} onClick={() => setCreateOpen(false)}>×</button>
        <p className="eyebrow">New Profile</p>
        <h2 id="create-player-title">Create Player</h2>
        <form className="create-player-card modal-form" onSubmit={(event) => { event.preventDefault(); void addPlayer(); }}>
          <input ref={nameRef} value={name} placeholder="Player name" maxLength={18} onChange={(event) => setName(event.target.value)} />
          <div>
            <span className="micro-label">Avatar</span>
            <div className="avatar-picker">
              {avatarIcons.map((icon) => <button key={icon} type="button" className={avatarIcon === icon ? 'icon-choice selected' : 'icon-choice'} onClick={() => setAvatarIcon(icon)}>{icon}</button>)}
            </div>
          </div>
          <div>
            <span className="micro-label">Accent Color</span>
            <div className="color-picker">
              {avatarColors.map((color) => <button key={color} type="button" className={avatarColor === color ? `color-choice ${color} selected` : `color-choice ${color}`} aria-label={color} onClick={() => setAvatarColor(color)} />)}
            </div>
          </div>
          <div>
            <span className="micro-label">Style Theme</span>
            <div className="create-style-buttons">
              {styleThemes.map((theme) => <button key={theme.id} type="button" className={styleTheme === theme.id ? 'style-pill selected' : 'style-pill'} onClick={() => setStyleTheme(theme.id)}>{theme.label}</button>)}
            </div>
          </div>
          <button className="primary create-button" disabled={busy || !name.trim()}>{busy ? 'Creating...' : 'Create Player'}</button>
        </form>
      </section>
    </div>}
  </section></main>;
}
