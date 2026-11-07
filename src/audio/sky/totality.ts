// Sound part 'totality' of the sky (docs/architecture/SKY.md §13), synthesised like src/audio/sfx.ts. Owned by: TT.
//
//   hum     the Sun's low hum near its volume: two sines a beat apart, 2.4 s, swelling in and out

import type { SkySoundPart } from '../../sky/types';
import { audioContext, place } from '../sfx';

/** The Sun's own level (the master's usual level, which silence does not lower). */
const LEVEL = 0.3;
export const HUM_SECONDS = 2.4;

let bus: GainNode | null = null;

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
function voice(ctx: AudioContext, to: AudioNode, at: number, freq: number, dur: number, type: OscillatorType, vol: number, attack: number, fallTo?: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (fallTo) o.frequency.exponentialRampToValueAtTime(fallTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(to);
  o.start(at);
  o.stop(at + dur + 0.05);
}

export const SKY_TOTALITY_SOUND: SkySoundPart = {
  play(name: string, x: number, y: number, z: number) {
    const ctx = audioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'hum': {
        const o = out(ctx, x, y, z);
        // two sines 1.5 Hz apart: a slow beat, far under 3 Hz, the sound of something very far away
        voice(ctx, o, t, 96, HUM_SECONDS, 'sine', 0.2, 0.7);
        voice(ctx, o, t, 97.5, HUM_SECONDS, 'sine', 0.14, 0.8);
        break;
      }
    }
  },
};
