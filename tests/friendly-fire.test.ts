// Issue #372: the Shadow summons the friends you made in this run, and friendly fire reaches every ally
// (docs/design/built/bosses/SHADOW.md "Its summons", docs/design/built/encounters/POLARITY.md "Friendly fire").
// The summons are driven through the Shadow's own behaviour on a stand-in context and through Game's own omen and
// spawn path; friendly fire through Game's one damage pipeline (`damageActor` → `hurtEnemy`) over the real Enemies.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Rng, RunRandom } from '../src/core/rng';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { birthHp, type Enemy, type EnemyCtx, type EnemyDef } from '../src/enemies/types';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { BOSS_BY_ID } from '../src/content/bosses';
import { shadowLife } from '../src/content/bosses/mirror';
import { shadowState } from '../src/content/bosses/shadow';
import { SUMMON_CAP, SUMMON_EVERY, SUMMON_FIRST, SUMMON_SPREAD, summonAt, summonGap, summonPool } from '../src/content/bosses/summons';
import { AllyTally } from '../src/game/ally-tally';
import { SUMMON_NEAR, nearCell, PLAYER_CLEARANCE } from '../src/game/omens';
import { createBus } from '../src/game/events';
import { barStart, relapseHp, resolveHit, type Polarity } from '../src/combat/polarity';
import type { Actor } from '../src/entities/actors';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, setWorldTimeScale: () => {}, spatial: silent, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 60_000);

const SHADOW = BOSS_BY_ID.get('shadow')!;
const doubt = () => ENEMY_BY_ID.get('doubt')!;
const DT = 1 / 60;

// ── The summons: the Shadow's behaviour on a stand-in ──

interface Summoned { t: number; id: string }

/** The Shadow facing a still player six blocks away, with `allies` as the run's friends. `alive` says how many of its
 *  summons are alive now (default: every one it called). */
function fight(allies: readonly string[] | undefined, alive?: (called: Summoned[]) => number) {
  const e = {
    id: 7, hp: shadowLife(48), maxHp: shadowLife(48), stage: 0, hold: 0, state: 'move', timer: 0, seq: 0, armed: true, hidden: false,
    wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: SHADOW.speed, clock: 0, aimX: 0, aimZ: 0, volley: 0,
    body: { x: -6, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: SHADOW.size[0], h: SHADOW.size[1], onGround: true },
    tags: new Set<string>(), room: 0, faction: 'projection', spec: SHADOW, def: SHADOW.id,
  } as unknown as Enemy;
  let t = 0;
  const called: Summoned[] = [];
  const you = () => ({ id: 1, x: 6, y: 0, z: 0, vx: 1, vz: 0 });
  const ctx = {
    dt: DT, target: you, near: you, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {},
    dist: (_e: Enemy, p: { x: number; z: number }) => Math.hypot(p.x - e.body.x, p.z - e.body.z),
    toward: (_e: Enemy, p: { x: number; z: number }) => { const dx = p.x - e.body.x, dz = p.z - e.body.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; },
    bounds: () => [-10, -10, 9, 9], centre: () => [0, 0],
    bolt: () => {}, strike: () => {}, rain: () => {}, shootAt: () => {}, rockfall: () => {}, summon: () => {}, quake: () => {}, cue: () => {},
    crash: () => {}, fx: () => {}, arena: () => {}, burst: () => {}, quiet: () => false, others: () => [], safe: () => true, hide: () => {}, kill: () => {},
    ...(allies ? {
      allies: () => allies,
      summonNear: (_e: Enemy, id: string) => { called.push({ t, id }); return true; },
      summoned: () => (alive ? alive(called) : called.length),
    } : {}),
  } as unknown as EnemyCtx;
  return {
    e, called,
    run(seconds: number) {
      for (let k = 0; k < Math.round(seconds / DT); k++) {
        SHADOW.behaviour.update(e, ctx);
        e.body.x = -6; e.body.z = 0; // held in place: only its choices are under test
        t += DT;
      }
    },
  };
}

