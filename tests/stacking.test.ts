// Stacks (docs/design/built/practices/STACKING.md): per-copy stacks that grow with drinks, the
// meal-or-potion routing of the drink family, and the save format that carries them.

import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { BASE_STATS, StatSheet } from '../src/core/stats';
import { createBus, type GameBus } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import { validateCatalogue } from '../src/items/validate';
import type { HostApi, ItemDef } from '../src/items/types';

const DRINK_FAMILY = ['teaceremony', 'herbalism', 'distillation', 'spagyric', 'mindfuleating', 'breakingbread', 'harahachibu', 'grace', 'nourishment'];

function setup() {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const toasts: { owner: string; id: string; params?: Record<string, string | number> }[] = [];
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1),
    message: (owner: { id: string }, id: string, params?: Record<string, string | number>) => toasts.push({ owner: owner.id, id, params }),
  } as unknown as HostApi;
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  const drink = (potion: string) => bus.emit('drink', { potion, rooms: 1 });
  return { bus, stats, inv, toasts, drink };
}

const stackOf = (id: string) => ITEM_BY_ID.get(id)!;

describe('practice definitions', () => {
  it('the nine drink practices exist with a stack, a drink hook and a stack message', () => {
    for (const id of DRINK_FAMILY) {
      const d = stackOf(id);
      expect(d, id).toBeDefined();
      expect(d.stack, id).toBeDefined();
      expect(d.hooks?.some(h => h.event === 'drink' && h.id === 'stack'), id).toBe(true);
      expect(d.messages?.stack, id).toBeTruthy();
      expect(d.tags, id).toContain('nourish');
    }
  });

  it('the eight practices start at quality 1 and Nourishment at 2, with the stated maximums', () => {
    for (const id of DRINK_FAMILY.filter(i => i !== 'nourishment')) expect(stackOf(id).quality, id).toBe(1);
    expect(stackOf('nourishment').quality).toBe(2);
    expect(stackOf('nourishment').stack?.max).toBe(8);
    for (const id of DRINK_FAMILY.filter(i => i !== 'nourishment')) expect(stackOf(id).stack?.max, id).toBe(6);
  });

  it('the catalogue validates with the stack rules (no problems reported)', () => {
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('a stack modifier that is not additive is refused by validation', () => {
    const bad: ItemDef = { ...stackOf('teaceremony'), id: 'bad-stack', stack: { max: 2, stats: [{ stat: 'moveSpeed', layer: 'mul', value: 1.05 }] } };
    expect(validateCatalogue([bad], []).join(' ')).toMatch(/additive/);
  });
});

describe('stacks per drink', () => {
  it('gaining a practice starts it at one stack, and each potion adds one', () => {
    const { inv, drink, stats } = setup();
    inv.gain('teaceremony');
    expect(inv.items[0].stacks).toBe(1);
    expect(stats.all.moveSpeed).toBeCloseTo(BASE_STATS.moveSpeed + 0.05, 9);
    drink('plain-tonic');
    expect(inv.items[0].stacks).toBe(2);
    expect(stats.all.moveSpeed).toBeCloseTo(BASE_STATS.moveSpeed + 0.1, 9);
  });

  it('stacks cap at the maximum, and the stat stops growing there', () => {
    const { inv, drink, stats } = setup();
    inv.gain('teaceremony');
    for (let i = 0; i < 10; i++) drink('plain-tonic');
    expect(inv.items[0].stacks).toBe(6);
    expect(stats.all.moveSpeed).toBeCloseTo(BASE_STATS.moveSpeed + 0.3, 9);
  });

  it('a drink adds one stack, not two, even though the hook runs once per copy', () => {
    const { inv, drink } = setup();
    inv.gain('herbalism');
    drink('plain-tonic');
    expect(inv.items[0].stacks).toBe(2);
  });

  it('each stack toasts the practice message with its total', () => {
    const { inv, drink, toasts } = setup();
    inv.gain('teaceremony');
    drink('plain-tonic');
    const last = toasts.at(-1)!;
    expect(last.id).toBe('stack');
    expect(last.owner).toBe('teaceremony');
    expect(last.params).toMatchObject({ n: 2, value: 10 });
  });

  it('the damage practice adds damage per stack, read from the stat sheet', () => {
    const { inv, drink, stats } = setup();
    inv.gain('herbalism');
    const base = stats.all.damage;
    drink('plain-tonic');
    expect(stats.all.damage).toBeCloseTo(base + 0.35, 9);
  });
});

describe('meal and potion routing', () => {
  it('a meal never stacks a potion practice', () => {
    const { inv, drink } = setup();
    inv.gain('teaceremony');
    drink('meal-small');
    expect(inv.items[0].stacks).toBe(1);
  });

  it('a potion never stacks a meal practice', () => {
    const { inv, drink } = setup();
    inv.gain('mindfuleating');
    drink('plain-tonic');
    expect(inv.items[0].stacks).toBe(1);
  });

  it('a meal stacks a meal practice, and a potion stacks a potion practice', () => {
    const { inv, drink } = setup();
    inv.gain('mindfuleating');
    inv.gain('teaceremony');
    drink('meal-hearty');
    expect(inv.items.find(i => i.def.id === 'mindfuleating')!.stacks).toBe(2);
    expect(inv.items.find(i => i.def.id === 'teaceremony')!.stacks).toBe(1);
    drink('ember-tonic');
    expect(inv.items.find(i => i.def.id === 'teaceremony')!.stacks).toBe(2);
    expect(inv.items.find(i => i.def.id === 'mindfuleating')!.stacks).toBe(2);
  });

  it('Nourishment stacks on a potion and on a meal alike, with its four stats', () => {
    const { inv, drink, stats } = setup();
    inv.gain('nourishment');
    drink('plain-tonic');
    drink('meal-small');
    expect(inv.items[0].stacks).toBe(3);
    expect(stats.all.moveSpeed).toBeCloseTo(BASE_STATS.moveSpeed + 0.02 * 3, 9);
    expect(stats.all.jump).toBeCloseTo(BASE_STATS.jump + 0.025 * 3, 9);
    expect(stats.all.fireRate).toBeCloseTo(BASE_STATS.fireRate + 0.05 * 3, 9);
  });

  it('Nourishment caps at eight stacks', () => {
    const { inv, drink } = setup();
    inv.gain('nourishment');
    for (let i = 0; i < 12; i++) drink(i % 2 ? 'meal-small' : 'plain-tonic');
    expect(inv.items[0].stacks).toBe(8);
  });
});

describe('stacks and the copy they belong to', () => {
  it('each copy counts its own stacks, and a rebuild keeps them', () => {
    const { inv, drink, stats } = setup();
    inv.gain('teaceremony');
    drink('plain-tonic');
    inv.gain('teaceremony');
    expect(inv.items.map(i => i.stacks)).toEqual([2, 1]);
    const before = stats.all.moveSpeed;
    inv.rebuild();
    expect(inv.items.map(i => i.stacks)).toEqual([2, 1]);
    expect(stats.all.moveSpeed).toBeCloseTo(before, 9);
  });

  it('losing a practice removes its stack modifiers: no residue', () => {
    const { inv, drink, stats } = setup();
    inv.gain('teaceremony');
    drink('plain-tonic');
    drink('plain-tonic');
    inv.lose('teaceremony');
    expect(inv.items.length).toBe(0);
    expect(stats.all.moveSpeed).toBe(BASE_STATS.moveSpeed);
  });

  it('losing one of two copies removes only that copy\'s stacks', () => {
    const { inv, drink, stats } = setup();
    inv.gain('teaceremony');
    inv.gain('teaceremony');
    drink('plain-tonic');
    expect(inv.items.map(i => i.stacks)).toEqual([2, 2]);
    inv.lose('teaceremony');
    expect(inv.items.map(i => i.stacks)).toEqual([2]);
    expect(stats.all.moveSpeed).toBeCloseTo(BASE_STATS.moveSpeed + 0.1, 9);
  });

  it('addStack on a copy that is no longer held does nothing', () => {
    const { inv } = setup();
    const { instance } = inv.gain('teaceremony')!;
    inv.lose('teaceremony');
    expect(inv.addStack(instance, 1)).toBe(0);
  });
});

describe('save and restore', () => {
  it('serialize keeps stacks, and restore brings them back identically', () => {
    const a = setup();
    a.inv.gain('teaceremony');
    a.drink('plain-tonic');
    a.drink('plain-tonic');
    a.inv.gain('grace');
    const saved = a.inv.serialize();
    expect(saved).toEqual([{ id: 'teaceremony', stacks: 3 }, { id: 'grace', stacks: 1 }]);
    const b = setup();
    b.inv.restore(saved);
    expect(b.inv.items.map(i => [i.def.id, i.stacks])).toEqual([['teaceremony', 3], ['grace', 1]]);
    expect(b.stats.all.moveSpeed).toBeCloseTo(a.stats.all.moveSpeed, 9);
  });

  it('an old save (a plain list of ids) restores with zero stacks', () => {
    const { inv, stats } = setup();
    inv.restore(['teaceremony', 'nourishment']);
    expect(inv.items.map(i => i.stacks)).toEqual([0, 0]);
    expect(stats.all.moveSpeed).toBe(BASE_STATS.moveSpeed);
  });

  it('restore clamps stacks to the maximum and ignores garbage', () => {
    const { inv } = setup();
    inv.restore([{ id: 'teaceremony', stacks: 99 }, { id: 'teaceremony', stacks: Number.NaN }]);
    expect(inv.items.map(i => i.stacks)).toEqual([6, 0]);
  });

  it('restore does not run onGain again (no extra stack on load)', () => {
    const { inv } = setup();
    inv.restore([{ id: 'teaceremony', stacks: 2 }]);
    expect(inv.items[0].stacks).toBe(2);
  });
});
