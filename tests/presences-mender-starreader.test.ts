import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import {
  DWELLERS, GIFT_OFFER, MENDER_FLOORS, PRESENCE_KEY, PRESENCE_OFFER_QUESTION, PRESENCE_TALK, findPresenceOffer, leavesAfterOffer,
  leavesOnDecline, menderComesTo, menderFloorOf, placeMessengers, starReaderFloorOf, unlocksPresence, type PlacedRoom,
} from '../src/content/presences';
import { level, LAST_FLOOR } from '../src/content/levels';
import {
  GIFT_HEART_KINDS, MENDER_GIFT_TABLE, STAR_READER_GIFT_TABLE, rollMenderGift, rollStarReaderGift,
} from '../src/content/tables/heart-gifts';
import { PARTS } from '../src/content/parts';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const room = (type: string, template: string, enemies: string[] = []): PlacedRoom => ({ type, enemies, template });

describe('the Mender: the first vault the player opens on its floor (MENDER.md, proposed)', () => {
  it('its floor is one of the vault floors 3 to 5, the same from the same root', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const k = menderFloorOf(new RunRandom(seed));
      expect(MENDER_FLOORS).toContain(k);
      expect(menderFloorOf(new RunRandom(seed))).toBe(k);
    }
  });

  it('comes once per run, and only to a vault of its own floor', () => {
    const run = new RunRandom(4242);
    const k = menderFloorOf(run);
    expect(menderComesTo(run, k, false)).toBe(true);
    expect(menderComesTo(run, k, true)).toBe(false);
    for (const other of [1, 2, 3, 4, 5].filter(f => f !== k)) expect(menderComesTo(run, other, false)).toBe(false);
  });

  it('asks one part from the hand (the Echo\'s rule): any part unlocks it, a material or a flask does not', () => {
    expect(PRESENCE_KEY.mender).toBe('any');
    expect(unlocksPresence('mender', PARTS[0])).toBe(true);
    expect(unlocksPresence('mender', 3)).toBe(false);
    expect(unlocksPresence('mender', undefined)).toBe(false);
    expect(findPresenceOffer('mender', [3, PARTS[0]])).toEqual({ index: 1, carried: PARTS[0] });
    expect(findPresenceOffer('mender', [3])).toBeUndefined();
  });

  it('is a Give or Keep card (not a gift), with its own question, and it stays after the exchange (a dweller)', () => {
    expect(GIFT_OFFER.has('mender')).toBe(false);
    expect(PRESENCE_OFFER_QUESTION.mender).toBe('presence.offer.mender.question');
    expect(DWELLERS.has('mender')).toBe(true);
    expect(leavesAfterOffer('mender')).toBe(false);
    expect(leavesOnDecline('mender')).toBe(false);
    expect(PRESENCE_TALK.mender.drops).toBe(true);
  });
});

describe('the Star-reader: on the Tree, in a quiet room (STAR-READER.md, proposed)', () => {
  it('its floor is one of the Tree floors (levels of kind tree), the same from the same root', () => {
    const treeFloors = [1, 2, 3, 4, 5].filter(k => level(k).kind === 'tree');
    expect(treeFloors.length).toBeGreaterThan(0);
    for (let seed = 1; seed <= 60; seed++) {
      const k = starReaderFloorOf(new RunRandom(seed));
      expect(treeFloors).toContain(k);
      expect(k).toBeLessThanOrEqual(LAST_FLOOR);
      expect(starReaderFloorOf(new RunRandom(seed))).toBe(k);
    }
  });

  it('waits in a quiet normal room of its floor that holds no other presence, and on no other floor', () => {
    const rooms = [room('start', 'hall'), room('normal', 'garden', ['x']), room('normal', 'garden'), room('treasure', 'shrine')];
    placeMessengers(rooms, 2, new RunRandom(5).fork('floor', 2, 'messenger'), {
      deadEnds: [false, false, false, false], tricksterFloor: 4, starReaderFloor: 2,
    });
    expect(rooms[2].presence).toBe('star-reader');
    expect(rooms[2].enemies).toEqual([]);
    expect(rooms.filter(r => r.presence === 'star-reader')).toHaveLength(1);
    const other = [room('normal', 'garden'), room('normal', 'garden')];
    placeMessengers(other, 3, new RunRandom(5).fork('floor', 3, 'messenger'), {
      deadEnds: [false, false], tricksterFloor: 4, starReaderFloor: 2,
    });
    expect(other.some(r => r.presence === 'star-reader')).toBe(false);
  });

  it('asks no part: a Take or Decline card, a dweller that stays when declined', () => {
    expect(PRESENCE_KEY['star-reader']).toBe('none');
    expect(GIFT_OFFER.has('star-reader')).toBe(true);
    expect(PRESENCE_OFFER_QUESTION['star-reader']).toBe('presence.offer.starreader.question');
    expect(findPresenceOffer('star-reader', [])).toEqual({ index: -1 });
    expect(findPresenceOffer('star-reader', [PARTS[0], 3])).toEqual({ index: -1 });
    expect(DWELLERS.has('star-reader')).toBe(true);
    expect(leavesOnDecline('star-reader')).toBe(false);
  });
});

