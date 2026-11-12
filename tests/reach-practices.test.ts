import { afterEach, describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { computeStats, BASE_STATS, type StatMod } from '../src/core/stats';
import { itemText } from '../src/i18n/content';
import { setLocale } from '../src/i18n';

// Four practices that did not add reach before (issue #162, owner decision on PR #171): each adds
// one block of block reach through the existing `reach` stat, and says so in both languages.
const REACH_PRACTICES = ['selfefficacy', 'secondbrain', 'grounding', 'kaizen'] as const;

afterEach(() => setLocale('en'));

/** The stat mods a practice gives while it is held (its own `stats` list, tagged with its id). */
function mods(id: string): StatMod[] {
  return (ITEM_BY_ID.get(id)?.stats ?? []).map(s => ({ ...s, source: id }));
}

describe('reach practices (issue #162)', () => {
  it('each of the four adds exactly one block of reach through the reach stat', () => {
    for (const id of REACH_PRACTICES) {
      const reach = (ITEM_BY_ID.get(id)?.stats ?? []).filter(s => s.stat === 'reach');
      expect(reach, id).toEqual([{ stat: 'reach', layer: 'add', value: 1 }]);
      expect(computeStats(mods(id)).reach, id).toBe(BASE_STATS.reach + 1);
    }
  });

  it('holding one of them takes the starting reach of 4 to 5 blocks', () => {
    expect(BASE_STATS.reach).toBe(4);
    for (const id of REACH_PRACTICES) expect(computeStats(mods(id)).reach, id).toBe(5);
  });

  it('keeps the practice own effects next to the reach (Second Brain carry, Grounding kick)', () => {
    expect(computeStats(mods('secondbrain')).carry).toBe(BASE_STATS.carry + 1);
    expect(computeStats(mods('grounding')).kick).toBe(BASE_STATS.kick * 2);
    // mining and damage stay at base for the reach practices that do not touch them
    for (const id of REACH_PRACTICES) {
      const s = computeStats(mods(id));
      expect(s.mining, id).toBe(BASE_STATS.mining);
      expect(s.damage, id).toBe(BASE_STATS.damage);
    }
  });

  it('every effect text says the reach in English and in Spanish', () => {
    for (const id of REACH_PRACTICES) {
      const def = ITEM_BY_ID.get(id)!;
      expect(def.effect, id).toMatch(/Reach \+1 block\.$/);
      setLocale('es');
      expect(itemText(def).effect, id).toMatch(/Alcance \+1 bloque\.$/);
      setLocale('en');
    }
  });
});
