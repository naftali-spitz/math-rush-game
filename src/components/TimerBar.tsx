export function TimerBar({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  return <section className={secondsLeft <= 10 ? 'timer danger' : 'timer'}><div><span>Time</span><b>{secondsLeft}s</b></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></section>;
}
