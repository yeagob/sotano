// The cloud layer opens the sky only for a body rising through it. A body falling down past the layer (for example
// after a fall off the sky's deck) must not be sent back up.
import { describe, expect, it } from 'vitest';
import { RealmGate, SKY_FLOOR_OUT } from '../src/sky/gate';
import type { SkyBounds } from '../src/sky/types';

const CLOUD = { x: 128.5, y: 316, z: 128.5, r: 50 };
const SKY: SkyBounds = { top: 425.5, floorOut: SKY_FLOOR_OUT, deck: [128, 4, 128], crown: [128, 427, 128], cloud: CLOUD };
const pos = (x: number, y: number, z: number) => ({ x, y, z });

describe('RealmGate.check with the cloud layer (STARS.md)', () => {
  it('a body rising into the cloud layer opens the sky', () => {
    expect(RealmGate.check('dungeon', pos(128.5, 317, 128.5), SKY, true)?.to).toBe('sky');
  });

  it('a body falling through the cloud layer does not open the sky', () => {
    expect(RealmGate.check('dungeon', pos(128.5, 317, 128.5), SKY, false)).toBeNull();
    expect(RealmGate.check('dungeon', pos(128.5 + 20, 316.5, 128.5), SKY, false)).toBeNull();
  });

  it('the top of the dungeon sky still opens the sky, rising or falling', () => {
    expect(RealmGate.check('dungeon', pos(10, 430, 10), SKY, false)?.to).toBe('sky');
  });
});
