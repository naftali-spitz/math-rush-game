import { useEffect, useState } from 'react';
import { updateHiddenDifficultyAdjustment } from './engine/adaptiveEngine';
import { applyLevelProgression } from './engine/progressionEngine';
import { accuracy, rushXp } from './engine/scoringEngine';
import { playSound, setMusicEnabled } from './engine/soundEngine';
import { GameScreen, rankSkills, type RushSummary } from './components/GameScreen';
import { ResultsScreen, type RushResult } from './components/ResultsScreen';
import { StartScreen } from './components/StartScreen';
import { defaultSaveData, loadSaveData, saveData } from './storage/saveData';
import type { SaveData, Screen } from './types/game';

function App() {
  const [save, setSave] = useState<SaveData>(() => typeof window === 'undefined' ? defaultSaveData() : loadSaveData());
  const [screen, setScreen] = useState<Screen>('start');
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO'>(3);
  const [lastResult, setLastResult] = useState<RushResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setMusicEnabled(save.settings.musicEnabled);
    return () => setMusicEnabled(false);
  }, [save.settings.musicEnabled]);

  useEffect(() => {
    if (screen !== 'countdown') return;
    playSound('countdown', save.settings.soundEnabled);
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
  }, [countdown, save.settings.soundEnabled, screen]);

  const updateSettings = (settings: SaveData['settings']) => {
    const next = { ...save, settings };
    setSave(next);
    saveData(next);
  };

  const start = () => {
    setCountdown(3);
    setScreen('countdown');
  };

  const finish = (summary: RushSummary) => {
    const correct = summary.answers.filter((a) => a.correct).length;
    const wrong = summary.answers.length - correct;
    const acc = accuracy(correct, wrong);
    const fast = summary.answers.filter((a) => a.correct && a.fast).length;
    const newBest = summary.score > save.player.bestScore;
    const xpEarned = rushXp({ correct, fast, newBest, accuracy: acc });
    const averageTimeMs = summary.answers.length ? Math.round(summary.answers.reduce((sum, a) => sum + a.timeMs, 0) / summary.answers.length) : 0;
    const ranked = rankSkills(summary.answers);
    const xpAfter = save.player.xp + xpEarned;
    const levelAfter = applyLevelProgression(save.player.level, xpAfter, acc);
    const hiddenAfter = updateHiddenDifficultyAdjustment({ current: save.player.hiddenDifficultyAdjustment, accuracy: acc, answered: summary.answers.length, averageTimeMs });

    const nextSave: SaveData = {
      ...save,
      player: {
        ...save.player,
        level: levelAfter,
        xp: xpAfter,
        bestScore: Math.max(save.player.bestScore, summary.score),
        gamesPlayed: save.player.gamesPlayed + 1,
        totalCorrect: save.player.totalCorrect + correct,
        totalWrong: save.player.totalWrong + wrong,
        hiddenDifficultyAdjustment: hiddenAfter,
        skillStats: { ...save.player.skillStats },
      },
    };

    for (const skill of Object.keys(ranked.stats) as Array<keyof typeof ranked.stats>) {
      nextSave.player.skillStats[skill] = {
        correct: save.player.skillStats[skill].correct + ranked.stats[skill].correct,
        wrong: save.player.skillStats[skill].wrong + ranked.stats[skill].wrong,
        totalTimeMs: save.player.skillStats[skill].totalTimeMs + ranked.stats[skill].time,
      };
    }

    const result: RushResult = { score: summary.score, correct, wrong, accuracy: acc, bestStreak: summary.bestStreak, xpEarned, xpAfter, levelBefore: save.player.level, levelAfter, strongest: ranked.strongest, weakest: ranked.weakest, newBest, hiddenBefore: save.player.hiddenDifficultyAdjustment, hiddenAfter, averageTimeMs };
    setSave(nextSave);
    saveData(nextSave);
    setLastResult(result);
    setScreen('results');
    if (newBest) window.setTimeout(() => playSound('newBest', nextSave.settings.soundEnabled), 250);
  };

  return <div className="app-shell">
    <div className="orb one" /><div className="orb two" /><div className="scanlines" />
    {screen === 'start' && <StartScreen saveData={save} onStart={start} onSettingsChange={updateSettings} />}
    {screen === 'countdown' && <main className="screen center"><div className="countdown"><span>{countdown}</span></div></main>}
    {screen === 'game' && <GameScreen key={gameKey} level={save.player.level} hiddenDifficultyAdjustment={save.player.hiddenDifficultyAdjustment} settings={save.settings} onFinished={finish} />}
    {screen === 'results' && lastResult && <ResultsScreen result={lastResult} bestScore={save.player.bestScore} onPlayAgain={start} onBack={() => setScreen('start')} />}
  </div>;
}

export default App;
