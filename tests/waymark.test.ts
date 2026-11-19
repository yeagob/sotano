// Waymark (docs/design/built/practices/will/WAYMARK.md): a checkpoint that works as an extra life. The item's rules
// run through the real inventory and bus with a stand-in host; the game's teleport and checkpoint plumbing run on
// the real Game methods with a rig (the same way boss-bar.test.ts drives a frame).

import { beforeAll, describe, expect, it, vi } from 'vitest';
import waymark, { WAYMARK } from '../src/content/items/waymark';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import { validateItem } from '../src/items/validate';
import { Inventory } from '../src/items/inventory';
import type { HostApi, ItemDef } from '../src/items/types';
import { createBus, type GameBus } from '../src/game/events';
import { StatSheet } from '../src/core/stats';
import { Rng } from '../src/core/rng';
import { Player } from '../src/entities/player';
import { CHECKPOINT_TAG, REVIVE_INVULN_S, REVIVE_SHOVE_RADIUS, releasedRooms, standingSpot } from '../src/game/checkpoint';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 60_000);

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: silent, unlockAudio: () => {} };
});

type Xyz = { x: number; y: number; z: number };

/** A stand-in host with the state a revive reads and writes. Every verb the item uses is recorded. */
function world() {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const s = {
    hp: 24, maxHp: 24, feet: { x: 1, y: 1, z: 1 } as Xyz, cp: null as Xyz | null, invuln: 0, bursts: 0, chimes: 0,
    toasts: [] as string[], teleports: [] as Xyz[], shoves: [] as { id: number; dx: number; dz: number }[],
    projections: [] as { id: number; x: number; y: number; z: number }[],
  };
  const api = {
    get bus() { return bus; },
    stats: () => stats.all,
    has: (id: string) => inv.has(id),
    hasTag: (t: string) => inv.hasTag(t),
    held: () => [],
    rng: () => new Rng(3),
    defer: (fn: () => void) => bus.defer(fn),
    heal: (half: number) => { s.hp = Math.min(s.maxHp, s.hp + half * 4); },
    damagePlayer: () => {},
    message: (_o: unknown, id: string) => { s.toasts.push(id); },
    consumeCopy: (id: string) => { inv.lose(id); },
    playerFeet: () => ({ ...s.feet }),
    checkpoint: () => (s.cp ? { ...s.cp } : null),
    setCheckpoint: (x: number, y: number, z: number) => { s.cp = { x, y, z }; },
    teleportPlayer: (x: number, y: number, z: number) => { s.teleports.push({ x, y, z }); s.feet = { x, y, z }; },
    invulnerable: (sec: number) => { s.invuln = Math.max(s.invuln, sec); },
    burst: () => { s.bursts++; },
    chime: () => { s.chimes++; },
    counts: () => ({ keys: 0, bombs: 0, hp: s.hp, maxHp: s.maxHp }),
    nearestProjection: (x: number, y: number, z: number, r: number, except: readonly number[]) => {
      const p = s.projections.find(q => !except.includes(q.id) && Math.hypot(q.x - x, q.y - y, q.z - z) <= r);
      return p ? { ...p } : null;
    },
    shove: (id: number, dx: number, dz: number) => { s.shoves.push({ id, dx, dz }); },
  } as unknown as HostApi;
  const catalog = new Map<string, ItemDef>(ITEMS.map(i => [i.id, i]));
  const inv = new Inventory(catalog, [], stats, () => bus, () => api);
  return { bus, inv, s };
}

/** A death as the game raises it: the player at zero hearts, `death` emitted from the core loop. */
function die(w: ReturnType<typeof world>) {
  w.s.hp = 0;
  const ev = w.bus.emit('death', { source: 'test' });
  w.bus.flush(64);
  return ev.cancelled;
}

