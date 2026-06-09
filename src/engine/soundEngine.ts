type SoundName = 'correct' | 'wrong' | 'streak' | 'countdown' | 'gameOver' | 'newBest' | 'timerHalf' | 'timer75' | 'timer90' | 'timer95' | 'timerFinal';

let context: AudioContext | null = null;
let musicNodes: AudioNode[] = [];

function audio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(freq: number, ms: number, volume = 0.07, type: OscillatorType = 'sine', delayMs = 0) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(freq, start);
  osc.type = type;
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + ms / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + ms / 1000 + 0.04);
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  if (name === 'correct') tone(820, 90, 0.06, 'triangle');
  if (name === 'wrong') tone(160, 180, 0.08, 'sawtooth');
  if (name === 'streak') { tone(700, 90, 0.075, 'square'); tone(1050, 130, 0.055, 'square', 90); }
  if (name === 'countdown') tone(520, 90, 0.065, 'triangle');
  if (name === 'gameOver') { tone(280, 180); tone(190, 260, 0.055, 'sine', 140); }
  if (name === 'newBest') { tone(700, 120); tone(930, 130, 0.07, 'triangle', 120); tone(1180, 170, 0.07, 'triangle', 240); }
  if (name === 'timerHalf') { tone(420, 120, 0.07, 'triangle'); tone(630, 120, 0.07, 'triangle', 100); }
  if (name === 'timer75') { tone(520, 90, 0.08, 'square'); tone(760, 130, 0.06, 'triangle', 95); }
  if (name === 'timer90') { tone(880, 80, 0.08, 'square'); tone(660, 80, 0.075, 'square', 90); tone(880, 120, 0.08, 'square', 180); }
  if (name === 'timer95') { tone(980, 70, 0.075, 'sawtooth'); tone(1160, 80, 0.07, 'sawtooth', 85); tone(980, 140, 0.075, 'sawtooth', 175); }
  if (name === 'timerFinal') { tone(720, 80, 0.08, 'square'); tone(980, 90, 0.06, 'square', 85); }
}

export function setMusicEnabled(enabled: boolean) {
  const ctx = audio();
  if (!ctx) return;
  if (!enabled) {
    musicNodes.forEach((node) => { try { if ('stop' in node) (node as OscillatorNode).stop(); } catch { /* already stopped */ } node.disconnect(); });
    musicNodes = [];
    return;
  }
  if (musicNodes.length) return;

  const master = ctx.createGain();
  master.gain.value = 0.035;
  master.connect(ctx.destination);
  musicNodes.push(master);

  [98, 130.81, 196, 246.94].forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index === 0 ? 'sine' : index % 2 ? 'triangle' : 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.value = index === 0 ? 0.16 : 0.035;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    musicNodes.push(osc, gain);
  });

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 2.2;
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  musicNodes.push(lfo, lfoGain);
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }
