export function LevelBadge({ level, label }: { level: number; label: string }) {
  return <div className="level-badge"><b>LV {level}</b><span>{label}</span></div>;
}