describe('the gifts of the Mender and the Star-reader (proposed, seeded and weighted)', () => {
  it('the Mender: three draws in four a practice of quality three, one in four a special heart', () => {
    expect(MENDER_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['practice', 3], ['heart', 1]]);
    const rng = new RunRandom(91).stream('drops');
    let practice = 0, heart = 0;
    for (let i = 0; i < 4000; i++) {
      const gift = rollMenderGift(rng);
      if (gift.kind === 'item') { practice++; expect(gift.item.quality).toBe(3); }
      else { heart++; expect(GIFT_HEART_KINDS).toContain(gift.heart); }
    }
    expect(practice / 4000).toBeGreaterThan(0.7);
    expect(practice / 4000).toBeLessThan(0.8);
    expect(heart).toBeGreaterThan(0);
  });

  it('the Star-reader: two draws in four quality one, one in four quality two, one in four a special heart', () => {
    expect(STAR_READER_GIFT_TABLE.entries.map(e => [e.value, e.weight])).toEqual([['quality-one', 2], ['quality-two', 1], ['heart', 1]]);
    const rng = new RunRandom(92).stream('drops');
    const counts = { one: 0, two: 0, heart: 0 };
    for (let i = 0; i < 4000; i++) {
      const gift = rollStarReaderGift(rng);
      if (gift.kind === 'heart') { counts.heart++; expect(GIFT_HEART_KINDS).toContain(gift.heart); }
      else if (gift.item.quality === 1) counts.one++;
      else { expect(gift.item.quality).toBe(2); counts.two++; }
    }
    expect(counts.one / 4000).toBeGreaterThan(0.45);
    expect(counts.one / 4000).toBeLessThan(0.55);
    expect(counts.two / 4000).toBeGreaterThan(0.2);
    expect(counts.two / 4000).toBeLessThan(0.3);
    expect(counts.heart / 4000).toBeGreaterThan(0.2);
    expect(counts.heart / 4000).toBeLessThan(0.3);
  });

  it('the same root draws the same gift (a seeded table, not the frame clock)', () => {
    const a = rollStarReaderGift(new RunRandom(7).stream('drops'));
    const b = rollStarReaderGift(new RunRandom(7).stream('drops'));
    expect(a).toEqual(b);
  });

  it('the messages of both presences exist in English and Spanish', () => {
    for (const id of ['mender', 'star-reader'] as const) {
      for (const key of [PRESENCE_TALK[id].name, ...PRESENCE_TALK[id].lines, PRESENCE_TALK[id].silent, PRESENCE_TALK[id].hint]) {
        expect(Object.keys(EN.messages), key).toContain(key);
        expect(Object.keys(ES.messages), key).toContain(key);
      }
    }
    for (const key of [PRESENCE_OFFER_QUESTION.mender!, PRESENCE_OFFER_QUESTION['star-reader']!]) {
      expect(Object.keys(EN.messages), key).toContain(key);
      expect(Object.keys(ES.messages), key).toContain(key);
    }
  });
});
