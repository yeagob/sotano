import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { Rng } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { HALF_HEART, QUARTER_HEART } from '../src/entities/actors';
import { createBus, type GameBus } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';

// Art Therapy: four connected blocks placed in a room heal a quarter heart. Once per room, and in
// four rooms per floor at most. The heal API takes half-hearts, so a quarter heart is 0.5. A
// structure built at full health heals nothing and spends neither the room nor the floor.

const STONE = 4;
const MAX_HP = 8;

function setup() {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const heals: number[] = [];
  let hp = MAX_HP / 2; // hurt by default; full() and hurt() set it, the heal mock only records
  const api = {
    get bus() { return bus; },
    stats: () => stats.all,
    has: () => false,
    hasTag: () => false,
    held: () => [],
    rng: () => new Rng(1),
    materialAt: () => STONE,
    message: () => {},
    defer: (fn: () => void) => bus.defer(fn),
    heal: (n: number) => { heals.push(n); },
    counts: () => ({ keys: 0, bombs: 0, hp, maxHp: MAX_HP }),
    damagePlayer: () => {},
    collect: () => true,
    player: () => 1,
    isPlayer: () => true,
  } as unknown as HostApi;
  const inv = new Inventory(new Map([['arttherapy', ITEM_BY_ID.get('arttherapy')!]]), [], stats, () => bus, () => api);
  inv.gain('arttherapy');

  const enter = (room: number, floor: number) => bus.emit('roomEnter', { room, floor, type: 'normal', template: 'test', firstVisit: true });
  const enterFloor = (depth: number) => bus.emit('floorEnter', { depth });
  const place = (x: number, y: number, z: number) => bus.emit('blockPlace', { x, y, z, material: STONE });
  /** Four blocks in a row: the fourth one completes a structure of four. */
  const row = (x0: number) => { for (let i = 0; i < 4; i++) place(x0 + i, 0, 0); };
  const full = () => { hp = MAX_HP; };
  const hurt = () => { hp = MAX_HP / 2; };
  return { heals, enter, enterFloor, place, row, inv, full, hurt };
}

describe('art therapy heals a quarter heart', () => {
  it('four connected blocks heal 0.5 half-hearts, which is 2 damage points', () => {
    const { heals, enter, row } = setup();
    enter(1, 0);
    row(0);
    expect(heals).toEqual([0.5]);
    expect(heals[0] * HALF_HEART).toBe(QUARTER_HEART);
    expect(QUARTER_HEART).toBe(2);
  });

  it('three connected blocks heal nothing', () => {
    const { heals, enter, place } = setup();
    enter(1, 0);
    place(0, 0, 0); place(1, 0, 0); place(2, 0, 0);
    expect(heals).toEqual([]);
  });

  it('blocks that are not connected do not count together', () => {
    const { heals, enter, place } = setup();
    enter(1, 0);
    place(0, 0, 0); place(1, 0, 0); place(5, 0, 0); place(6, 0, 0);
    expect(heals).toEqual([]);
  });
});

describe('art therapy heals once per room', () => {
  it('a second structure in the same room heals nothing more', () => {
    const { heals, enter, row } = setup();
    enter(1, 0);
    row(0);
    row(10);
    expect(heals).toEqual([0.5]);
  });

  it('re-entering a healed room does not heal it again', () => {
    const { heals, enter, row } = setup();
    enter(1, 0);
    row(0);
    enter(2, 0);
    enter(1, 0);
    row(20);
    expect(heals).toEqual([0.5]);
  });

  it('blocks placed in an earlier visit do not count for the structure of a later one', () => {
    const { heals, enter, place, row } = setup();
    enter(1, 0);
    place(0, 0, 0); place(1, 0, 0); place(2, 0, 0);
    enter(2, 0);
    enter(1, 0);
    place(3, 0, 0);
    expect(heals).toEqual([]);
    row(10);
    expect(heals).toEqual([0.5]);
  });

  it('two copies of the item share one memory: the room still heals once', () => {
    const { heals, enter, row, inv } = setup();
    inv.gain('arttherapy');
    enter(1, 0);
    row(0);
    expect(heals).toEqual([0.5]);
  });
});

describe('art therapy at full health', () => {
  it('four blocks at full health heal nothing, and the room is not spent', () => {
    const { heals, enter, row, full, hurt } = setup();
    full();
    enter(1, 0);
    row(0);
    expect(heals).toEqual([]);
    hurt();
    row(10);
    expect(heals).toEqual([0.5]);
  });

  it('a structure at full health does not spend the room: a hurt player still gets the one heal', () => {
    const { heals, enter, row, full, hurt } = setup();
    full();
    enter(1, 0);
    row(0);
    row(10);
    expect(heals).toEqual([]);
    hurt();
    row(20);
    expect(heals).toEqual([0.5]);
    row(30);
    expect(heals).toEqual([0.5]);
  });

  it('a full-health structure does not spend the floor count: only real heals count', () => {
    const { heals, enter, enterFloor, row, full, hurt } = setup();
    enterFloor(2);
    full();
    for (const room of [20, 21, 22, 23]) { enter(room, 2); row(0); }
    expect(heals).toEqual([]);
    for (const room of [24, 25, 26, 27]) { hurt(); enter(room, 2); row(0); }
    expect(heals).toHaveLength(4);
    hurt();
    enter(28, 2);
    row(0);
    expect(heals).toHaveLength(4);
  });
});

describe('art therapy heals in four rooms per floor', () => {
  it('the fifth healable room of a floor heals nothing', () => {
    const { heals, enter, enterFloor, row } = setup();
    enterFloor(2);
    for (const room of [20, 21, 22, 23]) { enter(room, 2); row(0); }
    expect(heals).toHaveLength(4);
    enter(24, 2);
    row(0);
    expect(heals).toHaveLength(4);
  });

  it('the next floor starts again at zero, and going back up does not refill the old one', () => {
    const { heals, enter, enterFloor, row } = setup();
    enterFloor(2);
    for (const room of [20, 21, 22, 23]) { enter(room, 2); row(0); }
    enterFloor(3);
    enter(30, 3); row(0);
    enter(31, 3); row(0);
    expect(heals).toHaveLength(6);
    enter(24, 2);
    row(0);
    expect(heals).toHaveLength(6);
  });

  it('a new run starts with every room and floor count clear', () => {
    const first = setup();
    first.enterFloor(2);
    for (const room of [20, 21, 22, 23]) { first.enter(room, 2); first.row(0); }
    expect(first.heals).toHaveLength(4);
    const next = setup();
    next.enterFloor(2);
    next.enter(20, 2);
    next.row(0);
    expect(next.heals).toEqual([0.5]);
  });
});
