import type { AppSettings, StyleTheme, ThemeColor } from '../types/game';

const themeColors: ThemeColor[] = ['cyan', 'purple', 'yellow', 'pink', 'green', 'orange', 'blue'];
const styleThemes: Array<{ id: StyleTheme; label: string; copy: string }> = [
  { id: 'futuristic', label: 'Futuristic', copy: 'Neon arcade, glow, sci-fi motion' },
  { id: 'modern', label: 'Modern', copy: 'Clean, calm, focused study feel' },
  { id: 'kids', label: 'Kids', copy: 'Colorful, playful, big and friendly' },
];

export function SettingsPanel({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  return <div className="settings-panel profile-settings-panel">
    <div className="sound-row">
      <button type="button" className={settings.soundEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, soundEnabled: !settings.soundEnabled })}>Sound {settings.soundEnabled ? 'On' : 'Off'}</button>
      <button type="button" className={settings.musicEnabled ? 'toggle on' : 'toggle'} onClick={() => onChange({ ...settings, musicEnabled: !settings.musicEnabled })}>Music {settings.musicEnabled ? 'On' : 'Off'}</button>
    </div>

    <div className="style-theme-picker" aria-label="Visual style theme">
      <span className="micro-label">Full Style</span>
      <div className="style-choice-grid">
        {styleThemes.map((theme) => <button
          key={theme.id}
          type="button"
          className={settings.styleTheme === theme.id ? `style-choice ${theme.id} selected` : `style-choice ${theme.id}`}
          aria-label={`Use ${theme.label} style`}
          onClick={() => onChange({ ...settings, styleTheme: theme.id })}
        >
          <b>{theme.label}</b>
          <small>{theme.copy}</small>
        </button>)}
      </div>
    </div>

    <div className="theme-picker" aria-label="Accent color">
      <span>Accent</span>
      {themeColors.map((color) => <button
        key={color}
        type="button"
        className={settings.themeColor === color ? `theme-dot ${color} selected` : `theme-dot ${color}`}
        aria-label={`Use ${color} accent`}
        onClick={() => onChange({ ...settings, themeColor: color })}
      />)}
    </div>
  </div>;
}
