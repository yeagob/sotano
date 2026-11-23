import { describe, expect, it, vi } from 'vitest';
import catharsis, { VOLATILE } from '../src/content/items/catharsis';
import grounding from '../src/content/items/grounding';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { createBus, type GameBus } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi, ItemDef } from '../src/items/types';

// Symbolic Act (catharsis): only the blocks the player THROWS explode. A block that is kicked
// (a block that falls on you while your hands are full is kicked by the core) must not be armed,
// and a block that keeps its tag from an earlier throw must lose it when kicked.

function rig(catalog: readonly ItemDef[]) {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const explode = vi.fn();
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1), message: () => {},
    toast: () => {}, explode,
  } as unknown as HostApi;
  const inv = new Inventory(new Map(catalog.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  return { bus, inv, explode };
}

const throwCube = (bus: GameBus, cube: number) =>
  bus.emit('throw', { cube, material: 1, speed: 9, lift: 2, tags: new Set<string>() });

const kickCube = (bus: GameBus, cube: number, tags: Set<string>) =>
  bus.emit('kick', { cube, material: 1, speed: 6, lift: 3.2, tags: new Set(tags) });

const land = (bus: GameBus, cube: number, tags: Set<string>) =>
  bus.emit('debrisImpact', { cube, x: 1, y: 1, z: 1, material: 1, speed: 8, tags, keepTags: false });

describe('Symbolic Act', () => {
  it('a thrown block is armed and explodes when it lands', () => {
    const { bus, inv, explode } = rig([catharsis]);
    inv.gain('catharsis');
    const thrown = throwCube(bus, 1);
    expect(thrown.tags.has(VOLATILE)).toBe(true);
    land(bus, 1, thrown.tags);
    expect(explode).toHaveBeenCalledWith(1, 1, 1, 1.8, 14, 'volatile');
  });

  it('a block that falls on you with full hands is kicked, not charged: it does not explode', () => {
    const { bus, inv, explode } = rig([catharsis]);
    inv.gain('catharsis');
    const kick = kickCube(bus, 2, new Set());
    expect(kick.tags.has(VOLATILE)).toBe(false);
    land(bus, 2, kick.tags);
    expect(explode).not.toHaveBeenCalled();
  });

  it('a thrown block that is kicked later loses its charge: it does not explode', () => {
    const { bus, inv, explode } = rig([catharsis]);
    inv.gain('catharsis');
    const armed = throwCube(bus, 3).tags;
    const kick = kickCube(bus, 3, armed);
    expect(kick.tags.has(VOLATILE)).toBe(false);
    land(bus, 3, kick.tags);
    expect(explode).not.toHaveBeenCalled();
  });

  it('other tags survive a kick: only the Symbolic Act charge is removed', () => {
    const { bus, inv } = rig([catharsis]);
    inv.gain('catharsis');
    const kick = kickCube(bus, 4, new Set([VOLATILE, 'charged']));
    expect([...kick.tags]).toEqual(['charged']);
  });

  it('with Grounding too, kicked blocks burst (Somatic Release)', () => {
    const { bus, inv, explode } = rig([catharsis, grounding]);
    inv.gain('catharsis');
    inv.gain('grounding');
    const kick = kickCube(bus, 5, new Set());
    expect(kick.tags.has(VOLATILE)).toBe(true);
    land(bus, 5, kick.tags);
    expect(explode).toHaveBeenCalledWith(1, 1, 1, 1.8, 14, 'volatile');
  });
});
