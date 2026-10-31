// Sound effects synthesised with WebAudio: zero audio files, zero licensing headaches.

import { fx } from '../core/fx';

let ctx: AudioContext | null = null;
let master: GainNode;

let masterTarget = 0.35;
/** The volume the world wants now (silence: nothing), eased in `easeMaster`. */
export function setMasterTarget(v: number) { masterTarget = v; }
export function easeMaster(dt: number) {
  if (!ctx) return;
  master.gain.value += (masterTarget - master.gain.value) * (1 - Math.exp(-2 * dt));
}

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, out: AudioNode = master) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur);
}

function noise(dur: number, vol: number, freq: number, q = 1, out: AudioNode = master) {
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
  src.connect(f).connect(g).connect(out);
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
  mend: () => tone(jitter(700), 0.09, 'sine', 0.1, 1.4),
  /** A block breaks against your head: a dull knock and a little upward chirp. */
  headbutt: () => { noise(0.12, 0.45, jitter(420), 1.2); tone(jitter(380), 0.14, 'square', 0.1, 1.9); },
};

export const sfx2 = {
  boom: () => { noise(0.5, 0.8, 140, 0.6); tone(70, 0.4, 'sine', 0.6, 0.4); },
  door: () => { noise(0.35, 0.18, 260, 2); tone(90, 0.3, 'sawtooth', 0.05, 1.4); },
  unlock: () => { tone(880, 0.06, 'square', 0.1); setTimeout(() => tone(660, 0.1, 'square', 0.1), 70); },
  key: () => { tone(1320, 0.08, 'triangle', 0.15); setTimeout(() => tone(1760, 0.12, 'triangle', 0.15), 80); },
  item: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.16), i * 90)),
  descend: () => { tone(330, 0.5, 'sine', 0.25, 0.3); noise(0.6, 0.2, 200, 0.7); },
  /** Cut Ties with Toxic Relationships: a quick airy cut. */
  swish: () => { noise(0.14, 0.35, jitter(2600), 1.4); tone(jitter(900), 0.1, 'sine', 0.08, 0.5); },
  /** A charge is full: a small clear bell. */
  charged: () => { tone(1175, 0.18, 'triangle', 0.12); setTimeout(() => tone(1568, 0.25, 'triangle', 0.1), 70); },
  /** Remember Breathing: the held breath let out, a warm sustained roar for the beam's second. */
  beam: () => { tone(110, 1.0, 'sawtooth', 0.09, 0.9); tone(220, 1.0, 'sine', 0.14, 1.05); noise(1.0, 0.18, 700, 0.7); },
  /** One Clear Cut: a deep, long sweep. */
  greatcut: () => { noise(0.5, 0.5, 1400, 0.6); tone(160, 0.5, 'sawtooth', 0.1, 0.5); tone(80, 0.6, 'sine', 0.3, 0.6); },
};

/**
 * Spatial sound (BESTIARY §2.3): a 3D panner at each source, with the listener on the camera.
 * Sounds meant to be found start with a transient (a click, a crack) so the ear can locate the onset.
 */
function panner(x: number, y: number, z: number): AudioNode | null {
  if (!ctx) return null;
  const p = ctx.createPanner();
  p.panningModel = 'HRTF';
  p.distanceModel = 'inverse';
  p.refDistance = 2;
  p.rolloffFactor = 1;
  p.maxDistance = 24;
  place(p, x, y, z);
  p.connect(master);
  return p;
}

/**
 * Firefox has no positionX/forwardX AudioParams on panners and listeners (it still has setPosition and
 * setOrientation). Reading a missing one threw inside the frame loop and froze the game, so both paths are kept.
 */
export function place(node: PannerNode | AudioListener, x: number, y: number, z: number) {
  if (node.positionX) { node.positionX.value = x; node.positionY.value = y; node.positionZ.value = z; }
  else node.setPosition(x, y, z);
}

