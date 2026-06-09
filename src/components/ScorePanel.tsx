export function ScorePanel(props: { score: number; streak: number; bestStreak: number; correct: number; wrong: number; pulse: boolean }) {
  return <section className="score-panel">
    <div className={props.pulse ? 'tile pulse' : 'tile'}><span>Score</span><b>{props.score}</b></div>
    <div className={props.streak >= 5 ? 'tile combo' : 'tile'}><span>Streak</span><b>{props.streak}</b></div>
    <div className="tile"><span>Best Streak</span><b>{props.bestStreak}</b></div>
    <div className="tile"><span>Right / Wrong</span><b>{props.correct} / {props.wrong}</b></div>
  </section>;
}
