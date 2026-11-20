import { describe, expect, it } from 'vitest';
import thread from '../src/content/items/menders-thread';
import { ITEMS, ITEM_BY_ID } from '../src/content/items';
import { validateItem } from '../src/items/validate';
import { ItemPools, isHandedOut, isPromised, isSkyGift } from '../src/items/pool';
import { Rng } from '../src/core/rng';
import type { PoolName } from '../src/items/types';
import { MENDERS_THREAD, gainKeepsThread, menderDropsThread } from '../src/content/presences/thread';
import { NO_COVENANT, PIECE_SOURCE, keepPiece } from '../src/content/presences/covenant';
import { HEALTH_PRACTICE_TABLE, MENDER_PRACTICE_TABLE, TRICKSTER_HEALTH_TABLE, TRICKSTER_PRACTICE_TABLE } from '../src/content/tables/heart-gifts';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const DRAWN: PoolName[] = ['treasure', 'boss', 'vault'];

describe("the Mender's Thread is an inventory item (owner, #228, D10)", () => {
  it('is a valid practice, listed in the catalogue, in the covenant pool only, and promised', () => {
    expect(validateItem(thread)).toEqual([]);
    expect(ITEM_BY_ID.get(MENDERS_THREAD)).toBe(thread);
    expect(Object.keys(thread.pools)).toEqual(['covenant']);
    expect(isPromised(thread)).toBe(true);
    expect(isHandedOut(thread)).toBe(true);
    expect(isSkyGift(thread)).toBe(false);
    expect(ITEMS.filter(isPromised).map(i => i.id)).toEqual([MENDERS_THREAD]);
  });

  it('the validator refuses the covenant pool beside any other pool', () => {
    expect(validateItem({ ...thread, pools: { covenant: 1, treasure: 1 } }).some(e => e.includes('covenant pool'))).toBe(true);
  });

  it('is never drawn by any pool, even when every other item is used up', () => {
    const pools = new ItemPools(ITEMS);
    const rng = new Rng(11);
    for (let i = 0; i < 3 * ITEMS.length; i++) for (const p of DRAWN) expect(pools.drawRuntime(p, rng)).not.toBe(MENDERS_THREAD);
  });

  it('leaves every pedestal reservation as it was before the Thread existed', () => {
    const slots = Array.from({ length: 12 }, (_, i) => ({ key: `room${i}`, pool: DRAWN[i % DRAWN.length] }));
    const without = ITEMS.filter(i => i.id !== MENDERS_THREAD);
    for (let seed = 1; seed <= 30; seed++) {
      const a = new ItemPools(ITEMS), b = new ItemPools(without);
      a.reserve(slots, new Rng(seed));
      b.reserve(slots, new Rng(seed));
      for (const s of slots) expect(a.reservedFor(s.key)).toBe(b.reservedFor(s.key));
    }
  });

  it('is in no presence table: the Listener 15/75/10, the Trickster and the Mender tables are unchanged', () => {
    for (const t of [HEALTH_PRACTICE_TABLE, TRICKSTER_HEALTH_TABLE, TRICKSTER_PRACTICE_TABLE, MENDER_PRACTICE_TABLE]) {
      expect(t.entries.some(e => (e.value as { id: string }).id === MENDERS_THREAD)).toBe(false);
    }
  });

  it('the Mender drops it once, and only the Thread it dropped keeps the Covenant piece', () => {
    expect(menderDropsThread(NO_COVENANT, false, false)).toBe(true);
    expect(menderDropsThread(NO_COVENANT, true, false)).toBe(false);
    expect(menderDropsThread(NO_COVENANT, false, true)).toBe(false);
    expect(menderDropsThread(keepPiece(NO_COVENANT, 'mender'), false, false)).toBe(false);
    expect(gainKeepsThread(MENDERS_THREAD, true)).toBe(true);
    expect(gainKeepsThread(MENDERS_THREAD, false)).toBe(false);
    expect(gainKeepsThread('stoic', true)).toBe(false);
    // the Covenant rule is unchanged: the Mender is still the Thread's one source
    expect(PIECE_SOURCE.mender).toBe('thread');
  });

  it('its name, texts and teaching exist in English and Spanish, with the same numbers', () => {
    const es = (ES.content.items as Record<string, { name: string; effect: string }>)[MENDERS_THREAD];
    expect(es.name).toBeTruthy();
    expect(es.effect).toContain('0,25');
    for (const k of ['teach.menders-thread.quote', 'teach.menders-thread.lesson'] as const) {
      expect((EN.messages as Record<string, string>)[k]).toBeTruthy();
      expect((ES.messages as Record<string, string>)[k]).toBeTruthy();
    }
  });
});
