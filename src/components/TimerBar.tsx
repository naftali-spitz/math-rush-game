import { useEffect, useRef } from 'react';
import { playSound } from '../engine/soundEngine';

export function TimerBar({ secondsLeft, totalSeconds, soundEnabled = false }: { secondsLeft: number; totalSeconds: number; soundEnabled?: boolean }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const elapsedPct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const firedRef = useRef(new Set<string>());

  useEffect(() => { firedRef.current.clear(); }, [totalSeconds]);

  useEffect(() => {
    const cues = [
      { pct: 50, key: 'half', sound: 'timerHalf' as const },
      { pct: 75, key: 'p75', sound: 'timer75' as const },
      { pct: 90, key: 'p90', sound: 'timer90' as const },
      { pct: 95, key: 'p95', sound: 'timer95' as const },
    ];
    cues.forEach((cue) => {
      if (elapsedPct >= cue.pct && !firedRef.current.has(cue.key)) {
        firedRef.current.add(cue.key);
        playSound(cue.sound, soundEnabled);
      }
    });
    if (secondsLeft <= 5 && secondsLeft > 0 && !firedRef.current.has(`last-${secondsLeft}`)) {
      firedRef.current.add(`last-${secondsLeft}`);
      playSound('timerFinal', soundEnabled);
    }
  }, [elapsedPct, secondsLeft, soundEnabled]);

  return <section className={secondsLeft <= 5 ? 'timer danger final-timer' : secondsLeft <= 10 ? 'timer danger' : 'timer'}><div><span>Time</span><b>{secondsLeft}s</b></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></section>;
}
