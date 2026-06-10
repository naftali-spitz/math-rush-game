export function ScorePanel(props: {
  score: number; streak: number; bestStreak: number;
  correct: number; wrong: number; pulse: boolean;
}) {
  const streakClass =
    props.streak >= 15 ? 'tile streak-inferno' :
    props.streak >= 10 ? 'tile streak-hot' :
    props.streak >= 5  ? 'tile combo' :
                         'tile';
  return (
    <section className="score-panel">
      <div className={props.pulse ? 'tile pulse' : 'tile'}><span>Score</span><b>{props.score}</b></div>
      <div className={streakClass}><span>Streak</span><b>{props.streak}</b></div>
      <div className="tile"><span>Best Streak</span><b>{props.bestStreak}</b></div>
      <div className="tile"><span>Right / Wrong</span><b>{props.correct} / {props.wrong}</b></div>
    </section>
  );
}
