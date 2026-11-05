// The touch router (src/combat/touch-router.ts, docs/architecture/SKY.md §5.7): which provider owns a
// routed id, parked creatures, shots and strokes, blasts. Fake providers only; the deities' own rules are
// in sky-creatures.test.ts.

import { describe, expect, it } from 'vitest';
import type { DamageKind } from '../src/core/damage';
import { BLAST_REACH, TouchRouter } from '../src/combat/touch-router';
import type { Polarity } from '../src/combat/polarity';
import type { TouchProvider, TouchTarget, Vec3 } from '../src/sky/types';

interface Touch { id: number; polarity: Polarity; warm: boolean; p: Vec3; kind: DamageKind }

/** A provider like SkyCreatures: `owns` answers for parked ids too, `at` and `targets` do not. */
class Fake implements TouchProvider {
  readonly touches: Touch[] = [];
  readonly parked = new Set<number>();
  constructor(readonly boxes: TouchTarget[]) {}

  owns(id: number) { return this.boxes.some(b => b.id === id); }

  at(x: number, y: number, z: number, r: number) {
    for (const b of this.boxes) {
      if (this.parked.has(b.id)) continue;
      if (Math.abs(x - b.x) > b.hw + r || Math.abs(z - b.z) > b.hw + r) continue;
      if (y < b.y - r || y > b.y + b.h + r) continue;
      return b.id;
    }
    return -1;
  }

  targets() { return this.boxes.filter(b => !this.parked.has(b.id)); }

  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind) {
    this.touches.push({ id, polarity, warm, p, kind });
  }
}

/** A deity-sized box standing on the floor at (x, z): 2 wide, 4 tall. */
const deity = (id: number, x: number, z: number): TouchTarget => ({ id, x, y: 0, z, hw: 1, h: 4 });

describe('touch router: providers', () => {
  it('routes nothing when no provider is added, so the dungeon is unchanged', () => {
    const r = new TouchRouter();
    expect(r.owns(7)).toBe(false);
    expect(r.at(0, 0, 0, 5)).toBe(-1);
    expect(r.targets()).toEqual([]);
    expect(r.touchBody(7, 'positive', true, 'intent')).toBe(false);
    r.blast({ x: 0, y: 0, z: 0 }, 9, 'positive', true, 'item');
  });

  it('sends a touch to the provider that owns the id, and ignores an id nobody owns', () => {
    const r = new TouchRouter();
    const a = new Fake([deity(1, 0, 0)]), b = new Fake([deity(2, 10, 0)]);
    r.add(a); r.add(b);
    r.touch(2, 'positive', true, { x: 10, y: 2, z: 0 }, 'intent');
    r.touch(99, 'positive', true, { x: 0, y: 0, z: 0 }, 'intent');
    expect(a.touches).toHaveLength(0);
    expect(b.touches).toEqual([{ id: 2, polarity: 'positive', warm: true, p: { x: 10, y: 2, z: 0 }, kind: 'intent' }]);
  });

  it('adds a provider once, and a removed one is no longer routed', () => {
    const r = new TouchRouter();
    const a = new Fake([deity(1, 0, 0)]);
    r.add(a); r.add(a);
    expect(r.targets()).toHaveLength(1);
    r.remove(a);
    expect(r.owns(1)).toBe(false);
    expect(r.at(0, 2, 0, 1)).toBe(-1);
    expect(r.targets()).toEqual([]);
  });

  it('concatenates the targets of every provider in the order they were added', () => {
    const r = new TouchRouter();
    r.add(new Fake([deity(1, 0, 0)]));
    r.add(new Fake([deity(2, 5, 0), deity(3, 9, 0)]));
    expect(r.targets().map(t => t.id)).toEqual([1, 2, 3]);
  });
});

