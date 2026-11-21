import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Player, type PlayerHooks, type PlayerMedium } from '../src/entities/player';
import { computeStats, type Stats } from '../src/core/stats';
import { hitsToBreak } from '../src/core/damage';
import { MAT, mat } from '../src/content/materials';
import { ITEMS } from '../src/content/items';
import { createBus } from '../src/game/events';
import { dashCells, dashTouches, DASH_DAMAGE, DASH_MINING, DASH_TIME } from '../src/entities/dash';
import type { DashDir } from '../src/input/gestures';
import type { Input } from '../src/input/input';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

type Rig = Record<string, any>;

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 240000);

const DT = 1 / 60;
const dry: PlayerMedium = { feet: null, head: null };
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

function blocks(o: { breakable?: [number, number, number][]; hard?: [number, number, number][] }) {
  const soft = new Set((o.breakable ?? []).map(c => key(...c)));
  const hard = new Set((o.hard ?? []).map(c => key(...c)));
  const broken: string[] = [];
  const asked: [number, number, number][] = [];
  const solid = (x: number, y: number, z: number) => y < 0 || soft.has(key(x, y, z)) || hard.has(key(x, y, z));
  const dashBreak = (x: number, y: number, z: number) => {
    asked.push([x, y, z]);
    if (!soft.has(key(x, y, z))) return false;
    soft.delete(key(x, y, z));
    broken.push(key(x, y, z));
    return true;
  };
  return { solid, dashBreak, broken, asked };
}

function rig(w: ReturnType<typeof blocks>) {
  const p = new Player();
  const stats: Stats = computeStats([{ stat: 'dash', layer: 'add', value: 1, source: 'test' }]);
  const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v, dashBreak: w.dashBreak };
  let pending: DashDir | null = null;
  const input = {
    hit: (a: string) => a === 'dash' && pending !== null,
    get dashDir() { return pending; },
    held: () => false,
    move: { x: 0, y: 0 },
    lookDX: 0, lookDY: 0, sensitivity: 0.0022,
  } as unknown as Input;
  const step = (dt = DT, dir: DashDir | null = null) => {
    pending = dir;
    p.update(dt, input, stats, w.solid, hooks, dry);
    pending = null;
  };
  const run = (seconds: number) => { for (let t = 0; t < seconds - 1e-9; t += DT) step(); };
  return { p, step, run };
}

describe('Irimi is a tier 4 practice', () => {
  it('has quality 4 and keeps the dash stat', () => {
    const irimi = ITEMS.find(i => i.id === 'irimi')!;
    expect(irimi.quality).toBe(4);
    expect(irimi.stats).toMatchObject([{ stat: 'dash', layer: 'add', value: 1 }]);
  });
});

describe('the dash breaks the blocks in its way', () => {
  it('a wall of soft blocks breaks and the dash covers its full 4.5 blocks', () => {
    const w = blocks({ breakable: [[4, 0, 0], [4, 1, 0], [5, 0, 0], [5, 1, 0]] });
    const r = rig(w);
    r.p.spawnAt(1.5, 0, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.2);
    const x0 = r.p.body.x;
    r.step(DT, 'forward');
    r.run(0.3);
    expect(w.broken.sort()).toEqual(['4,0,0', '4,1,0', '5,0,0', '5,1,0']);
    expect(r.p.body.x - x0).toBeCloseTo(4.5, 1);
  });

  it('a block it cannot break stops it, and nothing behind that block breaks', () => {
    const w = blocks({ hard: [[4, 0, 0], [4, 1, 0]], breakable: [[5, 0, 0], [5, 1, 0]] });
    const r = rig(w);
    r.p.spawnAt(1.5, 0, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.2);
    r.step(DT, 'forward');
    r.run(0.3);
    expect(w.broken).toEqual([]);
    expect(r.p.body.x + r.p.body.hw).toBeLessThanOrEqual(4 + 1e-6);
  });

  it('a dash looking down never digs below the feet it started from', () => {
    const w = blocks({});
    const r = rig(w);
    r.p.spawnAt(1.5, 0, 0.5); r.p.yaw = -Math.PI / 2; r.p.pitch = -0.6;
    r.run(0.2);
    r.step(DT, 'forward');
    r.run(0.3);
    expect(w.asked.every(([, y]) => y >= 0)).toBe(true);
    expect(r.p.body.y).toBeGreaterThanOrEqual(0);
  });

  it('the cells of a body start at the floor it is given', () => {
    expect(dashCells({ x: 0.5, y: 0, z: 0.5, hw: 0.3, h: 1.8 })).toEqual([[0, 0, 0], [0, 1, 0]]);
    expect(dashCells({ x: 0.5, y: -0.5, z: 0.5, hw: 0.3, h: 1.8 }, 0)).toEqual([[0, 0, 0], [0, 1, 0]]);
  });

  it('it breaks up to deepstone in one dash, and never chips obsidian, frames or bedrock', () => {
    for (const k of ['dirt', 'stone', 'brick', 'ore', 'deepstone'] as const) expect(hitsToBreak(DASH_MINING, mat(MAT[k]))).toBe(1);
    for (const k of ['obsidian', 'frame', 'bedrock'] as const) expect(hitsToBreak(DASH_MINING, mat(MAT[k]))).toBeGreaterThan(1);
  });

  it('the game breaks a soft block through the block pipeline and leaves a hard one untouched', () => {
    const at: Record<string, number> = { '1,0,0': MAT.dirt, '2,0,0': MAT.obsidian, '3,0,0': MAT.frame, '4,0,0': MAT.bedrock };
    const damageBlock = vi.fn(() => true);
    const g: Rig = Object.assign(Object.create(Game.prototype), {
      world: { get: (x: number, y: number, z: number) => at[key(x, y, z)], hp: (x: number, y: number, z: number) => mat(at[key(x, y, z)]).hp, inside: () => true },
      solid: () => true,
      damageBlock,
    });
    expect(g.dashBreak(1, 0, 0)).toBe(true);
    expect(damageBlock).toHaveBeenCalledWith(1, 0, 0, DASH_MINING, 'melee', 'irimi');
    for (const x of [2, 3, 4]) expect(g.dashBreak(x, 0, 0)).toBe(false);
    expect(damageBlock).toHaveBeenCalledTimes(1);
  });
});

