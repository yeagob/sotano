import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { BuildCount, CHILD_BUILD_BLOCKS } from '../src/game/build-count';
import {
  DWELLERS, GIFT_OFFER, PRESENCE_KEY, PRESENCE_OFFER_QUESTION, PRESENCE_TALK, dwellerFloorOf, findPresenceOffer,
  leavesAfterOffer, leavesOnDecline, placeMessengers, unlocksPresence, type PlacedRoom,
} from '../src/content/presences';
import { LAST_FLOOR } from '../src/content/levels';
import { CHILD_GIFT_TABLE, CHILD_HEART_TABLE, CHILD_PRACTICE_TABLE, GIFT_HEART_KINDS, LISTENER_GIFT_TABLE, rollChildGift } from '../src/content/tables/heart-gifts';
import type { Carried } from '../src/entities/player';

const rooms = (types: string[], enemies: string[][] = []): PlacedRoom[] =>
  types.map((type, i) => ({ type, enemies: enemies[i] ?? [] }));

describe('the Child: where it waits (CHILD.md, proposed)', () => {
  it('a run draws one floor from floor 1 to the last, the same from the same root, never the tutorial', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const k = dwellerFloorOf(new RunRandom(seed), 'child');
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(LAST_FLOOR);
      expect(dwellerFloorOf(new RunRandom(seed), 'child')).toBe(k);
    }
  });

  it('the Child waits in one quiet normal room of its floor, and only there, never in a start room', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const set = rooms(['start', 'normal', 'normal'], [[], ['doubt'], []]);
      placeMessengers(set, 3, new RunRandom(seed).fork('floor', 3, 'messenger'), {
        deadEnds: [false, true, false], tricksterFloor: 9, childFloor: 3,
      });
      expect(set.filter(r => r.presence === 'child')).toHaveLength(1);
      expect(set[0].presence).toBeUndefined();
      expect(set.find(r => r.presence === 'child')!.enemies).toEqual([]);
    }
  });

  it('a floor without the Child holds none', () => {
    const set = rooms(['start', 'normal', 'normal']);
    placeMessengers(set, 2, new RunRandom(4).fork('floor', 2, 'messenger'), {
      deadEnds: [false, true, false], tricksterFloor: 9, childFloor: 3,
    });
    expect(set.some(r => r.presence === 'child')).toBe(false);
  });

  it('the Child is a dweller: it keeps its place after its gift, and it leaves on no refusal', () => {
    expect(DWELLERS.has('child')).toBe(true);
    expect(leavesAfterOffer('child')).toBe(false);
    expect(leavesOnDecline('child')).toBe(false);
    expect(PRESENCE_TALK.child.drops).toBe(true);
  });
});

describe('the Child: its consent (the same card as the Wanderer and the Gardener)', () => {
  it('it asks for no part: any hand, even an empty one, gets its card, and a held part does not unlock it', () => {
    expect(PRESENCE_KEY.child).toBe('none');
    expect(GIFT_OFFER.has('child')).toBe(true);
    expect(PRESENCE_OFFER_QUESTION.child).toBe('presence.offer.child.build');
    expect(unlocksPresence('child', undefined)).toBe(true);
    expect(findPresenceOffer('child', [])).toEqual({ index: -1 });
    const part = { kind: 'heart' } as unknown as Carried;
    expect(unlocksPresence('child', part)).toBe(false);
    expect(findPresenceOffer('child', [part])).toEqual({ index: -1 });
  });

  it('the build asks for the count of blocks it names, and the count is read from the mark the consent set', () => {
    expect(CHILD_BUILD_BLOCKS).toBe(3);
    const builds = new BuildCount();
    for (let i = 0; i < 5; i++) builds.record();
    const mark = builds.mark();
    expect(CHILD_BUILD_BLOCKS - builds.since(mark)).toBe(3);
    builds.record();
    expect(CHILD_BUILD_BLOCKS - builds.since(mark)).toBe(2);
    builds.record(); builds.record();
    expect(builds.reached(mark)).toBe(true);
  });

  it('its lines and its build words exist in both languages (checked by the i18n test; the keys are named here)', () => {
    expect(PRESENCE_TALK.child.lines).toEqual(['presence.child.1', 'presence.child.2']);
    expect(PRESENCE_TALK.child.silent).toBe('presence.child.silent');
    expect(PRESENCE_TALK.child.hint).toBe('presence.child.hint');
  });
});

describe('the Child: its gift (seeded, weighted)', () => {
  it('a practice of quality one (weight 3) or one special heart (weight 1), and both come up', () => {
    expect(CHILD_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 3], ['heart', 1]]);
    const rng = new RunRandom(31).fork('child-test');
    let practices = 0;
    for (let i = 0; i < 2000; i++) {
      const gift = rollChildGift(rng);
      if (gift.kind === 'item') { practices++; expect(gift.item.quality).toBe(1); }
      else expect(GIFT_HEART_KINDS).toContain(gift.heart);
    }
    expect(practices / 2000).toBeGreaterThan(0.68);
    expect(practices / 2000).toBeLessThan(0.82);
  });

  it('the same seed gives the same gift, and the pools hold only what the table names', () => {
    const a = [1, 2, 3, 4].map(() => rollChildGift(new RunRandom(88).stream('drops')));
    const b = [1, 2, 3, 4].map(() => rollChildGift(new RunRandom(88).stream('drops')));
    expect(a).toEqual(b);
    expect(CHILD_PRACTICE_TABLE.entries.every(e => e.value.quality === 1)).toBe(true);
    expect(CHILD_HEART_TABLE.entries.map(e => e.value)).toEqual(GIFT_HEART_KINDS);
  });

  it('the Listener’s 15/75/10 table is unchanged by the Child', () => {
    const weights = LISTENER_GIFT_TABLE.weights({ floor: 1 });
    expect(Object.fromEntries(weights.map(entry => [entry.value, entry.w]))).toEqual({ practice: 15, special: 75, red: 10 });
  });
});

describe('the Child: the build counts from its consent', () => {
  it('a block placed before the consent never finishes the build', () => {
    const builds = new BuildCount();
    for (let i = 0; i < 9; i++) builds.record();
    const mark = builds.mark();
    expect(builds.reached(mark)).toBe(false);
    expect(new BuildCount().since(mark)).toBe(0);
  });
});
