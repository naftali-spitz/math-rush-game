import { useEffect, useState } from 'react';
import { updateHiddenDifficultyAdjustment } from './engine/adaptiveEngine';
import { applyLevelProgression } from './engine/progressionEngine';
import { accuracy, rushXp } from './engine/scoringEngine';
import { playSound, setMusicEnabled } from './engine/soundEngine';
import { GameScreen, rankSkills, type RushSummary } from './components/GameScreen';
import { ResultsScreen, type RushResult } from './components/ResultsScreen';
import { StartScreen } from './components/StartScreen';
import { cloneSkillStats, createPlayer, initializeAppData, makeRushResultId, savePlayer, saveRushResult, saveSettings, selectPlayer } from './storage/db';
import type { AppData, AppSettings, Screen, Skill } from './types/game';

function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('start');
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO'>(3);
  const [lastResult, setLastResult] = useState<RushResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    let alive = true;
    initializeAppData()
      .then((data) => { if (alive) setAppData(data); })
      .catch(() => { if (alive) setLoadError('Could not open the local game database. Check that IndexedDB is enabled in this browser.'); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setMusicEnabled(Boolean(appData?.settings.musicEnabled));
    return () => setMusicEnabled(false);
  }, [appData?.settings.musicEnabled]);

  useEffect(() => {
    if (screen !== 'countdown' || !appData) return;
    playSound('countdown', appData.settings.soundEnabled);
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
  }, [appData, countdown, screen]);

  const updateSettings = async (settings: AppSettings) => {
    if (!appData) return;
    const nextSettings = { ...settings, selectedPlayerId: appData.player.id };
    const next = { ...appData, settings: nextSettings };
    setAppData(next);
    await saveSettings(nextSettings);
  };

  const handleSelectPlayer = async (playerId: string) => {
    const next = await selectPlayer(playerId);
    setAppData(next);
    setLastResult(null);
    setScreen('start');
  };

  const handleAddPlayer = async (name: string) => {
    const next = await createPlayer(name);
    setAppData(next);
    setLastResult(null);
    setScreen('start');
  };

  const start = () => {
    if (!appData) return;
    setCountdown(3);
    setScreen('countdown');
  };

  const finish = async (summary: RushSummary) => {
    if (!appData) return;
    const player = appData.player;
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

    const updatedPlayer = {
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

    const nextAppData: AppData = {
      ...appData,
      player: updatedPlayer,
      players: appData.players.map((candidate) => candidate.id === updatedPlayer.id ? updatedPlayer : candidate),
    };

    setAppData(nextAppData);
    setLastResult(result);
    setScreen('results');
    await savePlayer(updatedPlayer);
    await saveRushResult({
      id: makeRushResultId(),
      playerId: updatedPlayer.id,
      score: result.score,
      correct: result.correct,
      wrong: result.wrong,
      accuracy: result.accuracy,
      bestStreak: result.bestStreak,
      xpEarned: result.xpEarned,
      levelBefore: result.levelBefore,
      levelAfter: result.levelAfter,
      averageTimeMs: result.averageTimeMs,
      playedAt: new Date().toISOString(),
    });
    if (newBest) window.setTimeout(() => playSound('newBest', nextAppData.settings.soundEnabled), 250);
  };

  if (loadError) {
    return <div className="app-shell"><div className="orb one" /><div className="orb two" /><div className="scanlines" /><main className="screen center"><section className="hero"><p className="eyebrow">Local Database Error</p><h1>Math Rush</h1><p className="copy">{loadError}</p></section></main></div>;
  }

  if (!appData) {
    return <div className="app-shell"><div className="orb one" /><div className="orb two" /><div className="scanlines" /><main className="screen center"><section className="hero"><p className="eyebrow">Loading</p><h1>Math Rush</h1><p className="copy">Opening local database...</p></section></main></div>;
  }

  return <div className="app-shell">
    <div className="orb one" /><div className="orb two" /><div className="scanlines" />
    {screen === 'start' && <StartScreen appData={appData} onStart={start} onSettingsChange={updateSettings} onSelectPlayer={handleSelectPlayer} onAddPlayer={handleAddPlayer} />}
    {screen === 'countdown' && <main className="screen center"><div className="countdown"><span>{countdown}</span></div></main>}
    {screen === 'game' && <GameScreen key={gameKey} level={appData.player.level} hiddenDifficultyAdjustment={appData.player.hiddenDifficultyAdjustment} settings={appData.settings} onFinished={finish} />}
    {screen === 'results' && lastResult && <ResultsScreen result={lastResult} bestScore={appData.player.bestScore} onPlayAgain={start} onBack={() => setScreen('start')} />}
  </div>;
}

export default App;
