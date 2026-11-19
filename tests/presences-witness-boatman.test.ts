import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import {
  BOATMAN_TEMPLATE, DWELLERS, GIFT_OFFER, PRESENCE_KEY, PRESENCE_OFFER_QUESTION, PRESENCE_TALK, WITNESS_FLOOR, boatmanFloorOf,
  findPresenceOffer, leavesAfterOffer, leavesOnDecline, placeMessengers, unlocksPresence, type PlacedRoom,
} from '../src/content/presences';
import { LAST_FLOOR } from '../src/content/levels';
import { ROOM_TEMPLATES, cellAt } from '../src/content/rooms';
import { GIFT_HEART_KINDS, rollBoatmanGift, rollWitnessGift, BOATMAN_GIFT_TABLE, WITNESS_GIFT_TABLE } from '../src/content/tables/heart-gifts';
import { PARTS } from '../src/content/parts';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const room = (type: string, template: string, enemies: string[] = []): PlacedRoom => ({ type, enemies, template });

describe('the Witness: the Silence on the last floor (WITNESS.md)', () => {
  it('waits on the last floor, in a quiet normal room, and on no other floor', () => {
    expect(WITNESS_FLOOR).toBe(LAST_FLOOR);
    const rooms = [room('start', 'hall'), room('normal', 'garden', ['x']), room('normal', 'garden'), room('treasure', 'shrine')];
    placeMessengers(rooms, LAST_FLOOR, new RunRandom(5).fork('floor', LAST_FLOOR, 'messenger'), {
      deadEnds: [false, false, false, false], tricksterFloor: 3, witnessFloor: LAST_FLOOR,
    });
    expect(rooms[2].presence).toBe('witness');
    expect(rooms[2].enemies).toEqual([]);
    expect(rooms.filter(r => r.presence === 'witness')).toHaveLength(1);
    const other = [room('normal', 'garden'), room('normal', 'garden')];
    placeMessengers(other, 4, new RunRandom(5).fork('floor', 4, 'messenger'), {
      deadEnds: [false, false], tricksterFloor: 3, witnessFloor: LAST_FLOOR,
    });
    expect(other.some(r => r.presence === 'witness')).toBe(false);
  });

  it('asks no part: a Take or a Decline card, and the gift is a gift (GIFT_OFFER), so nothing leaves the hand', () => {
    expect(PRESENCE_KEY.witness).toBe('none');
    expect(GIFT_OFFER.has('witness')).toBe(true);
    expect(PRESENCE_OFFER_QUESTION.witness).toBe('presence.offer.witness.question');
    expect(findPresenceOffer('witness', [])).toEqual({ index: -1 });
    expect(findPresenceOffer('witness', [3, PARTS[0]])).toEqual({ index: -1 });
  });

  it('is a messenger: it leaves once its gift is taken, and stays when declined', () => {
    expect(leavesAfterOffer('witness')).toBe(true);
    expect(DWELLERS.has('witness')).toBe(false);
    expect(leavesOnDecline('witness')).toBe(false);
    expect(PRESENCE_TALK.witness.drops).toBe(true);
  });
});

