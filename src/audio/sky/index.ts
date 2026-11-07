// The sky's sounds: a SkyCue goes to the part its prefix names (docs/architecture/SKY.md §13).
// Written once (K0), never edited again.

import type { SkyAudioPartName, SkyCue, SkyPlace, SkySoundPart } from '../../sky/types';
import { SKY_CORE_SOUND } from './core';
import { SKY_ELEPHANT_SOUND } from './elephant';
import { SKY_ENTITY_SOUND } from './entity';
import { SKY_HORSE_SOUND } from './horse';
import { SKY_KOALA_SOUND } from './koala';
import { SKY_LION_SOUND } from './lion';
import { SKY_PANDA_SOUND } from './panda';
import { SKY_TOTALITY_SOUND } from './totality';

export const SKY_SOUND_PARTS: { readonly [P in SkyAudioPartName]: SkySoundPart } = {
  core: SKY_CORE_SOUND,
  panda: SKY_PANDA_SOUND,
  koala: SKY_KOALA_SOUND,
  elephant: SKY_ELEPHANT_SOUND,
  lion: SKY_LION_SOUND,
  horse: SKY_HORSE_SOUND,
  totality: SKY_TOTALITY_SOUND,
  entity: SKY_ENTITY_SOUND,
};

/** The part and the name within it: 'panda.grumble' → ['panda', 'grumble']. */
export function cuePart(cue: SkyCue): [SkyAudioPartName, string] {
  const dot = cue.indexOf('.');
  return [cue.slice(0, dot) as SkyAudioPartName, cue.slice(dot + 1)];
}

export function playSkyCue(cue: SkyCue, x: number, y: number, z: number) {
  const [part, name] = cuePart(cue);
  SKY_SOUND_PARTS[part].play(name, x, y, z);
}

/** The ambience of a place, from every part that has one. */
export function skyAmbience(place: SkyPlace, dt: number) {
  for (const part of Object.values(SKY_SOUND_PARTS)) part.ambience?.(place, dt);
}
