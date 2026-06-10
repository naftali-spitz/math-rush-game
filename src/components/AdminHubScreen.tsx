import type { LeaderboardEntry, PlayerData, StyleTheme, ThemeColor } from '../types/game';

const themeColors: ThemeColor[] = ['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue'];
const styleThemes: Array<{ id: StyleTheme; label: string }> = [
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'modern', label: 'Modern' },
  { id: 'kids', label: 'Kids' },
];

type AppearanceUpdate = Partial<Pick<PlayerData, 'themeColor' | 'styleTheme'>>;

function pct(correct: number, wrong: number) {
  const total = correct + wrong;
  return total ? Math.round((correct / total) * 100) : 0;
}

function avgMs(totalTimeMs: number, attempts: number) {
  return attempts ? `${(totalTimeMs / attempts / 1000).toFixed(1)}s` : '—';
}

function PlayerAdminCard({ player, rank, onPlay, onAppearanceChange }: { player: PlayerData; rank: number; onPlay: (playerId: string) => void; onAppearanceChange: (playerId: string, updates: AppearanceUpdate) => void }) {
  const totalAnswers = player.totalCorrect + player.totalWrong;
  const bestSkill = Object.entries(player.skillStats)
    .map(([skill, stats]) => ({ skill, attempts: stats.correct + stats.wrong, accuracy: pct(stats.correct, stats.wrong), totalTimeMs: stats.totalTimeMs }))
    .filter((item) => item.attempts > 0)
    .sort((a, b) => b.accuracy - a.accuracy || a.totalTimeMs - b.totalTimeMs)[0];

  return <article className="admin-player-card">
    <div className="admin-player-head">
      <span className={`avatar ${player.avatarColor}`}>{player.avatarIcon}</span>
      <div>
        <h3>{player.name}</h3>
        <small>Rank #{rank} · Level {player.level}</small>
      </div>
      <button className="secondary compact" onClick={() => onPlay(player.id)}>Play</button>
    </div>

    <div className="admin-stat-grid">
      <div><span>Best</span><b>{player.bestScore}</b></div>
      <div><span>Games</span><b>{player.gamesPlayed}</b></div>
      <div><span>Accuracy</span><b>{pct(player.totalCorrect, player.totalWrong)}%</b></div>
      <div><span>Answers</span><b>{totalAnswers}</b></div>
    </div>

    <div className="admin-player-row">
      <span>XP</span><b>{player.xp}</b>
    </div>
    <div className="admin-player-row">
      <span>Strongest</span><b>{bestSkill ? `${bestSkill.skill} · ${bestSkill.accuracy}% · ${avgMs(bestSkill.totalTimeMs, bestSkill.attempts)}` : 'No data yet'}</b>
    </div>

    <div className="admin-theme-row">
      <span>Style</span>
      <div className="admin-style-buttons">
        {styleThemes.map((theme) => <button
          key={theme.id}
          type="button"
          className={player.styleTheme === theme.id ? 'style-pill selected' : 'style-pill'}
          onClick={() => onAppearanceChange(player.id, { styleTheme: theme.id })}
        >{theme.label}</button>)}
      </div>
    </div>

    <div className="admin-theme-row">
      <span>Accent</span>
      <div className="admin-theme-dots">
        {themeColors.map((color) => <button
          key={color}
          type="button"
          className={player.themeColor === color ? `theme-dot ${color} selected` : `theme-dot ${color}`}
          aria-label={`Use ${color} accent for ${player.name}`}
          onClick={() => onAppearanceChange(player.id, { themeColor: color })}
        />)}
      </div>
    </div>
  </article>;
}

export function AdminHubScreen({ players, leaderboard, onBack, onPlayPlayer, onAppearanceChange }: { players: PlayerData[]; leaderboard: LeaderboardEntry[]; onBack: () => void; onPlayPlayer: (playerId: string) => void; onAppearanceChange: (playerId: string, updates: AppearanceUpdate) => void }) {
  const totalGames = players.reduce((sum, player) => sum + player.gamesPlayed, 0);
  const totalCorrect = players.reduce((sum, player) => sum + player.totalCorrect, 0);
  const totalWrong = players.reduce((sum, player) => sum + player.totalWrong, 0);
  const leader = leaderboard[0];

  const sorted = [...players].sort((a, b) => b.bestScore - a.bestScore || b.xp - a.xp || a.name.localeCompare(b.name));

  return <main className="screen center"><section className="hero admin-hub">
    <div className="admin-topbar">
      <div>
        <p className="eyebrow">Admin Hub</p>
        <h1>Admin</h1>
      </div>
      <button className="secondary" onClick={onBack}>Back</button>
    </div>

    <p className="copy">Family-level management lives here. Player-only preferences are available from each player’s profile popup.</p>

    <div className="admin-summary-grid">
      <div className="stat"><span>Players</span><b>{players.length}</b></div>
      <div className="stat"><span>Total Games</span><b>{totalGames}</b></div>
      <div className="stat"><span>Family Accuracy</span><b>{pct(totalCorrect, totalWrong)}%</b></div>
      <div className="stat"><span>Current Leader</span><b>{leader ? leader.name : '—'}</b></div>
    </div>

    <div className="admin-list">
      {sorted.map((player, index) => <PlayerAdminCard key={player.id} player={player} rank={index + 1} onPlay={onPlayPlayer} onAppearanceChange={onAppearanceChange} />)}
      {!sorted.length && <p className="empty-state">No players yet. Go back and create the first profile.</p>}
    </div>
  </section></main>;
}
