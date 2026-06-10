import type { AppSettings, ThemeColor } from '../types/game';

const themeColors: ThemeColor[] = ['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue'];

export function SettingsPanel({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  return <div className="settings-panel">
    <button className={settings.soundEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, soundEnabled: !settings.soundEnabled })}>Sound {settings.soundEnabled ? 'On' : 'Off'}</button>
    <button className={settings.musicEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, musicEnabled: !settings.musicEnabled })}>Music {settings.musicEnabled ? 'On' : 'Off'}</button>
    <div className="theme-picker" aria-label="Theme color">
      <span>Theme</span>
      {themeColors.map((color) => <button
        key={color}
        className={settings.themeColor === color ? `theme-dot ${color} selected` : `theme-dot ${color}`}
        aria-label={`Use ${color} theme`}
        onClick={() => onChange({ ...settings, themeColor: color })}
      />)}
    </div>
  </div>;
}