describe('Waymark is a practice that is an extra life', () => {
  it('is a valid practice, in the vault and boss pools, of the will path, carrying the checkpoint tag', () => {
    expect(validateItem(waymark)).toEqual([]);
    expect(ITEM_BY_ID.get(WAYMARK)).toBe(waymark);
    expect(waymark.pools).toEqual({ vault: 1, boss: 0.5 });
    expect(waymark.tags).toContain('will');
    expect(waymark.tags).toContain(CHECKPOINT_TAG);
    expect(waymark.quality).toBe(3);
  });

  it('its effect states the numbers, and its name, effect and teaching exist in both languages with the same numbers', () => {
    expect(waymark.effect).toContain('2.5 s');
    const es = (ES.content.items as Record<string, { name: string; effect: string; messages: Record<string, string> }>)[WAYMARK];
    expect(es.name).toBeTruthy();
    expect(es.effect).toContain('2,5 s');
    expect(es.messages.revived).toBeTruthy();
    expect((EN.messages as Record<string, string>)['teach.waymark.quote']).toBeTruthy();
    expect((ES.messages as Record<string, string>)['teach.waymark.quote']).toBeTruthy();
    expect((EN.messages as Record<string, string>)['teach.waymark.lesson']).toBeTruthy();
    expect((ES.messages as Record<string, string>)['teach.waymark.lesson']).toBeTruthy();
    expect(waymark.messages?.revived).toBe('The waymark brings you back.');
  });

  it('a death with a checkpoint is cancelled, the copy is spent after the event, and nothing else is lost', () => {
    const w = world();
    w.inv.gain('stoic');
    w.inv.gain(WAYMARK);
    w.inv.gain('kaizen');
    w.s.feet = { x: 5.5, y: 3, z: 5.5 };
    w.s.cp = { x: 5.5, y: 3, z: 5.5 };
    expect(die(w)).toBe(true);
    expect(w.s.teleports).toEqual([{ x: 5.5, y: 3, z: 5.5 }]);
    expect(w.s.hp).toBe(w.s.maxHp);
    expect(w.s.invuln).toBe(REVIVE_INVULN_S);
    expect(w.s.toasts).toEqual(['revived']);
    expect(w.s.chimes).toBe(1);
    expect(w.inv.has(WAYMARK)).toBe(false);
    expect(w.inv.has('stoic')).toBe(true);
    expect(w.inv.has('kaizen')).toBe(true);
  });

  it('two copies save the player twice, and the third death is the real one', () => {
    const w = world();
    w.inv.gain(WAYMARK);
    w.inv.gain(WAYMARK);
    expect(die(w)).toBe(true);
    expect(w.inv.items.filter(i => i.def.id === WAYMARK)).toHaveLength(1);
    expect(die(w)).toBe(true);
    expect(w.inv.has(WAYMARK)).toBe(false);
    expect(die(w)).toBe(false);
    expect(w.s.teleports).toHaveLength(2);
  });

  it('with no checkpoint the death stands', () => {
    const w = world();
    w.inv.gain(WAYMARK);
    w.s.cp = null;
    expect(die(w)).toBe(false);
    expect(w.s.teleports).toHaveLength(0);
  });

  it('a new floor moves the checkpoint to its arrival point, and a new copy moves it to the pickup', () => {
    const w = world();
    w.s.feet = { x: 2.5, y: 4, z: 2.5 };
    w.inv.gain(WAYMARK);
    expect(w.s.cp).toEqual({ x: 2.5, y: 4, z: 2.5 });
    w.bus.emit('floorEnter', { depth: 3, arrival: { x: 40.5, y: 22, z: 8.5 } });
    expect(w.s.cp).toEqual({ x: 40.5, y: 22, z: 8.5 });
    w.s.feet = { x: 9.5, y: 22, z: 9.5 };
    w.inv.gain(WAYMARK);
    expect(w.s.cp).toEqual({ x: 9.5, y: 22, z: 9.5 });
  });

  it('projections within the shove radius of the checkpoint are pushed away, and the far ones stay', () => {
    const w = world();
    w.inv.gain(WAYMARK);
    w.s.cp = { x: 0.5, y: 1, z: 0.5 };
    w.s.feet = { x: 30, y: 1, z: 30 };
    w.s.projections = [
      { id: 7, x: 1.5, y: 1, z: 0.5 },
      { id: 8, x: 0.5, y: 1, z: 0.5 },
      { id: 9, x: 0.5 + REVIVE_SHOVE_RADIUS + 3, y: 1, z: 0.5 },
    ];
    expect(die(w)).toBe(true);
    expect(w.s.shoves.map(s => s.id).sort()).toEqual([7, 8]);
    expect(w.s.shoves.find(s => s.id === 7)!.dx).toBeGreaterThan(0);
  });
});

describe('the checkpoint cell is a free standing cell', () => {
  it('is the nearest cell with its feet and head free, with ground under it', () => {
    // a floor under y = 1 and a pillar at (3, 1..3, 3)
    const solid = (x: number, y: number, z: number) => y < 1 || (x === 3 && z === 3 && y >= 1 && y <= 3);
    const at = standingSpot(solid, 3.5, 1, 3.5)!;
    expect(at).not.toBeNull();
    const cx = Math.floor(at.x), cz = Math.floor(at.z);
    expect(solid(cx, at.y, cz)).toBe(false);
    expect(solid(cx, at.y + 1, cz)).toBe(false);
    expect(solid(cx, at.y - 1, cz)).toBe(true);
  });

  it('never returns a cell inside a block, over many starting points', () => {
    const solid = (x: number, y: number, z: number) => y < 1 || (x * 7 + z * 13 + y * 3) % 11 === 0;
    for (let x = -3; x < 12; x++) for (let z = -3; z < 12; z++) {
      const at = standingSpot(solid, x + 0.5, 1, z + 0.5);
      if (!at) continue;
      const cx = Math.floor(at.x), cz = Math.floor(at.z);
      expect(solid(cx, at.y, cz)).toBe(false);
      expect(solid(cx, at.y + 1, cz)).toBe(false);
    }
  });

  it('is null when nothing free is within reach', () => {
    expect(standingSpot(() => true, 0, 0, 0, 3)).toBeNull();
  });

  it('releases every room but the one the player stands in', () => {
    expect(releasedRooms([1, 2, 3], 2)).toEqual([1, 3]);
    expect(releasedRooms([1, 2], null)).toEqual([1, 2]);
  });
});