describe('touch router: shots and strokes', () => {
  it.each(['intent', 'cut', 'beam'] as const)('a %s touch on a sky target lands one positive touch at the body centre', kind => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    r.add(f);
    expect(r.owns(4)).toBe(true);
    expect(r.touchBody(4, 'positive', true, kind)).toBe(true);
    expect(f.touches).toEqual([{ id: 4, polarity: 'positive', warm: true, p: { x: 3, y: 2, z: 3 }, kind }]);
  });

  it('a beam stroke counts once: only its first tick is warm', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    r.add(f);
    r.touchBody(4, 'positive', true, 'beam');
    for (let tick = 0; tick < 5; tick++) r.touchBody(4, 'positive', false, 'beam');
    expect(f.touches.filter(t => t.warm)).toHaveLength(1);
    expect(f.touches).toHaveLength(6);
  });

  it('a plain shot is routed to the sky creature and never reaches a projection in the same place', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    r.add(f);
    expect(r.at(3.5, 2, 3.5, 0)).toBe(4);
    expect(r.touchBody(4, 'positive', true, 'intent')).toBe(true);
    expect(r.touchBody(5, 'positive', true, 'intent')).toBe(false);
  });

  it('a negative touch goes through once and does nothing else here: the puff is the provider’s', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    r.add(f);
    r.touchBody(4, 'negative', true, 'intent');
    expect(f.touches).toEqual([{ id: 4, polarity: 'negative', warm: true, p: { x: 3, y: 2, z: 3 }, kind: 'intent' }]);
  });
});

describe('touch router: parked creatures', () => {
  it('owns, at and targets skip a parked creature', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    f.parked.add(4);
    r.add(f);
    expect(r.owns(4)).toBe(false);
    expect(r.at(3, 2, 3, 0)).toBe(-1);
    expect(r.targets()).toEqual([]);
    expect(r.touchBody(4, 'positive', true, 'intent')).toBe(false);
    expect(f.touches).toHaveLength(0);
  });

  it('a creature that comes back is routed again', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(4, 3, 3)]);
    f.parked.add(4);
    r.add(f);
    f.parked.delete(4);
    expect(r.owns(4)).toBe(true);
    expect(r.at(3, 2, 3, 0)).toBe(4);
  });
});

describe('touch router: blasts', () => {
  const two = () => {
    const r = new TouchRouter();
    const near = new Fake([deity(1, 2, 0)]);
    const far = new Fake([deity(2, 40, 0)]);
    r.add(near); r.add(far);
    return { r, near, far };
  };

  it('a love blast gives one warm positive touch per deity in range and none out of range', () => {
    const { r, near, far } = two();
    r.blast({ x: 0, y: 2, z: 0 }, 3, 'positive', true, 'item');
    expect(near.touches).toHaveLength(1);
    expect(near.touches[0]).toMatchObject({ id: 1, polarity: 'positive', warm: true, kind: 'item' });
    expect(far.touches).toHaveLength(0);
  });

  it('a love blast touches each deity once, whatever its radius', () => {
    const { r, near } = two();
    r.blast({ x: 2, y: 2, z: 0 }, 50, 'positive', true, 'item');
    expect(near.touches).toHaveLength(1);
  });

  it('a love blast lands at the nearest point of the box to the centre', () => {
    const { r, near } = two();
    // the deity's box spans x 1..3, y 0..4, z −1..1; the centre is to the west of it
    r.blast({ x: -2, y: 1, z: 0 }, 6, 'positive', true, 'item');
    expect(near.touches[0].p).toEqual({ x: 1, y: 1, z: 0 });
  });

  it('a negative blast gives one puff per deity in range', () => {
    const r = new TouchRouter();
    const a = new Fake([deity(1, 2, 0), deity(3, 2.5, 0.5)]);
    r.add(a);
    r.blast({ x: 0, y: 2, z: 0 }, 3, 'negative', true, 'explosion');
    expect(a.touches.map(t => t.id)).toEqual([1, 3]);
    expect(a.touches.every(t => t.polarity === 'negative' && t.kind === 'explosion')).toBe(true);
  });

  it('a blast reaches a deity whose centre is just inside the blast radius plus the reach', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(1, 0, 0)]);
    r.add(f);
    const dist = 3 + BLAST_REACH - 0.01;
    r.blast({ x: dist, y: 2, z: 0 }, 3, 'negative', true, 'explosion');
    expect(f.touches).toHaveLength(1);
    f.touches.length = 0;
    r.blast({ x: 3 + BLAST_REACH + 0.01, y: 2, z: 0 }, 3, 'negative', true, 'explosion');
    expect(f.touches).toHaveLength(0);
  });

  it('a blast skips parked creatures', () => {
    const r = new TouchRouter();
    const f = new Fake([deity(1, 2, 0)]);
    f.parked.add(1);
    r.add(f);
    r.blast({ x: 0, y: 2, z: 0 }, 3, 'positive', true, 'item');
    expect(f.touches).toHaveLength(0);
  });
});
