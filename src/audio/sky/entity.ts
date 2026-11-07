// Sound part 'entity' of the sky (docs/architecture/SKY.md §13), synthesised like src/audio/sfx.ts. Owned by: EN.
//
// The Spiked Entity waits in silence, where the master volume falls to nothing. Its voices go through their
// own gain straight to the speakers, so in the one quiet place of the world the only thing you hear is it:
//   drone  a low, slow-beating hum (2.4 s, swells in and out: play it again as it ends while the player is near)
//   tink   a touch bounces: a small, dull, stony tick (rate-limited, so a beam does not buzz)
//   chord  the staircase opens: open fifths rising one after another, unresolved, upward

import { fx } from '../../core/fx';
import type { SkySoundPart } from '../../sky/types';
import { audioContext, place } from '../sfx';

/** The entity's own level (the master's usual level, which silence does not lower). */
const LEVEL = 0.35;
/** The shortest gap between two tinks, seconds. */
const TINK_GAP = 0.09;
export const DRONE_SECONDS = 2.4;

let bus: GainNode | null = null;
let lastTink = -Infinity;

function out(ctx: AudioContext, x: number, y: number, z: number): AudioNode {
  if (!bus || bus.context !== ctx) {
    bus = ctx.createGain();
    bus.gain.value = LEVEL;
    bus.connect(ctx.destination);
  }
  const p = ctx.createPanner();
  p.panningModel = 'HRTF';
  p.distanceModel = 'inverse';
  p.refDistance = 2;
  p.rolloffFactor = 1;
  p.maxDistance = 24;
  place(p, x, y, z);
  p.connect(bus);
  return p;
}

/** One oscillator that swells in over `attack` and fades out by `at + dur`: never a click on its first sample. */
function voice(ctx: AudioContext, to: AudioNode, at: number, freq: number, dur: number, type: OscillatorType, vol: number, attack: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(to);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** Band-passed noise with a soft onset. */
function hush(ctx: AudioContext, to: AudioNode, at: number, dur: number, vol: number, freq: number, q: number, attack: number) {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = fx.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(to);
  src.start(at);
}

export const SKY_ENTITY_SOUND: SkySoundPart = {
  play(name: string, x: number, y: number, z: number) {
    const ctx = audioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'drone': {
        const o = out(ctx, x, y, z);
        // two low sines 1.5 Hz apart: a slow beat, far under 3 Hz, the sound of something that does not move
        voice(ctx, o, t, 55, DRONE_SECONDS, 'sine', 0.22, 0.8);
        voice(ctx, o, t, 56.5, DRONE_SECONDS, 'sine', 0.16, 0.9);
        voice(ctx, o, t, 82.5, DRONE_SECONDS, 'triangle', 0.05, 1.0);
        hush(ctx, o, t, DRONE_SECONDS, 0.06, 110, 0.7, 1.0);
        break;
      }
      case 'tink': {
        if (t - lastTink < TINK_GAP) return;
        lastTink = t;
        const o = out(ctx, x, y, z);
        const f = 1150 * (0.94 + fx.random() * 0.12);
        hush(ctx, o, t, 0.05, 0.25, 3600, 3, 0.003);
        voice(ctx, o, t, f, 0.16, 'triangle', 0.12, 0.004);
        voice(ctx, o, t, f * 2.7, 0.07, 'sine', 0.04, 0.003);
        break;
      }
      case 'chord': {
        const o = out(ctx, x, y, z);
        // G, D, G, D, A: open fifths climbing, each a quarter second after the last, left open at the top
        [98, 147, 196, 294, 440].forEach((f, i) => voice(ctx, o, t + i * 0.25, f, 3.2 - i * 0.2, i < 2 ? 'triangle' : 'sine', 0.11, 0.3));
        break;
      }
    }
  },
};
