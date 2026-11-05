// Sound part 'lion' of the sky (docs/architecture/SKY.md §13), synthesised like src/audio/sfx.ts. Owned by: B4.
// One sound per telegraph of LION.md, built from the spatial cues the game already synthesises, placed at the lion.
// Provisional: the lion's own voice (a real roar, a purr) waits for the audio pass.

import { spatial } from '../sfx';
import type { SkySoundPart } from '../../sky/types';

/** The lion's cue → the spatial sounds that make it, in order. */
const VOICE: Record<string, readonly string[]> = {
  roar: ['windup', 'ring'],
  whistle: ['pull'],
  crouch: ['windup'],
  leap: ['leap'],
  flare: ['windup', 'bolt'],
  rustle: ['hide'],
  tick: ['line'],
  breath: ['pull', 'ring'],
  hum: ['field'],
  purr: ['field'],
  growl: ['windup'],
  stare: ['quake'],
  huff: ['hide'],
};

export const SKY_LION_SOUND: SkySoundPart = {
  play(name: string, x: number, y: number, z: number) {
    for (const k of VOICE[name] ?? []) spatial.cue(k, x, y, z);
  },
};
