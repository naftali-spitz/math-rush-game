import type { SaveData } from '../types/game';

export function SettingsPanel({ settings, onChange }: { settings: SaveData['settings']; onChange: (s: SaveData['settings']) => void }) {
  return <div className="settings-panel">
    <button className={settings.soundEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, soundEnabled: !settings.soundEnabled })}>Sound {settings.soundEnabled ? 'On' : 'Off'}</button>
    <button className={settings.musicEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, musicEnabled: !settings.musicEnabled })}>Music {settings.musicEnabled ? 'On' : 'Off'}</button>
  </div>;
}
