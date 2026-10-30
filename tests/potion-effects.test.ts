import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { POTION_IDS, POTIONS, type PotionId } from '../src/content/potions';
import { Rng } from '../src/core/rng';
import { BASE_STATS, STAT_LIMITS, StatSheet, type StatName } from '../src/core/stats';
import { createBus, type GameBus } from '../src/game/events';
import { PotionEffects } from '../src/game/potion-effects';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';
import { EN } from '../src/i18n/locales/en';
import { LOCALES } from '../src/i18n/locales';

const setup = () => {
  const stats = new StatSheet();
  return { stats, fx: new PotionEffects(stats) };
};

const timed = POTION_IDS.filter(id => POTIONS[id].duration.kind !== 'instant');

describe('potion effects', () => {
  it('an instant potion heals through the heal value and installs nothing', () => {
    const { stats, fx } = setup();
    expect(fx.drink({ potion: 'plain-tonic' })).toBe(false);
    expect(fx.drink({ potion: 'restoring-draught' })).toBe(false);
    expect(fx.active).toEqual([]);
    expect(stats.all).toEqual(BASE_STATS);
  });

  it('each timed potion changes the stats its effect line names, by the same numbers', () => {
    const expected: Partial<Record<PotionId, Partial<Record<StatName, number>>>> = {
      'footing-tincture': { kick: 1.5 },
      'spring-tonic': { jump: 1.4 },
      'clear-infusion': { range: 1.3, shotSpeed: 1.2 },
      'ember-tonic': { fireRate: 1.3 },
      'patient-draught': { mining: 1.6 },
      'questioning-tincture': {},
    };
    for (const id of timed) {
      const { stats, fx } = setup();
      fx.drink({ potion: id });
      const want = expected[id]!;
      for (const s of Object.keys(BASE_STATS) as StatName[]) {
        expect(stats.get(s), `${id} ${s}`).toBeCloseTo(BASE_STATS[s] * (want[s] ?? 1), 6);
      }
      for (const v of Object.values(want)) expect(EN.messages[POTIONS[id].effect], id).toContain(`×${v}`);
    }
  });

  it('a potion counted in rooms ends after that many sealed rooms', () => {
    const { stats, fx } = setup();
    fx.drink({ potion: 'ember-tonic' });
    expect(fx.roomCleared()).toEqual([]);
    expect(fx.roomCleared()).toEqual([]);
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 1.3);
    expect(fx.roomCleared()).toEqual(['ember-tonic']);
    expect(stats.get('fireRate')).toBe(BASE_STATS.fireRate);
    expect(fx.active).toEqual([]);
  });

  it('ice keeps a room potion one sealed room longer', () => {
    const { fx } = setup();
    fx.drink({ potion: 'clear-infusion', iced: true });
    for (let i = 0; i < 3; i++) expect(fx.roomCleared()).toEqual([]);
    expect(fx.roomCleared()).toEqual(['clear-infusion']);
  });

  it('a floor potion outlasts every room and ends on the next floor entry, which also ends room potions', () => {
    const { stats, fx } = setup();
    fx.drink({ potion: 'spring-tonic' });
    fx.drink({ potion: 'footing-tincture' });
    for (let i = 0; i < 10; i++) fx.roomCleared();
    expect(fx.has('spring-tonic')).toBe(true);
    fx.drink({ potion: 'ember-tonic' });
    expect(fx.floorEntered().sort()).toEqual(['ember-tonic', 'spring-tonic']);
    expect(stats.all).toEqual(BASE_STATS);
  });

  it('drinking a potion that is already active refreshes it and never stacks a second source', () => {
    const { stats, fx } = setup();
    fx.drink({ potion: 'ember-tonic' });
    fx.roomCleared();
    fx.roomCleared();
    fx.drink({ potion: 'ember-tonic' });
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 1.3);
    expect(fx.active).toEqual([{ potion: 'ember-tonic', rooms: 3, locks: 0 }]);
  });

  it('the Questioning Tincture covers one lock and is spent by it, or ends with the floor', () => {
    const { fx } = setup();
    expect(fx.lockDiscount()).toBe(0);
    expect(fx.spendLock()).toBeNull();
    fx.drink({ potion: 'questioning-tincture' });
    expect(fx.lockDiscount()).toBe(1);
    fx.roomCleared();
    expect(fx.spendLock()).toBe('questioning-tincture');
    expect(fx.lockDiscount()).toBe(0);
    expect(fx.has('questioning-tincture')).toBe(false);
    fx.drink({ potion: 'questioning-tincture' });
    expect(fx.floorEntered()).toEqual(['questioning-tincture']);
    expect(fx.lockDiscount()).toBe(0);
  });

  it('gaining and losing practices keeps the potion, and a cleared run leaves nothing behind', () => {
    const bus: GameBus = createBus();
    const stats = new StatSheet();
    const api = {
      bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
      heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1), message: () => {},
    } as unknown as HostApi;
    const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
    const fx = new PotionEffects(stats);
    fx.drink({ potion: 'patient-draught' });
    const before = stats.get('mining');
    const item = ITEMS.find(i => !i.stats?.some(m => m.stat === 'mining'))!;
    inv.gain(item.id);
    inv.lose(item.id);
    inv.restore([]);
    expect(stats.get('mining')).toBeCloseTo(before);
    fx.clear();
    expect(stats.all).toEqual(BASE_STATS);
  });

  it('every potion active at once, with every practice held, keeps every stat finite and within its limits', () => {
    const stats = new StatSheet();
    ITEMS.forEach((it, i) => { for (const m of it.stats ?? []) stats.add({ ...m, source: `item:${i}` }); });
    const fx = new PotionEffects(stats);
    for (const id of timed) fx.drink({ potion: id });
    for (const [s, v] of Object.entries(stats.all) as [StatName, number][]) {
      expect(Number.isFinite(v), s).toBe(true);
      const lim = STAT_LIMITS[s];
      if (lim) { expect(v, s).toBeGreaterThanOrEqual(lim[0]); expect(v, s).toBeLessThanOrEqual(lim[1]); }
    }
  });
});

describe('potion text', () => {
  const keys = POTION_IDS.flatMap(id => [POTIONS[id].name, POTIONS[id].effect]);
  const numbers = (s: string) => [...s.matchAll(/\d+(?:[.,]\d+)?/g)].map(m => m[0].replace(',', '.')).sort();

  it('every potion has its name and effect line in every language, with the same numbers', () => {
    for (const l of LOCALES) for (const k of keys) {
      const m = l.messages[k];
      expect(typeof m, `${l.code} ${k}`).toBe('string');
      expect((m as string).length, `${l.code} ${k}`).toBeGreaterThan(0);
      expect(numbers(m as string), `${l.code} ${k}`).toEqual(numbers(EN.messages[k] as string));
    }
  });

  it('never calls a potion a cure, a treatment, a therapy, a medicine, a medication or a dose', () => {
    const banned = /\b(cur(e|es|ed|a|as|ar|ación)|treatment|therap\w*|terapia\w*|medicin\w*|medicat\w*|medicament\w*|tratamiento\w*|doses?|dosis)\b/i;
    const lab = Object.keys(EN.messages).filter(k => k.startsWith('potion.') || k.startsWith('lab.') || k.startsWith('controls.drink'));
    for (const l of LOCALES) for (const k of lab) {
      const m = l.messages[k as keyof typeof EN.messages];
      const text = typeof m === 'string' ? m : Object.values(m).join(' ');
      expect(text, `${l.code} ${k}`).not.toMatch(banned);
    }
  });
});