describe('the Shadow summons the friends you made in this run', () => {
  it('the pool is the tally\'s projections and mended allies, one entry per friend; deities, creatures and bosses never come', () => {
    const tally = new AllyTally();
    tally.record('projection', 'doubt');
    tally.record('projection', 'doubt');
    tally.record('projection', 'panic');
    tally.record('mended', 'critic');
    tally.record('creature', 'wonder');
    tally.record('boss', 'shadow');
    tally.syncDeities(['panda']);
    expect(summonPool(tally, ENEMY_BY_ID)).toEqual(['doubt', 'doubt', 'panic', 'critic']);
    expect(summonPool(new AllyTally(), ENEMY_BY_ID)).toEqual([]);
  });

  it('a summon appears for each kind the tally holds, and only for those', () => {
    const pool = ['doubt', 'panic', 'critic'];
    const f = fight(pool, () => 0); // every summon is gone at once: the cap never holds it back
    f.run(60);
    expect(new Set(f.called.map(c => c.id))).toEqual(new Set(pool));
    expect(f.called.every(c => pool.includes(c.id))).toBe(true);
    // in turn: every friend before any comes again
    expect(f.called.slice(0, 3).map(c => c.id)).toEqual(pool);
    expect(shadowState(f.e)!.summons).toEqual(f.called.map(c => c.id));
  });

  it('the cadence is seeded and bounded: the first at 4 s, then one every 7 to 10 s', () => {
    const f = fight(['doubt'], () => 0);
    f.run(60);
    expect(f.called[0].t).toBeCloseTo(SUMMON_FIRST, 1);
    for (let i = 1; i < f.called.length; i++) {
      const gap = f.called[i].t - f.called[i - 1].t;
      expect(gap).toBeGreaterThanOrEqual(SUMMON_EVERY - DT);
      expect(gap).toBeLessThanOrEqual(SUMMON_EVERY + SUMMON_SPREAD + DT);
    }
    for (let n = 0; n < 50; n++) expect(summonGap(7, n)).toBe(summonGap(7, n));
    const again = fight(['doubt'], () => 0);
    again.run(60);
    expect(again.called).toEqual(f.called);
  });

  it(`the cap holds: never more than ${SUMMON_CAP} of its summons alive at once`, () => {
    const f = fight(['doubt', 'panic']);
    f.run(120);
    expect(f.called.length).toBe(SUMMON_CAP);
  });

  it('with no friends in the run it summons nothing', () => {
    const none = fight([]);
    none.run(60);
    expect(none.called).toEqual([]);
    // a stand-in with no friend verbs at all (the older tests) is the same
    const bare = fight(undefined);
    bare.run(10);
    expect(shadowState(bare.e)!.summons).toEqual([]);
    expect(summonAt([], 3)).toBeNull();
  });

  it('a summon comes near the Shadow: 1.5 to 4 blocks from it, never on the player', () => {
    const cells = [];
    for (let x = -10; x < 10; x++) for (let z = -10; z < 10; z++) cells.push({ x: x + 0.5, z: z + 0.5 });
    for (let s = 0; s < 40; s++) {
      const c = nearCell(cells, [], { x: -6, z: 0 }, { x: -2, z: 0 }, new Rng(s))!;
      const d = Math.hypot(c.x + 6, c.z);
      expect(d).toBeGreaterThanOrEqual(SUMMON_NEAR[0]);
      expect(d).toBeLessThanOrEqual(SUMMON_NEAR[1]);
      expect(Math.hypot(c.x + 2, c.z)).toBeGreaterThanOrEqual(PLAYER_CLEARANCE);
    }
  });
});

// ── Game: the damage pipeline and the summon's spawn ──

