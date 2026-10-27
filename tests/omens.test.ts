// Omens and waves (docs/design/BESTIARY.md §2): a projection is announced at a spawn point that is
// never by a door and preferably away from the player; a room's roster splits into waves of three.

import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  DOOR_CLEARANCE, OMEN_BREACH, OMEN_GATHER, PLAYER_CLEARANCE, pickSpawnCell, splitWaves, WAVE_SIZE,
} from '../src/game/omens';

/** Every cell of a 13 × 7 room interior, centred on the cell (as the game does). */
function roomCells(x0 = 0, z0 = 0) {
  const out: { x: number; z: number }[] = [];
  for (let row = 0; row < 7; row++) for (let col = 0; col < 13; col++) out.push({ x: x0 + col + 0.5, z: z0 + row + 0.5 });
  return out;
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

describe('spawn points', () => {
  it('never picks a cell by a door', () => {
    const cells = roomCells();
    const doors = [{ x: 0.5, z: 3.5 }, { x: 12.5, z: 3.5 }];
    for (let seed = 1; seed <= 200; seed++) {
      const c = pickSpawnCell(cells, doors, { x: 6.5, z: 3.5 }, new Rng(seed))!;
      expect(c).not.toBeNull();
      for (const d of doors) expect(dist(c, d)).toBeGreaterThanOrEqual(DOOR_CLEARANCE);
    }
  });

  it('prefers a cell away from the player when there is one', () => {
    const cells = roomCells();
    const player = { x: 6.5, z: 3.5 };
    for (let seed = 1; seed <= 200; seed++) {
      const c = pickSpawnCell(cells, [], player, new Rng(seed))!;
      expect(dist(c, player)).toBeGreaterThanOrEqual(PLAYER_CLEARANCE);
    }
  });

  it('never picks a cell within the safety radius of the player', () => {
    const cells = [{ x: 1.5, z: 1.5 }, { x: 2.5, z: 1.5 }];
    expect(pickSpawnCell(cells, [], { x: 1.5, z: 1.5 }, new Rng(3))).toBeNull();
  });

  it('returns null when no cell is clear of the doors', () => {
    const cells = [{ x: 0.5, z: 0.5 }];
    expect(pickSpawnCell(cells, [{ x: 0.5, z: 0.5 }], { x: 9, z: 9 }, new Rng(1))).toBeNull();
  });

  it('is deterministic for the same seed', () => {
    const cells = roomCells();
    const a = pickSpawnCell(cells, [], { x: 6.5, z: 3.5 }, new Rng(42));
    const b = pickSpawnCell(cells, [], { x: 6.5, z: 3.5 }, new Rng(42));
    expect(a).toEqual(b);
  });
});

describe('waves', () => {
  it('splits a roster into waves of at most three, in order', () => {
    const roster = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const waves = splitWaves(roster);
    expect(WAVE_SIZE).toBe(3);
    expect(waves).toEqual([['a', 'b', 'c'], ['d', 'e', 'f'], ['g']]);
    expect(waves.flat()).toEqual(roster);
  });

  it('gives an empty roster no waves', () => {
    expect(splitWaves([])).toEqual([]);
  });
});

describe('omen timing', () => {
  it('gathers before it breaches, and the breach lasts a short beat', () => {
    expect(OMEN_GATHER).toBeGreaterThanOrEqual(0.8);
    expect(OMEN_BREACH).toBeGreaterThan(0);
    expect(OMEN_BREACH).toBeLessThan(OMEN_GATHER);
  });
});
