import { describe, expect, it } from 'vitest';
import kairos from '../src/content/items/kairos';
import { Rng } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { createBus } from '../src/game/events';
import { Kairos, KAIROS_CHARGES, KAIROS_INTENTIONS, KAIROS_MARKS, KAIROS_STOP_SECONDS, dealMarks, type KairosMark } from '../src/game/kairos';
import { Inventory } from '../src/items/inventory';
import type { HostApi, ItemDef } from '../src/items/types';

const block = (n: number): KairosMark => ({ kind: 'block', x: n, y: 0, z: 0 });
const proj = (n: number): KairosMark => ({ kind: 'projection', x: n, y: 1, z: 0, actor: n });

describe('Kairos clock and marks', () => {
  it('starts once, and refuses marks while time runs', () => {
    const k = new Kairos();
    expect(k.mark(block(1))).toBe('idle');
    expect(k.start()).toBe(true);
    expect(k.start()).toBe(false);
    expect(k.stopped).toBe(true);
  });

  it('caps the marks at five and refuses the sixth', () => {
    const k = new Kairos();
    k.start();
    for (let i = 0; i < KAIROS_MARKS; i++) expect(k.mark(block(i))).toBe('added');
    expect(k.mark(block(9))).toBe('full');
    expect(k.marks).toHaveLength(KAIROS_MARKS);
  });

  it('releases after six seconds of running game, not before', () => {
    const k = new Kairos();
    k.start();
    expect(k.tick(KAIROS_STOP_SECONDS - 0.5)).toBe(false);
    expect(k.remaining).toBeCloseTo(0.5);
    expect(k.tick(0.4)).toBe(false);
    expect(k.tick(0.2)).toBe(true);
    expect(k.remaining).toBe(0);
  });

  it('end() hands back the marks and leaves nothing behind', () => {
    const k = new Kairos();
    k.start();
    k.mark(block(1));
    k.mark(proj(2));
    const out = k.end();
    expect(out.map(m => m.kind)).toEqual(['block', 'projection']);
    expect(k.stopped).toBe(false);
    expect(k.marks).toHaveLength(0);
    expect(k.tick(10)).toBe(false);
  });

  it('a new stop starts with no marks from the last one', () => {
    const k = new Kairos();
    k.start();
    k.mark(block(1));
    k.end();
    k.start();
    expect(k.marks).toHaveLength(0);
  });
});

describe('dealing marks to intentions', () => {
  it('with no marks every intention goes to the crosshair point', () => {
    expect(dealMarks(KAIROS_INTENTIONS, [])).toEqual(Array(KAIROS_INTENTIONS).fill(null));
  });

  it('five marks: one intention each', () => {
    const marks = [1, 2, 3, 4, 5].map(block);
    expect(dealMarks(KAIROS_INTENTIONS, marks)).toEqual(marks);
  });

  it('fewer marks: round robin, so every mark gets a share', () => {
    const [a, b] = [block(1), proj(2)];
    expect(dealMarks(KAIROS_INTENTIONS, [a, b])).toEqual([a, b, a, b, a]);
    expect(dealMarks(KAIROS_INTENTIONS, [a])).toEqual([a, a, a, a, a]);
  });
});

// The practice's charge lives in its scratch memory: pips, refill, and survival across inventory rebuilds.
function item(def: ItemDef = kairos) {
  const bus = createBus();
  const stats = new StatSheet();
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn), heal: () => {}, collect: () => true,
    damagePlayer: () => {}, rng: () => new Rng(1), message: () => {}, has: (id: string) => inv.has(id), toast: () => {},
    consumeCopy: () => {}, playerFeet: () => ({ x: 0, y: 0, z: 0 }), checkpoint: () => null, setCheckpoint: () => {},
    teleportPlayer: () => {}, invulnerable: () => {}, burst: () => {}, chime: () => {},
  } as unknown as HostApi;
  const inv = new Inventory(new Map([[def.id, def]]), [], stats, () => bus, () => api);
  return { bus, inv, stats };
}

describe('the Kairos charge', () => {
  it('starts full on pickup', () => {
    const { inv } = item();
    inv.gain('kairos');
    expect(inv.memoryFor('kairos').charge).toBe(KAIROS_CHARGES);
  });

  it('a cleared room fills one pip; the charge never passes three', () => {
    const { inv, bus } = item();
    inv.gain('kairos');
    inv.memoryFor('kairos').charge = 0;
    bus.emit('roomClear', { room: 1, drops: [] });
    expect(inv.memoryFor('kairos').charge).toBe(1);
    bus.emit('roomClear', { room: 2, drops: [] });
    bus.emit('roomClear', { room: 3, drops: [] });
    bus.emit('roomClear', { room: 4, drops: [] });
    expect(inv.memoryFor('kairos').charge).toBe(KAIROS_CHARGES);
  });

  it('a boss overcome fills the charge at once', () => {
    const { inv, bus } = item();
    inv.gain('kairos');
    inv.memoryFor('kairos').charge = 0;
    bus.emit('bossOvercome', { boss: 'x', floor: 1, how: 'destroyed', mastery: 0 });
    expect(inv.memoryFor('kairos').charge).toBe(KAIROS_CHARGES);
  });

  it('survives inventory rebuilds', () => {
    const { inv } = item();
    inv.gain('kairos');
    inv.memoryFor('kairos').charge = 2;
    inv.rebuild();
    expect(inv.memoryFor('kairos').charge).toBe(2);
  });

  it('is empty when the practice is not held', () => {
    const { inv } = item();
    expect(inv.memoryFor('kairos')).toEqual({});
  });
});
