import { useEffect, useState } from 'react';
import { updateHiddenDifficultyAdjustment } from './engine/adaptiveEngine';
import { applyLevelProgression } from './engine/progressionEngine';
import { accuracy, rushXp } from './engine/scoringEngine';
import { playSound, setMusicEnabled } from './engine/soundEngine';
import { GameScreen, rankSkills, type RushSummary } from './components/GameScreen';
import { PlayerSelectScreen } from './components/PlayerSelectScreen';
import { ResultsScreen, type RushResult } from './components/ResultsScreen';
import { StartScreen } from './components/StartScreen';
import { createPlayer, getAppData, getPlayerHistory, saveRushResult, updatePlayerSettings } from './storage/api';
import type { AppData, AppSettings, CreatePlayerInput, PlayerData, RoundSeconds, RushHistoryRecord, Screen, Skill } from './types/game';

const DEFAULT_ROUND_SECONDS: RoundSeconds = 60;

function cloneSkillStats(stats: PlayerData['skillStats']) {
  return {
    addition: { ...stats.addition },
    subtraction: { ...stats.subtraction },
    multiplication: { ...stats.multiplication },
    division: { ...stats.division },
    mixed: { ...stats.mixed },
  };
}

function settingsFromPlayer(player: PlayerData): AppSettings {
  return { soundEnabled: player.soundEnabled, musicEnabled: player.musicEnabled };
}

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [history, setHistory] = useState<RushHistoryRecord[]>([]);
  const [roundSeconds, setRoundSeconds] = useState<RoundSeconds>(DEFAULT_ROUND_SECONDS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('choose');
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO'>(3);
  const [lastResult, setLastResult] = useState<RushResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    let alive = true;
    getAppData()
      .then((data) => { if (alive) setAppData(data); })
      .catch((error: Error) => { if (alive) setLoadError(error.message || 'Could not reach the Math Rush server API.'); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setMusicEnabled(Boolean(selectedPlayer?.musicEnabled));
    return () => setMusicEnabled(false);
  }, [selectedPlayer?.musicEnabled]);

  useEffect(() => {
    if (screen !== 'countdown' || !selectedPlayer) return;
    playSound('countdown', selectedPlayer.soundEnabled);
    const id = window.setTimeout(() => {
      setCountdown((current) => {
        if (current === 3) return 2;
        if (current === 2) return 1;
        if (current === 1) return 'GO';
        setGameKey((n) => n + 1);
        setScreen('game');
        return 3;
      });
    }, countdown === 'GO' ? 650 : 800);
    return () => window.clearTimeout(id);
  }, [countdown, screen, selectedPlayer]);

  const handleSelectPlayer = async (playerId: string) => {
    if (!appData) return;
    const player = appData.players.find((candidate) => candidate.id === playerId);
    if (!player) return;
    setSelectedPlayer(player);
    setLastResult(null);
    setScreen('start');
    try {
      setHistory(await getPlayerHistory(player.id));
    } catch {
      setHistory([]);
    }
  };

  const handleAddPlayer = async (input: CreatePlayerInput) => {
    const response = await createPlayer(input);
    setAppData({ players: response.players, leaderboard: response.leaderboard });
    setSelectedPlayer(response.player);
    setHistory([]);
    setLastResult(null);
    setScreen('start');
  };

  const handleBackToPlayers = () => {
    setSelectedPlayer(null);
    setHistory([]);
    setLastResult(null);
    setScreen('choose');
  };

  const updateSettings = async (settings: AppSettings) => {
    if (!appData || !selectedPlayer) return;
    const optimisticPlayer = { ...selectedPlayer, ...settings, updatedAt: new Date().toISOString() };
    setSelectedPlayer(optimisticPlayer);
    setAppData({
      ...appData,
      players: appData.players.map((player) => player.id === optimisticPlayer.id ? optimisticPlayer : player),
    });
    const response = await updatePlayerSettings(selectedPlayer.id, settings);
    setSelectedPlayer(response.player);
    setAppData({ players: response.players, leaderboard: response.leaderboard });
  };

  const start = () => {
    if (!selectedPlayer) return;
    setCountdown(3);
    setScreen('countdown');
  };

  const finish = async (summary: RushSummary) => {
    if (!appData || !selectedPlayer) return;
    const player = selectedPlayer;
    const correct = summary.answers.filter((a) => a.correct).length;
    const wrong = summary.answers.length - correct;
    const acc = accuracy(correct, wrong);
    const fast = summary.answers.filter((a) => a.correct && a.fast).length;
    const newBest = summary.score > player.bestScore;
    const xpEarned = rushXp({ correct, fast, newBest, accuracy: acc });
    const averageTimeMs = summary.answers.length ? Math.round(summary.answers.reduce((sum, a) => sum + a.timeMs, 0) / summary.answers.length) : 0;
    const ranked = rankSkills(summary.answers);
    const xpAfter = player.xp + xpEarned;
    const levelAfter = applyLevelProgression(player.level, xpAfter, acc);
    const hiddenAfter = updateHiddenDifficultyAdjustment({ current: player.hiddenDifficultyAdjustment, accuracy: acc, answered: summary.answers.length, averageTimeMs });
    const skillStats = cloneSkillStats(player.skillStats);

    for (const skill of Object.keys(ranked.stats) as Skill[]) {
      skillStats[skill] = {
        correct: skillStats[skill].correct + ranked.stats[skill].correct,
        wrong: skillStats[skill].wrong + ranked.stats[skill].wrong,
        totalTimeMs: skillStats[skill].totalTimeMs + ranked.stats[skill].time,
      };
    }

    const updatedPlayer: PlayerData = {
      ...player,
      level: levelAfter,
      xp: xpAfter,
      bestScore: Math.max(player.bestScore, summary.score),
      gamesPlayed: player.gamesPlayed + 1,
      totalCorrect: player.totalCorrect + correct,
      totalWrong: player.totalWrong + wrong,
      hiddenDifficultyAdjustment: hiddenAfter,
      skillStats,
      updatedAt: new Date().toISOString(),
    };

    const result: RushResult = {
      roundSeconds,
      score: summary.score,
      correct,
      wrong,
      accuracy: acc,
      bestStreak: summary.bestStreak,
      xpEarned,
      xpAfter,
      levelBefore: player.level,
      levelAfter,
      strongest: ranked.strongest,
      weakest: ranked.weakest,
      newBest,
      hiddenBefore: player.hiddenDifficultyAdjustment,
      hiddenAfter,
      averageTimeMs,
    };

    setSelectedPlayer(updatedPlayer);
    setAppData({ ...appData, players: appData.players.map((candidate) => candidate.id === updatedPlayer.id ? updatedPlayer : candidate) });
    setLastResult(result);
    setScreen('results');

    const response = await saveRushResult({
      playerId: updatedPlayer.id,
      roundSeconds,
      score: result.score,
      correct: result.correct,
      wrong: result.wrong,
      accuracy: result.accuracy,
      bestStreak: result.bestStreak,
      xpEarned: result.xpEarned,
      levelBefore: result.levelBefore,
      levelAfter: result.levelAfter,
      averageTimeMs: result.averageTimeMs,
      hiddenDifficultyAdjustment: hiddenAfter,
      skillStatsDelta: ranked.stats,
    });
    setSelectedPlayer(response.player);
    setAppData({ players: response.players, leaderboard: response.leaderboard });
    setHistory(response.history);
    if (newBest) window.setTimeout(() => playSound('newBest', response.player.soundEnabled), 250);
  };

  if (loadError) {
    return <div className="app-shell"><div className="orb one" /><div className="orb two" /><div className="scanlines" /><main className="screen center"><section className="hero"><p className="eyebrow">Server Error</p><h1>Math Rush</h1><p className="copy">{loadError}</p><p className="copy">Make sure the Math Rush API is running on the home server.</p></section></main></div>;
  }

  if (!appData) {
    return <div className="app-shell"><div className="orb one" /><div className="orb two" /><div className="scanlines" /><main className="screen center"><section className="hero"><p className="eyebrow">Loading</p><h1>Math Rush</h1><p className="copy">Connecting to shared family server...</p></section></main></div>;
  }

  return <div className="app-shell">
    <div className="orb one" /><div className="orb two" /><div className="scanlines" />
    {screen === 'choose' && <PlayerSelectScreen players={appData.players} leaderboard={appData.leaderboard} onSelectPlayer={handleSelectPlayer} onAddPlayer={handleAddPlayer} />}
    {screen === 'start' && selectedPlayer && <StartScreen player={selectedPlayer} leaderboard={appData.leaderboard} history={history} roundSeconds={roundSeconds} onRoundSecondsChange={setRoundSeconds} onStart={start} onSettingsChange={updateSettings} onBackToPlayers={handleBackToPlayers} />}
    {screen === 'countdown' && <main className="screen center"><div className="countdown"><span className={countdown === 'GO' ? 'go' : undefined}>{countdown}</span></div></main>}
    {screen === 'game' && selectedPlayer && <GameScreen key={gameKey} level={selectedPlayer.level} hiddenDifficultyAdjustment={selectedPlayer.hiddenDifficultyAdjustment} settings={settingsFromPlayer(selectedPlayer)} roundSeconds={roundSeconds} onFinished={finish} />}
    {screen === 'results' && selectedPlayer && lastResult && <ResultsScreen result={lastResult} bestScore={selectedPlayer.bestScore} onPlayAgain={start} onBack={() => setScreen('start')} />}
  </div>;
}

export default App;
