import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import {
  PRESENCE_OFFER_QUESTION, PRESENCE_TALK, TRICKSTER_FIRST_FLOOR, leavesAfterOffer, placeMessengers, placePresences,
  tricksterFloorOf, unlocksPresence, type PlacedRoom,
} from '../src/content/presences';
import { LAST_FLOOR } from '../src/content/levels';
import { ECHO_GIFT_TABLE, TRICKSTER_DEAL_TABLE, rollEchoGift, rollTricksterPractice } from '../src/content/tables/heart-gifts';
import { PARTS } from '../src/content/parts';
import { POTION_IDS } from '../src/content/potions';
import { adoptMeta, defaultMeta, loadMeta, resetMeta, saveMeta, type MetaStore } from '../src/game/meta';

const memory = (initial: string | null = null): MetaStore & { raw: string | null } => {
  const store = { raw: initial, read() { return store.raw; }, write(s: string) { store.raw = s; } };
  return store;
};

const rooms = (types: string[], enemies: string[][] = [], deadEnds: number[] = []): { rooms: PlacedRoom[]; deadEnds: boolean[] } => ({
  rooms: types.map((type, i) => ({ type, enemies: enemies[i] ?? [] })),
  deadEnds: types.map((_, i) => deadEnds.includes(i)),
});

describe('the Trickster: where its floor is (TRICKSTER.md)', () => {
  it('a run draws one floor from TRICKSTER_FIRST_FLOOR to the last floor, the same from the same root', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const k = tricksterFloorOf(new RunRandom(seed));
      expect(k).toBeGreaterThanOrEqual(TRICKSTER_FIRST_FLOOR);
      expect(k).toBeLessThanOrEqual(LAST_FLOOR);
      expect(tricksterFloorOf(new RunRandom(seed))).toBe(k);
    }
  });

  it('different runs meet the Trickster on different floors', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) seen.add(tricksterFloorOf(new RunRandom(seed)));
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe('the Trickster and the Echo: where they wait', () => {
  it('the Trickster waits in a quiet dead end of its floor, in a normal room, and never on another floor', () => {
    const set = rooms(['start', 'normal', 'normal', 'treasure'], [[], ['doubt'], [], []], [1]);
    placeMessengers(set.rooms, 4, new RunRandom(3).fork('floor', 4, 'messenger'), { deadEnds: set.deadEnds, tricksterFloor: 4 });
    expect(set.rooms[1].presence).toBe('trickster');
    expect(set.rooms[1].enemies).toEqual([]);
    expect(set.rooms.filter(r => r.presence)).toHaveLength(1);
    const other = rooms(['normal', 'normal'], [[], []], [0, 1]);
    placeMessengers(other.rooms, 5, new RunRandom(3).fork('floor', 5, 'messenger'), { deadEnds: other.deadEnds, tricksterFloor: 4 });
    expect(other.rooms.some(r => r.presence)).toBe(false);
  });

  it('the Trickster prefers a dead end, and falls back to any normal room when the floor has none', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const withDead = rooms(['normal', 'normal', 'normal'], [[], [], []], [2]);
      placeMessengers(withDead.rooms, 3, new RunRandom(seed).fork('floor', 3, 'messenger'), { deadEnds: withDead.deadEnds, tricksterFloor: 3 });
      expect(withDead.rooms[2].presence).toBe('trickster');
      const noDead = rooms(['normal', 'normal'], [[], []]);
      placeMessengers(noDead.rooms, 3, new RunRandom(seed).fork('floor', 3, 'messenger'), { deadEnds: noDead.deadEnds, tricksterFloor: 3 });
      expect(noDead.rooms.filter(r => r.presence === 'trickster')).toHaveLength(1);
    }
  });

  it('the Trickster never takes the Listener room, and no floor gets a presence in the start room', () => {
    const set = rooms(['normal', 'start'], [[], []], [0]);
    placePresences(set.rooms, 2, new RunRandom(1).fork('floor', 2, 'presence'));
    placeMessengers(set.rooms, 2, new RunRandom(1).fork('floor', 2, 'messenger'), { deadEnds: set.deadEnds, tricksterFloor: 2 });
    expect(set.rooms[1].presence).toBeUndefined();
    expect(set.rooms.filter(r => r.presence)).toHaveLength(1);
  });

  it('the Echo waits once, on the floor where the last run faded, in a quiet normal room; no other floor gets it', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const set = rooms(['normal', 'normal', 'start'], [['doubt'], [], []]);
      placeMessengers(set.rooms, 4, new RunRandom(seed).fork('floor', 4, 'messenger'), { deadEnds: set.deadEnds, tricksterFloor: 9, echoFloor: 4 });
      const placed = set.rooms.filter(r => r.presence === 'echo');
      expect(placed).toHaveLength(1);
      expect(placed[0].enemies).toEqual([]);
      const elsewhere = rooms(['normal', 'normal'], [[], []]);
      placeMessengers(elsewhere.rooms, 5, new RunRandom(seed).fork('floor', 5, 'messenger'), { deadEnds: elsewhere.deadEnds, tricksterFloor: 9, echoFloor: 4 });
      expect(elsewhere.rooms.some(r => r.presence)).toBe(false);
    }
  });

  it('with no fade on record, no Echo waits; the Trickster and the Echo never share a room', () => {
    const none = rooms(['normal', 'normal'], [[], []]);
    placeMessengers(none.rooms, 6, new RunRandom(2).fork('floor', 6, 'messenger'), { deadEnds: none.deadEnds, tricksterFloor: 3 });
    expect(none.rooms.some(r => r.presence === 'echo')).toBe(false);
    for (let seed = 1; seed <= 30; seed++) {
      const both = rooms(['normal', 'normal'], [[], []], [0, 1]);
      placeMessengers(both.rooms, 4, new RunRandom(seed).fork('floor', 4, 'messenger'), { deadEnds: both.deadEnds, tricksterFloor: 4, echoFloor: 4 });
      expect(both.rooms.map(r => r.presence).sort()).toEqual(['echo', 'trickster']);
    }
  });

  it('the floor 0 tutorial never gets a messenger', () => {
    const set = rooms(['normal', 'normal'], [[], []], [0, 1]);
    placeMessengers(set.rooms, 0, new RunRandom(4).fork('floor', 0, 'messenger'), { deadEnds: set.deadEnds, tricksterFloor: 0, echoFloor: 0 });
    expect(set.rooms.some(r => r.presence)).toBe(false);
  });
});