function rig() {
  const bus = createBus();
  const events: { type: string; payload: Record<string, unknown> }[] = [];
  for (const type of ['factionChange', 'enemySpawn'] as const) bus.on(type, { priority: 0, source: 'test', fn: p => { events.push({ type, payload: { ...p } as Record<string, unknown> }); } });
  const g: any = Object.create(Game.prototype);
  const actors: Actor[] = [];
  const host = {
    solid: () => false, worldVersion: () => 1, actors: () => actors, actor: (id: number) => actors.find(a => a.id === id),
    room: () => ({ id: 1, x0: -10, y0: 0, z0: -10, w: 20, d: 20, hx: -10, hz: -10 }), elemVersion: () => 0, pickupsIn: () => [],
    hazard: () => null, contact: () => {}, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {},
    projectileHit: (t: Actor, dmg: number, thrower: number) => g.damageActor(t, dmg, 'projectile', 'judgement', thrower),
    projectileBlock: () => false, smash: () => false, burst: () => {},
    died: (e: Enemy) => g.onEnemyDeath(e), particles: () => {}, hurtActor: () => {}, affectActor: () => {}, arena: () => {},
    summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as unknown as EnemyHost;
  const enemies = new Enemies(new THREE.Scene(), host);
  const room = { id: 1, floor: 9, x0: -10, y0: 0, z0: -10, w: 20, d: 20, hx: -10, hz: -10 };
  Object.assign(g, {
    bus, enemies,
    router: { owns: () => false },
    player: { id: 0, kind: 'player', body: { x: 6, y: 0, z: 0, hw: 0.3, h: 1.8 }, invulnT: 0, starT: 0 },
    blasts: { current: null },
    particles: { burst() {}, gather() {} },
    hud: { toast() {} },
    rooms: new Map([[1, room]]),
    iceWalls: new Map(), projectionSeq: new Map(), projectionTier: new Map(), spawnSeq: new Map(), summoner: new Map(), omens: [],
    actors: { remove() {}, add(a: Actor) { actors.push(a); }, newId: () => 100 + actors.length },
    contacts: { forget() {} },
    rng: new RunRandom(1234),
    pickups: { add: () => ({}) },
    releases: { record() {} },
    runDifficulty: 1,
    world: { elemAt: () => 0 },
    doors: { list: [] },
    // a flat floor at y = 0
    solid: (_x: number, y: number) => y < 0,
    firstTime() {}, ejectRewards() {}, announce() {},
    bossDown() {},
  });
  const spawn = (def: EnemyDef, id: number, faction: Actor['faction'], hp = def.kind === 'boss' ? 84 : birthHp(def), x = 3) => {
    const e = enemies.spawn(def, id, 1, x, 0, 0, hp, def.speed, def.contactDamage, new Set());
    e.spawning = 0;
    e.faction = faction;
    actors.push(e);
    return e;
  };
  /** An ally: a Doubt the player turned, at half its health as a fresh convert has. */
  const ally = (id = 20, x = 0) => { const a = spawn(doubt(), id, 'self', undefined, x); a.hp = a.maxHp; return a; };
  const shoot = (e: Enemy, polarity: Polarity, damage = 3.5) => g.intentTouch(e.id, damage, 0, 0, 'intent', 'intent', polarity, true);
  return { g, bus, enemies, events, actors, spawn, ally, shoot };
}

describe('friendly fire: every hostile hit reaches an ally', () => {
  it('a bolt of the Shadow flies, stops on the ally it meets, turns it hostile and harms it', () => {
    const { enemies, actors, spawn, ally, events } = rig();
    const shadow = spawn(SHADOW, 30, 'projection', 84, -4);
    const friend = ally(20, 0);
    (enemies as any).bolt(shadow, 1, 0, 0, 9, 4);
    for (let k = 0; k < 120 && friend.faction === 'self'; k++) (enemies as any).updateProjectiles(DT, actors);
    expect(friend.faction).toBe('projection');
    expect(friend.hp).toBeCloseTo(relapseHp(friend.maxHp) - 4);
    expect((enemies as any).projectiles.length).toBe(0); // it stopped on the ally
    expect(events.some(x => x.type === 'factionChange' && x.payload.to === 'projection')).toBe(true);
  });

  it('a stroke of the Shadow (a strike, as a projectile hit) does the same', () => {
    const { g, spawn, ally } = rig();
    const shadow = spawn(SHADOW, 30, 'projection', 84, -4);
    const friend = ally();
    g.damageActor(friend, 6, 'projectile', 'enemy:shadow', shadow.id);
    expect(friend.faction).toBe('projection');
    expect(friend.hp).toBeCloseTo(barStart(friend.maxHp) - 6);
  });

  it('a hostile projection\'s shot, a touch, a bomb (ours or the Shadow\'s) and lava each harm an ally', () => {
    const { g, spawn, ally } = rig();
    const shadow = spawn(SHADOW, 30, 'projection', 84, -4);
    const foe = spawn(doubt(), 31, 'projection');
    const cases: [string, () => void][] = [
      ['shot', () => g.damageActor(a, 1, 'projectile', 'judgement', foe.id)],
      ['contact', () => g.damageActor(a, 1, 'contact', 'doubt', foe.id)],
      ['our bomb', () => g.damageActor(a, 1, 'explosion', 'bomb', 0)],
      ['its bomb', () => g.damageActor(a, 1, 'explosion', 'enemy:shadow', shadow.id)],
      ['shadow touch', () => g.damageActor(a, 1, 'contact', 'shadow', shadow.id)],
      ['lava', () => g.damageActor(a, 1, 'fire', 'lava', 'world')],
    ];
    let a = ally();
    for (const [name, hit] of cases) {
      a = ally(40 + cases.findIndex(c => c[0] === name));
      const before = a.hp;
      hit();
      expect(a.hp, name).toBeCloseTo(before - 1);
      expect(a.faction, name).toBe('self'); // plain harm: it stays your friend until it would fall
    }
  });

  it('plain harm that would bring an ally to zero relapses it instead of releasing it', () => {
    const { g, spawn, ally } = rig();
    const foe = spawn(doubt(), 31, 'projection');
    const a = ally();
    g.damageActor(a, a.hp + 5, 'contact', 'doubt', foe.id);
    expect(a.alive).toBe(true);
    expect(a.faction).toBe('projection');
    expect(a.hp).toBe(relapseHp(a.maxHp));
  });

  it('a negative intention of the player still harms an ally, and relapses it at zero', () => {
    const { shoot, ally } = rig();
    const a = ally();
    const before = a.hp;
    shoot(a, 'negative', 1);
    expect(a.hp).toBeCloseTo(before - 1);
    expect(a.faction).toBe('self');
    while (a.faction === 'self') shoot(a, 'negative', 1);
    expect(a.hp).toBe(barStart(a.maxHp));
  });

  it('a positive intention still heals a hurt ally', () => {
    const { shoot, ally } = rig();
    const a = ally();
    a.hp = a.maxHp / 2;
    shoot(a, 'positive', 2);
    expect(a.hp).toBeCloseTo(a.maxHp / 2 + 1);
    expect(a.faction).toBe('self');
  });

  it('a hostile being is untouched by the rule: the Shadow\'s bolt never hits its own side, and plain harm on a foe is unchanged', () => {
    const { g, enemies, actors, spawn } = rig();
    const shadow = spawn(SHADOW, 30, 'projection', 84, -4);
    const foe = spawn(doubt(), 31, 'projection', undefined, 0);
    (enemies as any).bolt(shadow, 1, 0, 0, 9, 4);
    for (let k = 0; k < 60; k++) (enemies as any).updateProjectiles(DT, actors);
    expect(foe.hp).toBe(foe.maxHp);
    g.damageActor(foe, 2, 'projectile', 'enemy:shadow', shadow.id);
    expect(foe.hp).toBe(foe.maxHp - 2);
    expect(foe.faction).toBe('projection');
  });

  it('the pure rule: a hostile negative intention relapses an ally and harms it; the bar rule for a hostile is unchanged', () => {
    expect(resolveHit({ polarity: 'negative', faction: 'self', hp: 6, hostile: true }, 2)).toEqual({ harm: 2, love: 0, relapse: true });
    expect(resolveHit({ polarity: 'negative', faction: 'projection', hp: 6, hostile: true }, 2)).toEqual({ harm: 2, love: 0, relapse: false });
    expect(resolveHit({ polarity: 'positive', faction: 'projection', hp: 6 }, 2)).toEqual({ harm: 0, love: 2, relapse: false });
  });
});

describe('the summon in the game: an omen near the Shadow, then a hostile being of its own tier roll', () => {
  it('announces near the Shadow, spawns through the one spawn path, and counts toward the cap until it is gone or turned', () => {
    const { g, spawn, events } = rig();
    const shadow = spawn(SHADOW, 30, 'projection', 84, -4);
    expect(g.summonNear(shadow, 'doubt')).toBe(true);
    expect(g.summonNear(shadow, 'shadow')).toBe(false); // a boss never comes
    expect(g.omens).toHaveLength(1);
    const o = g.omens[0];
    const d = Math.hypot(o.x - shadow.body.x, o.z - shadow.body.z);
    expect(d).toBeGreaterThanOrEqual(SUMMON_NEAR[0]);
    expect(d).toBeLessThanOrEqual(SUMMON_NEAR[1]);
    expect(g.summonedBy(shadow)).toBe(1);
    for (let k = 0; k < 120 && g.omens.length; k++) g.updateOmens(DT);
    expect(g.omens).toHaveLength(0);
    expect(events.filter(x => x.type === 'enemySpawn').map(x => x.payload.def)).toEqual(['doubt']);
    const child = g.enemies.list.find((x: Enemy) => x.def === 'doubt')!;
    expect(child.faction).toBe('projection');
    expect(g.summonedBy(shadow)).toBe(1);
    child.faction = 'self';
    expect(g.summonedBy(shadow)).toBe(0);
  });
});