export const spatial = {
  /** The listener is the camera: its position and where it looks. */
  listener(x: number, y: number, z: number, dx: number, dz: number) {
    if (!ctx) return;
    const l = ctx.listener;
    place(l, x, y, z);
    if (l.forwardX) {
      l.forwardX.value = dx; l.forwardY.value = 0; l.forwardZ.value = dz;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else l.setOrientation(dx, 0, dz, 0, 1, 0);
  },
  /** An omen opens: a short click, then a hum that rises from the floor and falls from a ceiling. */
  omenHum(x: number, y: number, z: number, kind: 'floor' | 'wall' | 'ceiling') {
    const out = panner(x, y, z);
    noise(0.03, 0.3, 3000, 3, out ?? master);
    if (kind === 'floor') tone(jitter(140), 1.0, 'sine', 0.16, 1.4, out ?? master);
    else if (kind === 'ceiling') tone(jitter(260), 1.0, 'sine', 0.16, 0.85, out ?? master);
    else tone(jitter(180), 1.0, 'sine', 0.14, 1.0, out ?? master);
  },
  /** The crack opens and the projection breaks out of the room. */
  breach(x: number, y: number, z: number) {
    const out = panner(x, y, z);
    noise(0.12, 0.5, jitter(900), 1.5, out ?? master);
    tone(jitter(220), 0.2, 'square', 0.1, 0.5, out ?? master);
  },
  /** A door slams shut at its own place in the room. */
  slam(x: number, y: number, z: number) {
    const out = panner(x, y, z);
    noise(0.35, 0.6, 160, 0.7, out ?? master);
    tone(60, 0.3, 'sawtooth', 0.4, 0.6, out ?? master);
  },
  cue(kind: string, x: number, y: number, z: number) {
    const out = panner(x, y, z) ?? master;
    switch (kind) {
      case 'line': noise(0.04, 0.35, 3200, 3, out); tone(jitter(300), 0.5, 'sawtooth', 0.06, 0.6, out); break;
      case 'ring': noise(0.1, 0.4, 260, 1.2, out); tone(jitter(90), 0.8, 'sine', 0.2, 1.3, out); break;
      case 'field': tone(jitter(330), 0.9, 'sine', 0.08, 1.1, out); tone(jitter(495), 0.9, 'sine', 0.05, 1.1, out); break;
      case 'pull': noise(0.9, 0.12, 700, 0.6, out); break;
      case 'sweep': noise(0.6, 0.3, 180, 0.8, out); tone(jitter(120), 0.7, 'triangle', 0.1, 1.2, out); break;
      case 'bolt': noise(0.02, 0.4, 4500, 4, out); break;
      case 'leap': noise(0.06, 0.4, 500, 1.5, out); tone(jitter(200), 0.15, 'square', 0.08, 0.6, out); break;
      case 'hide': noise(0.2, 0.25, 220, 1, out); break;
      case 'chirp': tone(jitter(2100), 0.07, 'sine', 0.05, 1.3, out); tone(jitter(2100), 0.07, 'sine', 0.04, 1.2, out); break;
      case 'phase': tone(jitter(440), 1.2, 'sine', 0.1, 1.3, out); tone(jitter(660), 1.2, 'sine', 0.06, 1.2, out); break;
      // a boss winds up: a short rising growl, so the stop before an attack is heard as well as seen
      case 'windup': tone(jitter(110), 0.45, 'sawtooth', 0.07, 2.2, out); noise(0.3, 0.12, 400, 1.6, out); break;
      // a heavy impact: a deep thud under a crack of stone
      case 'quake': noise(0.35, 0.5, 140, 0.7, out); tone(jitter(55), 0.5, 'sine', 0.35, 0.5, out); break;
      default: noise(0.05, 0.3, 800, 1, out);
    }
  },
  /** Before a later wave: a low, unpositioned swell that says more are coming. */
  swell() {
    tone(110, 1.5, 'sine', 0.14, 1.6);
    tone(165, 1.5, 'triangle', 0.08, 1.5);
  },
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
  /** The loaded intention switches (F): a short tick, rising to positive, falling to negative. */
  polarity: (negative: boolean) => tone(negative ? 360 : 620, 0.09, 'triangle', 0.14, negative ? 0.7 : 1.5),
  /** A projection turns to your side: a warm, rising pair. */
  converted: () => { tone(523, 0.14, 'sine', 0.14); setTimeout(() => tone(784, 0.2, 'sine', 0.14), 110); },
  /** An ally turns hostile again: a cold, falling pair. */
  relapsed: () => { tone(330, 0.16, 'triangle', 0.16, 0.6); setTimeout(() => tone(220, 0.25, 'triangle', 0.14, 0.7), 110); },
  judge: () => tone(880, 0.12, 'sawtooth', 0.06, 0.5),
  death: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'sine', 0.2), i * 220)),
  /** The boss's practice appears: a rising, open chord. */
  reveal: () => [392, 587, 784, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'sine', 0.12), i * 120)),
  /** Water meets fire or lava: a hiss of steam (louder for a quench). */
  hiss: (big: boolean) => { noise(big ? 0.6 : 0.3, big ? 0.35 : 0.18, jitter(5200), 0.7); if (big) tone(jitter(180), 0.3, 'sine', 0.08, 0.6); },
  /** Something catches fire: a soft whump and a crackle. */
  catch: () => { noise(0.25, 0.3, jitter(380), 0.9); setTimeout(() => noise(0.08, 0.15, jitter(3000), 3), 90); },
  /** Into the water: a splash. */
  splash: () => { noise(0.35, 0.35, jitter(900), 0.6); tone(jitter(240), 0.15, 'sine', 0.1, 0.5); },
  /** Out of breath: a dull bubble. */
  gulp: () => tone(jitter(150), 0.18, 'sine', 0.2, 1.8),
  creak: () => { tone(jitter(140), 0.35, 'sawtooth', 0.05, 1.8); noise(0.3, 0.12, jitter(700), 3); },
  spit: () => { tone(jitter(420), 0.09, 'sine', 0.16, 2.2); noise(0.05, 0.12, jitter(2400), 2); },
  /** R: a soft breath out as the screen goes dark. */
  restart: () => { tone(294, 0.6, 'sine', 0.14, 0.5); noise(0.5, 0.08, 500, 0.8); },
};
