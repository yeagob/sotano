import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { PRESENCE_BY_ID, PRESENCE_TALK, placePresences } from '../src/content/presences';

const rooms = (types: string[], enemies: string[][] = []) =>
  types.map((type, i) => ({ type, enemies: enemies[i] ?? [] }));

describe('presences: where they live', () => {
  it('the Gardener is in the start room of floor 0, and nothing else is there', () => {
    const rs = rooms(['normal', 'start', 'normal']);
    placePresences(rs, 0, new RunRandom(1).fork('floor', 0, 'presence'));
    expect(rs.map(r => r.presence)).toEqual([undefined, 'gardener', undefined]);
  });

  it('every Tree floor has exactly one Listener, in a normal room with no projections', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rs = rooms(['normal', 'normal', 'start', 'treasure'], [['doubt'], [], [], []]);
      placePresences(rs, 2, new RunRandom(seed).fork('floor', 2, 'presence'));
      const placed = rs.filter(r => r.presence);
      expect(placed).toHaveLength(1);
      expect(placed[0].presence).toBe('listener');
      expect(placed[0].type).toBe('normal');
      expect(placed[0].enemies).toEqual([]);
    }
  });

  it('when no normal room is quiet, one is emptied so the Listener still has a home', () => {
    const rs = rooms(['normal', 'normal'], [['doubt'], ['critic']]);
    placePresences(rs, 3, new RunRandom(5).fork('floor', 3, 'presence'));
    const listener = rs.find(r => r.presence === 'listener');
    expect(listener).toBeDefined();
    expect(listener!.enemies).toEqual([]);
  });

  it('floors that are not Tree floors get no Presence', () => {
    const rs = rooms(['normal', 'start'], [[], []]);
    placePresences(rs, 7, new RunRandom(2).fork('floor', 7, 'presence'));
    expect(rs.some(r => r.presence)).toBe(false);
  });
});

describe('presences: what they are', () => {
  it('a Presence never takes damage, only answers positive intentions, and is never in a roster', () => {
    for (const id of ['gardener', 'listener'] as const) {
      const def = PRESENCE_BY_ID.get(id)!;
      expect(def.kind).toBe('creature');
      expect(def.responds).toBe('positive');
      expect(def.minFloor).toBe(99);
      expect(def.hp).toBe(1);
      expect(PRESENCE_TALK[id].lines.length).toBeGreaterThan(0);
    }
  });
});