describe('the game moves the player and keeps doors consistent (a rig on the real Game methods)', () => {
  /** A Game with only the fields the teleport, the rooms and the checkpoint read. */
  function rig(opts: { solid?: (x: number, y: number, z: number) => boolean; roomOf?: (x: number, z: number) => number | null }) {
    const g: any = Object.create(Game.prototype);
    const seals: [number, boolean][] = [];
    const solid = opts.solid ?? ((_x: number, y: number) => y < 1);
    Object.defineProperty(g, 'below', { value: true });
    g.player = new Player();
    g.player.spawnAt(0.5, 1, 0.5);
    g.world = { solid: (x: number, y: number, z: number) => solid(x, y, z), set() {} };
    g.doors = { seal: (room: number, sealed: boolean) => { seals.push([room, sealed]); }, solidAt: () => false };
    g.roomState = new Map<number, { sealed: boolean; cleared: boolean }>();
    g.challenges = new Map<number, { active: boolean }>();
    g.bossRooms = new Map<number, { room: number; spawned: boolean; defeated: boolean }>();
    g.roomAt = (x: number, _y: number, z: number) => {
      const id = (opts.roomOf ?? (() => null))(x, z);
      return id === null ? null : { id };
    };
    g.room = 4; g.zone = 'x'; g.groundBand = 0;
    return { g, seals };
  }

  it('teleportPlayer moves the player to a free cell, never inside a block, with velocity zeroed', () => {
    // a pillar of solid cells at (6, *, 6) up to height 4: the target is inside it
    const { g } = rig({ solid: (x, y, z) => y < 1 || (x === 6 && z === 6 && y < 4) });
    g.player.body.vx = 3; g.player.body.vy = 2; g.player.body.vz = -1;
    g.teleportPlayer(6.5, 1, 6.5);
    const b = g.player.body;
    const cx = Math.floor(b.x), cz = Math.floor(b.z);
    expect(g.solid(cx, b.y, cz)).toBe(false);
    expect(g.solid(cx, b.y + 1, cz)).toBe(false);
    expect(g.solid(cx, b.y - 1, cz)).toBe(true);
    expect([b.vx, b.vy, b.vz]).toEqual([0, 0, 0]);
    expect(g.room).toBe(-1);
  });

  it('opens the doors of a room the player is sent out of', () => {
    // room 1 was sealed by its projections; the checkpoint lies in room 2, which is not live
    const { g, seals } = rig({ roomOf: x => (x > 10 ? 2 : 1) });
    g.roomState.set(1, { sealed: true, cleared: false });
    g.teleportPlayer(12.5, 1, 0.5);
    expect(seals).toEqual([[1, false]]);
    expect(g.roomState.get(1).sealed).toBe(false);
  });

  it('keeps a room sealed when the player is inside it, so its fight keeps its doors', () => {
    const { g, seals } = rig({ roomOf: () => 1 });
    g.roomState.set(1, { sealed: true, cleared: false });
    g.bossRooms.set(3, { room: 1, spawned: true, defeated: false });
    g.teleportPlayer(0.5, 1, 0.5);
    expect(seals.at(-1)).toEqual([1, true]);
    expect(seals.some(([r, s]) => r === 1 && s === false)).toBe(false);
  });

  it('opens a boss room not yet overcome when the player is sent out of it', () => {
    const { g, seals } = rig({ roomOf: x => (x > 10 ? 2 : 5) });
    g.bossRooms.set(3, { room: 5, spawned: true, defeated: false });
    g.teleportPlayer(12.5, 1, 0.5);
    expect(seals).toEqual([[5, false]]);
  });

  it('losing the last checkpoint item clears the checkpoint, and a kept one keeps it', () => {
    const { g } = rig({});
    const bus = createBus();
    const stats = new StatSheet();
    const api: any = {
      bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn), rng: () => new Rng(1), message() {},
      heal() {}, damagePlayer() {}, collect: () => true, counts: () => ({ keys: 0, bombs: 0, hp: 8, maxHp: 8 }),
      playerFeet: () => ({ x: 0, y: 1, z: 0 }), setCheckpoint() {}, consumeCopy() {},
    };
    g.inventory = new Inventory(new Map(ITEMS.map(i => [i.id, i])), [], stats, () => bus, () => api);
    g.hud = { setItems() {} };
    g.checkpointMark = { place() {} };
    g.inventory.gain(WAYMARK);
    g.inventory.gain(WAYMARK);
    g.respawn = { x: 0.5, y: 1, z: 0.5 };
    expect(g.loseItem(WAYMARK)).toBe(true);
    expect(g.respawn).not.toBeNull();
    expect(g.loseItem(WAYMARK)).toBe(true);
    expect(g.respawn).toBeNull();
  });
});
