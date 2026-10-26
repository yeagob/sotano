// Sound effects synthesised with WebAudio: zero audio files, zero licensing headaches.

import { fx } from '../core/fx';

let ctx: AudioContext | null = null;
let master: GainNode;

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur);
}

function noise(dur: number, vol: number, freq: number, q = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (fx.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

const jitter = (f: number) => f * (0.92 + fx.random() * 0.16);

export const sfx = {
  shoot: () => tone(jitter(520), 0.09, 'sine', 0.25, 0.6),
  hit: (tier: number) => noise(0.06, 0.25, jitter(1800 - tier * 350), 2),
  break: (tier: number) => { noise(0.22, 0.5, jitter(900 - tier * 150), 0.8); tone(jitter(140), 0.15, 'triangle', 0.25, 0.5); },
  pickup: () => { tone(660, 0.07, 'square', 0.12); setTimeout(() => tone(990, 0.09, 'square', 0.12), 60); },
  kick: () => { noise(0.1, 0.5, 300, 1); tone(110, 0.12, 'sine', 0.4, 0.5); },
  place: () => { noise(0.08, 0.4, 500, 1.5); tone(200, 0.08, 'triangle', 0.2, 0.7); },
  denied: () => tone(160, 0.12, 'square', 0.12, 0.8),
};

export const sfx2 = {
  boom: () => { noise(0.5, 0.8, 140, 0.6); tone(70, 0.4, 'sine', 0.6, 0.4); },
  door: () => { noise(0.35, 0.18, 260, 2); tone(90, 0.3, 'sawtooth', 0.05, 1.4); },
  unlock: () => { tone(880, 0.06, 'square', 0.1); setTimeout(() => tone(660, 0.1, 'square', 0.1), 70); },
  key: () => { tone(1320, 0.08, 'triangle', 0.15); setTimeout(() => tone(1760, 0.12, 'triangle', 0.15), 80); },
  item: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.16), i * 90)),
  descend: () => { tone(330, 0.5, 'sine', 0.25, 0.3); noise(0.6, 0.2, 200, 0.7); },
};

export const sfx3 = {
  hurt: () => { tone(220, 0.18, 'square', 0.18, 0.5); noise(0.12, 0.3, 600, 1); },
  heal: () => { tone(523, 0.12, 'sine', 0.15); setTimeout(() => tone(784, 0.16, 'sine', 0.15), 90); },
  bombPickup: () => { tone(330, 0.08, 'square', 0.12); setTimeout(() => tone(440, 0.1, 'square', 0.12), 60); },
  fuse: () => noise(0.25, 0.12, 4000, 4),
  spawn: () => { tone(110, 0.6, 'sine', 0.18, 2.2); noise(0.6, 0.08, 1200, 6); },
  dissolve: () => { noise(0.3, 0.25, 900, 1.2); tone(300, 0.25, 'triangle', 0.12, 0.4); },
  seal: () => { noise(0.4, 0.3, 120, 0.8); tone(70, 0.4, 'sawtooth', 0.08, 0.8); },
  clear: () => [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 110)),
  rumble: () => { noise(1.2, 0.45, 90, 0.6); tone(45, 1.0, 'sine', 0.5, 0.6); },
  judge: () => tone(880, 0.12, 'sawtooth', 0.06, 0.5),
  death: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.2), i * 220)),
};
