type SoundName = 'correct' | 'wrong' | 'streak' | 'countdown' | 'gameOver' | 'newBest';

let context: AudioContext | null = null;
let music: OscillatorNode | null = null;

function audio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

function tone(freq: number, ms: number, volume = 0.07, type: OscillatorType = 'sine') {
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + ms / 1000);
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  if (name === 'correct') tone(820, 90, 0.06, 'triangle');
  if (name === 'wrong') tone(160, 170, 0.08, 'sawtooth');
  if (name === 'streak') { tone(700, 100, 0.07, 'square'); setTimeout(() => tone(1050, 120, 0.05, 'square'), 90); }
  if (name === 'countdown') tone(520, 90);
  if (name === 'gameOver') { tone(280, 180); setTimeout(() => tone(190, 260), 140); }
  if (name === 'newBest') { tone(700, 120); setTimeout(() => tone(930, 130), 120); setTimeout(() => tone(1180, 160), 240); }
}

export function setMusicEnabled(enabled: boolean) {
  const ctx = audio();
  if (!ctx) return;
  if (!enabled) { music?.stop(); music = null; return; }
  if (music) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 92;
  gain.gain.value = 0.012;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  music = osc;
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }
