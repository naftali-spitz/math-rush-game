declare global { interface Window { webkitAudioContext?: typeof AudioContext } }

export type SoundName = 'correct' | 'wrong' | 'streak' | 'countdown' | 'gameOver' | 'newBest' | 'halfway' | 'warning' | 'danger' | 'critical' | 'tick' | 'tickFinal';

let audioContext: AudioContext | null = null;
function audio(): AudioContext | null {
  if (audioContext?.state === 'closed') audioContext = null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function osc(freq: number, when: number, dur: number, vol: number, type: OscillatorType = 'sine', dest?: AudioNode) {
  const ctx = audio(); if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  oscillator.connect(gain);
  gain.connect(dest ?? ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + dur);
}

function oscSlide(f0: number, f1: number, when: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const ctx = audio(); if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(f0, when);
  oscillator.frequency.exponentialRampToValueAtTime(f1, when + dur);
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + dur);
}

function noise(when: number, dur: number, vol: number, highpassHz = 8000) {
  const ctx = audio(); if (!ctx) return;
  const size = Math.ceil(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = highpassHz;
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(when);
  source.stop(when + dur);
}

function kick(time: number) {
  oscSlide(140, 20, time, 0.5, 0.95, 'sine');
  noise(time, 0.035, 0.18, 300);
}

function snare(time: number) {
  noise(time, 0.18, 0.38, 1800);
  osc(220, time, 0.11, 0.18, 'triangle');
}

function hihat(time: number, vol = 0.045) { noise(time, 0.04, vol, 9500); }
function openhat(time: number) { noise(time, 0.22, 0.07, 8000); }

function bass(freq: number, time: number, dur = 0.18) {
  const ctx = audio(); if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  filter.Q.value = 2;
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(0.17, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(time);
  oscillator.stop(time + dur);
}

export function playSound(name: SoundName, enabled: boolean, streakLevel = 0) {
  if (!enabled) return;
  const ctx = audio(); if (!ctx) return;
  const time = ctx.currentTime + 0.01;

  switch (name) {
    case 'correct':
      osc(880, time, 0.13, 0.058, 'triangle');
      osc(1108, time, 0.10, 0.036, 'triangle');
      osc(1320, time + 0.02, 0.09, 0.024, 'sine');
      break;
    case 'wrong':
      oscSlide(290, 110, time, 0.30, 0.09, 'sawtooth');
      osc(88, time + 0.06, 0.22, 0.07, 'square');
      break;
    case 'streak': {
      const base = 640 + Math.min(streakLevel, 24) * 28;
      osc(base, time, 0.11, 0.075, 'square');
      osc(base * 1.5, time + 0.09, 0.14, 0.055, 'square');
      osc(base * 2, time + 0.19, 0.12, 0.038, 'triangle');
      break;
    }
    case 'countdown':
      osc(540, time, 0.09, 0.085, 'sine');
      osc(810, time + 0.01, 0.06, 0.040, 'sine');
      break;
    case 'gameOver':
      osc(340, time, 0.22, 0.085, 'sawtooth');
      osc(254, time + 0.20, 0.28, 0.085, 'sawtooth');
      osc(170, time + 0.42, 0.42, 0.095, 'sawtooth');
      break;
    case 'newBest':
      [523, 659, 784, 1047].forEach((freq, index) => {
        osc(freq, time + index * 0.13, 0.24, 0.072, 'triangle');
        osc(freq * 2, time + index * 0.13, 0.14, 0.026, 'sine');
      });
      break;
    case 'halfway':
      osc(620, time, 0.10, 0.05, 'sine');
      osc(820, time + 0.09, 0.10, 0.04, 'sine');
      break;
    case 'warning':
      osc(760, time, 0.09, 0.055, 'triangle');
      osc(1040, time + 0.08, 0.11, 0.045, 'triangle');
      break;
    case 'danger':
      osc(980, time, 0.08, 0.06, 'square');
      osc(690, time + 0.08, 0.11, 0.045, 'triangle');
      break;
    case 'critical':
      osc(1380, time, 0.06, 0.066, 'square');
      osc(1380, time + 0.075, 0.06, 0.052, 'square');
      osc(980, time + 0.15, 0.12, 0.045, 'triangle');
      break;
    case 'tick':
      osc(1080, time, 0.032, 0.032, 'square');
      break;
    case 'tickFinal':
      osc(1450, time, 0.040, 0.048, 'square');
      osc(1450, time + 0.026, 0.026, 0.030, 'square');
      break;
  }
}

const BPM = 132;
const BEAT = 60 / BPM;
const SIXTEENTH = BEAT / 4;
const BAR = BEAT * 4;
const BASS_NOTES = [55, 0, 0, 0, 82.4, 0, 0, 0, 55, 0, 0, 73.4, 82.4, 0, 0, 0];

function scheduleBar(start: number) {
  for (let index = 0; index < 16; index++) {
    const time = start + index * SIXTEENTH;
    if (index % 2 === 0) hihat(time, index === 8 ? 0.03 : 0.045);
    if (index === 8) openhat(time);
    if (index === 0 || index === 5 || index === 8 || index === 13) kick(time);
    if (index === 4 || index === 12) snare(time);
    const freq = BASS_NOTES[index];
    if (freq > 0) bass(freq, time, SIXTEENTH * 3.2);
  }
}

let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextBar = 0;

export function setMusicEnabled(enabled: boolean) {
  const ctx = audio();
  if (!enabled) {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    return;
  }
  if (!ctx || musicTimer !== null) return;

  nextBar = ctx.currentTime + 0.08;
  scheduleBar(nextBar);
  nextBar += BAR;

  musicTimer = setInterval(() => {
    const current = audio(); if (!current) return;
    while (nextBar < current.currentTime + 1.4) {
      scheduleBar(nextBar);
      nextBar += BAR;
    }
  }, 400);
}