describe('the Boatman: a drowned nave of Zone II (BOATMAN.md)', () => {
  it('a run draws its floor from floors 3 and 4 only, the same from the same root', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const k = boatmanFloorOf(new RunRandom(seed));
      expect([3, 4]).toContain(k);
      expect(boatmanFloorOf(new RunRandom(seed))).toBe(k);
    }
  });

  it('waits only in a drowned nave of its floor, and not at all when the floor has none', () => {
    const rooms = [room('start', 'hall'), room('normal', 'garden'), room('normal', BOATMAN_TEMPLATE), room('normal', BOATMAN_TEMPLATE, ['y'])];
    placeMessengers(rooms, 3, new RunRandom(9).fork('floor', 3, 'messenger'), {
      deadEnds: [false, false, false, false], tricksterFloor: 4, boatmanFloor: 3,
    });
    const at = rooms.findIndex(r => r.presence === 'boatman');
    expect(at).toBe(2);
    expect(rooms[2].enemies).toEqual([]);
    const none = [room('normal', 'garden'), room('normal', 'garden')];
    placeMessengers(none, 3, new RunRandom(9).fork('floor', 3, 'messenger'), {
      deadEnds: [false, false], tricksterFloor: 4, boatmanFloor: 3,
    });
    expect(none.some(r => r.presence === 'boatman')).toBe(false);
  });

  it('takes one block from the hand as its toll, and nothing else (the parts and the items do not unlock it)', () => {
    expect(PRESENCE_KEY.boatman).toBe('block');
    expect(unlocksPresence('boatman', 3)).toBe(true);
    expect(unlocksPresence('boatman', PARTS[0])).toBe(false);
    expect(unlocksPresence('boatman', undefined)).toBe(false);
    expect(findPresenceOffer('boatman', [PARTS[0], 3])).toEqual({ index: 1, carried: 3 });
    expect(findPresenceOffer('boatman', [PARTS[0]])).toBeUndefined();
  });

  it('keeps its place after the ferry (a dweller), and its toll is a give, not a gift', () => {
    expect(DWELLERS.has('boatman')).toBe(true);
    expect(leavesAfterOffer('boatman')).toBe(false);
    expect(GIFT_OFFER.has('boatman')).toBe(false);
  });

  it('its island is the K tile of the nave, on the east end, read through the room flips', () => {
    const t = ROOM_TEMPLATES.find(tp => tp.id === BOATMAN_TEMPLATE)!;
    const found: [number, number][] = [];
    for (let r = 0; r < t.rows.length; r++) for (let c = 0; c < t.rows[r].length; c++) {
      if (cellAt(t, c, r, false, false) === 'K') found.push([c, r]);
    }
    expect(found).toHaveLength(1);
    expect(found[0][0]).toBeGreaterThan(t.rows[0].length / 2);
    const [c, r] = found[0];
    expect(cellAt(t, t.rows[0].length - 1 - c, r, true, false)).toBe('K');
  });
});

describe('the gifts of the Witness and the Boatman: tier two, seeded, weighted (proposed)', () => {
  it('three draws in four give a practice of quality two, one in four a special heart', () => {
    expect(WITNESS_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 3], ['heart', 1]]);
    expect(BOATMAN_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 3], ['heart', 1]]);
    const rng = new RunRandom(77).stream('drops');
    let practice = 0, heart = 0;
    for (let i = 0; i < 4000; i++) {
      const gift = rollWitnessGift(rng);
      if (gift.kind === 'item') { practice++; expect(gift.item.quality).toBe(2); }
      else { heart++; expect(GIFT_HEART_KINDS).toContain(gift.heart); }
    }
    expect(practice / 4000).toBeGreaterThan(0.7);
    expect(practice / 4000).toBeLessThan(0.8);
    expect(heart).toBeGreaterThan(0);
  });

  it('the Boatman draws its gift the same way, from its own table', () => {
    const rng = new RunRandom(78).stream('drops');
    for (let i = 0; i < 200; i++) {
      const gift = rollBoatmanGift(rng);
      if (gift.kind === 'item') expect(gift.item.quality).toBe(2);
      else expect(GIFT_HEART_KINDS).toContain(gift.heart);
    }
  });

  it('the messages of both presences exist in English and Spanish', () => {
    for (const id of ['witness', 'boatman'] as const) {
      for (const key of [PRESENCE_TALK[id].name, ...PRESENCE_TALK[id].lines, PRESENCE_TALK[id].silent, PRESENCE_TALK[id].hint]) {
        expect(Object.keys(EN.messages), key).toContain(key);
        expect(Object.keys(ES.messages), key).toContain(key);
      }
    }
    for (const key of [PRESENCE_OFFER_QUESTION.witness!, PRESENCE_OFFER_QUESTION.boatman!]) {
      expect(Object.keys(EN.messages), key).toContain(key);
      expect(Object.keys(ES.messages), key).toContain(key);
    }
  });
});
