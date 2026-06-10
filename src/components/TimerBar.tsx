export function TimerBar({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const cls = pct <= 10 ? 'timer panic' : pct <= 25 ? 'timer danger' : 'timer';
  return <section className={cls}>
    <div className="row"><span>Time</span><b>{secondsLeft}s</b></div>
    <div className="bar"><i style={{ width: `${pct}%` }} /></div>
  </section>;
}
