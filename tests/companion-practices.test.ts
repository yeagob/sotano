// Practices for the hand, life, allies and tables (docs/design/built/practices/HAND-LIFE-ALLIES-TABLES.md):
// Furoshiki (two more carried things), Kinship (a turned projection heals a quarter heart, once per room
// visit) and Apprenticeship (every brew and cook heals a quarter heart; brews come out iced).
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { APPRENTICE_HEAL } from '../src/content/items/apprenticeship';
import { KINSHIP_HEAL } from '../src/content/items/kinship';
import { SYNERGIES } from '../src/content/synergies';
import { PARTS } from '../src/content/parts';
import { BASE_STATS, StatSheet } from '../src/core/stats';
import { brew, feed, newAlembic } from '../src/game/alembic';
import { createBus, type GameBus } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';

interface Rig { bus: GameBus; inv: Inventory; stats: StatSheet; heals: number[] }

/** The real bus, stat sheet and inventory with the named practices; heals are recorded. */
function rig(items: string[]): Rig {
  const bus = createBus();
  const stats = new StatSheet();
  const heals: number[] = [];
  const mem: Record<string, number> = {};
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: (n: number) => { heals.push(n); }, collect: () => true, damagePlayer: () => {},
    rng: () => ({ next: () => 0.5, pick: (xs: unknown[]) => xs[0] }), message: () => {},
    memory: () => mem, time: () => 0, toast: () => {}, isPlayer: () => true,
  } as unknown as HostApi;
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  for (const id of items) inv.gain(id);
  return { bus, inv, stats, heals };
}

const turned = (from: 'projection' | 'self' = 'projection') => ({
  target: 7, targetKind: 'projection' as const, def: 'doubt', from, to: 'self' as const, source: 'polarity',
});
const room = (id: number) => ({ room: id, floor: 1, type: 'plain', template: 't', firstVisit: true });

describe('Furoshiki', () => {
  it('carries two more things: the base two plus its +2', () => {
    expect(BASE_STATS.carry).toBe(2);
    expect(rig(['furoshiki']).stats.all.carry).toBe(4);
    expect(rig([]).stats.all.carry).toBe(2);
  });

  it('stacks with the other carry practices', () => {
    expect(rig(['furoshiki', 'secondbrain']).stats.all.carry).toBe(5);
  });
});

describe('Kinship', () => {
  it('heals a quarter heart the first time a projection turns to your side in a room', () => {
    const r = rig(['kinship']);
    r.bus.emit('roomEnter', room(1));
    r.bus.emit('factionChange', turned());
    expect(r.heals).toEqual([KINSHIP_HEAL]);
    expect(KINSHIP_HEAL * 4).toBe(2); // 2 points: a quarter of a heart (8 points)
    r.bus.emit('factionChange', turned());
    expect(r.heals).toHaveLength(1);
  });

  it('opens its heal again on each new room visit', () => {
    const r = rig(['kinship']);
    r.bus.emit('roomEnter', room(1));
    r.bus.emit('factionChange', turned());
    r.bus.emit('roomEnter', room(2));
    r.bus.emit('factionChange', turned());
    expect(r.heals).toHaveLength(2);
  });

  it('ignores changes that are not a projection turning to your side', () => {
    const r = rig(['kinship']);
    r.bus.emit('roomEnter', room(1));
    r.bus.emit('factionChange', { ...turned(), to: 'projection' });
    r.bus.emit('factionChange', { ...turned(), targetKind: 'player' as const });
    expect(r.heals).toEqual([]);
  });

  it('does nothing without the practice', () => {
    const r = rig([]);
    r.bus.emit('roomEnter', room(1));
    r.bus.emit('factionChange', turned());
    expect(r.heals).toEqual([]);
  });
});

describe('Apprenticeship', () => {
  it('heals a quarter heart on every brew and every cook', () => {
    const r = rig(['apprenticeship']);
    r.bus.emit('brew', { potion: 'ember-tonic', iced: false, contents: 1, x: 0, y: 0, z: 0 });
    r.bus.emit('cook', { meal: 'meal-small', part: 'flesh' });
    expect(r.heals).toEqual([APPRENTICE_HEAL, APPRENTICE_HEAL]);
    expect(APPRENTICE_HEAL * 4).toBe(2);
  });

  it('brews come out iced, and the alembic hands the flask back iced', () => {
    const r = rig(['apprenticeship']);
    const heart = PARTS.find(p => p.source === 'panic' && p.kind === 'heart')!;
    const a = newAlembic();
    feed(a, heart);
    const out = brew(a, 'positive', r.bus, 4, 5, 6);
    expect(out.flask).toEqual({ potion: 'ember-tonic', iced: true });
  });

  it('without the practice a brew is not iced', () => {
    const r = rig([]);
    const heart = PARTS.find(p => p.source === 'panic' && p.kind === 'heart')!;
    const a = newAlembic();
    feed(a, heart);
    expect(brew(a, 'positive', r.bus, 4, 5, 6).flask).toEqual({ potion: 'ember-tonic' });
  });
});