describe('the dash hurts what it touches', () => {
  const enemy = (id: number, x: number, faction = 'projection') => ({
    id, alive: true, spawning: 0, faction, body: { x, y: 0, z: 0.5, hw: 0.4, h: 1.6 },
  });

  function strikeRig(list: unknown[]) {
    const player = new Player();
    player.body = { x: 5, y: 0, z: 0.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
    const damageActor = vi.fn(() => true);
    const g: Rig = Object.assign(Object.create(Game.prototype), {
      player, enemies: { list }, damageActor, particles: { burst: vi.fn() },
    });
    return { g, player, damageActor };
  }

  it('a projection on the path takes the dash damage once per dash; a far one and an ally do not', () => {
    const passed = enemy(1, 3), far = enemy(2, 12), ally = enemy(3, 4.5, 'self');
    const { g, player, damageActor } = strikeRig([passed, far, ally]);
    g.dashStrike({ x: 1, y: 0, z: 0.5 });
    expect(damageActor).toHaveBeenCalledTimes(1);
    expect(damageActor).toHaveBeenCalledWith(passed, DASH_DAMAGE, 'melee', 'irimi', player.id, expect.any(Number), expect.any(Number));
    g.dashStrike({ x: 1, y: 0, z: 0.5 });
    expect(damageActor).toHaveBeenCalledTimes(1);
    player.startDash('forward', 1, dry);
    g.dashStrike({ x: 1, y: 0, z: 0.5 });
    expect(damageActor).toHaveBeenCalledTimes(2);
  });

  it('touching is read along the whole path of the frame, not only where the body ends', () => {
    const body = { x: 5, y: 0, z: 0.5, hw: 0.3, h: 1.8 };
    expect(dashTouches({ x: 1, y: 0, z: 0.5 }, body, { x: 3, y: 0, z: 0.5, hw: 0.4, h: 1.6 })).toBe(true);
    expect(dashTouches({ x: 1, y: 0, z: 0.5 }, body, { x: 3, y: 0, z: 3, hw: 0.4, h: 1.6 })).toBe(false);
    expect(dashTouches({ x: 1, y: 0, z: 0.5 }, body, { x: 3, y: 4, z: 0.5, hw: 0.4, h: 1.6 })).toBe(false);
  });
});

describe('the dash frames make the player untouchable', () => {
  function hurtRig() {
    const player = new Player();
    player.body = { x: 5, y: 0, z: 0.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
    const bus = createBus();
    const emit = vi.spyOn(bus, 'emit');
    const g: Rig = Object.assign(Object.create(Game.prototype), {
      player, bus, contacts: { ready: () => true }, time: 0, blasts: { current: null },
    });
    return { g, player, emit };
  }

  it('no hit and no contact lands while the dash runs; a hit reaches the damage pipeline once it ends', () => {
    const { g, player, emit } = hurtRig();
    expect(player.startDash('forward', 1, dry)).toBe(true);
    expect(player.invulnT).toBeGreaterThanOrEqual(DASH_TIME - 1e-9);
    expect(g.damageActor(player, 8, 'contact', 'test', 99)).toBe(false);
    const attacker = { id: 99, def: 'test', alive: true, spawning: 0, contactDamage: 8 };
    g.contact(attacker, player);
    expect(emit).not.toHaveBeenCalled();

    player.invulnT = 0;
    g.bus.on('actorDamage', { priority: 150, source: 'test', fn: (e: { cancel(): void }) => e.cancel() });
    expect(g.damageActor(player, 8, 'contact', 'test', 99)).toBe(false);
    expect(emit).toHaveBeenCalledWith('actorDamage', expect.objectContaining({ target: player.id, amount: 8 }));
  });
});