describe('the Trickster and the Echo: what they take and give', () => {
  it('the Trickster asks for a heart; the Echo asks for any part in hand, and never a block or a flask', () => {
    const heart = PARTS.find(p => p.kind === 'heart')!;
    expect(unlocksPresence('trickster', heart)).toBe(true);
    expect(unlocksPresence('trickster', PARTS.find(p => p.kind === 'flesh')!)).toBe(false);
    for (const part of PARTS) expect(unlocksPresence('echo', part)).toBe(true);
    expect(unlocksPresence('echo', 3)).toBe(false);
    expect(unlocksPresence('echo', { potion: POTION_IDS[0] })).toBe(false);
    expect(unlocksPresence('echo', undefined)).toBe(false);
  });

  it('a trade (the Trickster) and a gift (the Echo) both leave the room when their reward appears; the Gardener stays', () => {
    expect(leavesAfterOffer('trickster')).toBe(true);
    expect(leavesAfterOffer('echo')).toBe(true);
    expect(leavesAfterOffer('gardener')).toBe(false);
  });

  it('the Trickster has a laugh for a declined trade, and every presence line exists in its talk record', () => {
    expect(PRESENCE_TALK.trickster.laugh).toBe('presence.trickster.laugh');
    expect(PRESENCE_TALK.echo.laugh).toBeUndefined();
    expect(PRESENCE_OFFER_QUESTION.trickster).toBe('presence.offer.trade.question');
    expect(PRESENCE_OFFER_QUESTION.echo).toBe('presence.offer.echo.question');
    expect(PRESENCE_OFFER_QUESTION.listener).toBeUndefined();
  });

  it('the Trickster gives a practice of quality three, and its health outcome is a health practice (weights 4 to 1)', () => {
    expect(TRICKSTER_DEAL_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 4], ['health', 1]]);
    const rng = new RunRandom(11).fork('trickster-test');
    let healthy = 0;
    for (let i = 0; i < 2000; i++) {
      const item = rollTricksterPractice(rng);
      expect(item.quality).toBe(3);
      if (item.stats?.some(stat => stat.stat === 'maxHearts')) healthy++;
    }
    expect(healthy / 2000).toBeGreaterThan(0.1);
    expect(healthy / 2000).toBeLessThan(0.3);
  });

  it('the Echo gives one key or one bomb, an even draw, and both come up', () => {
    expect(ECHO_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['key', 1], ['bomb', 1]]);
    const rng = new RunRandom(12).fork('echo-test');
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(rollEchoGift(rng));
    expect([...seen].sort()).toEqual(['bomb', 'key']);
  });

  it('the same seed gives the same gift', () => {
    const a = [1, 2, 3].map(() => rollEchoGift(new RunRandom(77).fork('same')));
    const b = [1, 2, 3].map(() => rollEchoGift(new RunRandom(77).fork('same')));
    expect(a).toEqual(b);
  });
});

describe('the Echo remembers where the last run faded (save record)', () => {
  it('a fade on a dungeon floor is kept; a fade on floor 0 or a bad value reads as none', () => {
    const store = memory(JSON.stringify({ v: 2, fade: { floor: 4 } }));
    expect(loadMeta(store).fade).toEqual({ floor: 4 });
    expect(loadMeta(memory(JSON.stringify({ v: 2, fade: { floor: 0 } }))).fade).toBeUndefined();
    expect(loadMeta(memory(JSON.stringify({ v: 2, fade: { floor: 'x' } }))).fade).toBeUndefined();
    expect(loadMeta(memory(JSON.stringify({ v: 2, fade: 3 }))).fade).toBeUndefined();
  });

  it('a fade is saved and adopted, and it survives a reset of the Roots', () => {
    const store = memory();
    const record = { ...defaultMeta(), fade: { floor: 6 } };
    saveMeta(record, store);
    expect(loadMeta(store).fade).toEqual({ floor: 6 });
    const target = { ...defaultMeta(), readOnly: undefined } as ReturnType<typeof loadMeta>;
    adoptMeta(target, record);
    expect(target.fade).toEqual({ floor: 6 });
    adoptMeta(target, defaultMeta());
    expect(target.fade).toBeUndefined();
    const kept = resetMeta({ ...defaultMeta(), fade: { floor: 2 } }, memory());
    expect(kept.fade).toEqual({ floor: 2 });
  });
});
