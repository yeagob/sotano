// The bar in play (owner, 2026-11-26; docs/design/built/encounters/POLARITY.md): converting and killing are one value.
// These tests drive Game's own intention pipeline on a stand-in: `intentTouch` → `damageActor` (the real event bus,
// so the `actorDamage` hooks run) → `hurtEnemy` → `convert` or the release in `onEnemyDeath`, over the real Enemies.
// The events the achievements count (`projectionConverted`, `projectionDestroyed`, `bossOvercome`) are recorded.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Rng } from '../src/core/rng';
import { Enemies, barFills, showsBar, type EnemyHost } from '../src/entities/enemies';
import { birthHp, type Enemy, type EnemyDef } from '../src/enemies/types';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { BOSS_BY_ID } from '../src/content/bosses';
import { createBus } from '../src/game/events';
import { barShare, barStart, barTop, type Polarity } from '../src/combat/polarity';
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

const DAMAGE = 3.5;
const FLOOR = 3;

/** The game's fields that the intention pipeline, a conversion and a release read; the rest absorbs calls. */
function rig() {
  const bus = createBus();
  const events: { type: string; payload: unknown }[] = [];
  for (const type of ['projectionConverted', 'projectionDestroyed', 'factionChange'] as const) {
    bus.on(type, { priority: 0, source: 'test', fn: p => { events.push({ type, payload: { ...p } }); } });
  }
  const g: any = Object.create(Game.prototype);
  const host = {
    solid: () => false, worldVersion: () => 1, actors: () => [] as Actor[], actor: () => undefined,
    room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 }), elemVersion: () => 0, pickupsIn: () => [],
    hazard: () => null, contact: () => {}, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {},
    rng: () => new Rng(1), projectileHit: () => {}, projectileBlock: () => false, smash: () => false, burst: () => {},
    died: (e: Enemy) => g.onEnemyDeath(e), particles: () => {}, hurtActor: () => {}, affectActor: () => {}, arena: () => {},
    summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as unknown as EnemyHost;
  const enemies = new Enemies(new THREE.Scene(), host);
  const downs: string[] = [];
  Object.assign(g, {
    bus, enemies,
    router: { owns: () => false },
    player: { id: 0, kind: 'player', body: { x: 0, y: 0, z: 0, hw: 0.3, h: 1.8 }, invulnT: 0, starT: 0 },
    blasts: { current: null },
    particles: { burst() {} },
    hud: { toast() {} },
    rooms: new Map([[1, { floor: FLOOR }]]),
    iceWalls: new Map(), projectionSeq: new Map(),
    actors: { remove() {} }, contacts: { forget() {} },
    rng: { stream: () => new Rng(7), fork: () => new Rng(7) },
    pickups: { add: () => ({}) },
    releases: { record() {} },
    firstTime() {}, ejectRewards() {}, announce() {},
    bossDown: (_floor: number, how: string) => { downs.push(how); },
  });
  const spawn = (def: EnemyDef, id: number, hp = def.kind === 'boss' ? 140 : birthHp(def)) => {
    const e = enemies.spawn(def, id, 1, 3, 0, 3, hp, def.speed, 0, new Set());
    e.spawning = 0;
    return e;
  };
  /** One intention of this polarity reaches `e`, through Game's own `intentTouch`. */
  const shoot = (e: Enemy, polarity: Polarity, damage = DAMAGE) => g.intentTouch(e.id, damage, 0, 0, 'intent', 'intent', polarity, true);
  return { g, bus, enemies, events, downs, spawn, shoot };
}

const doubt = () => ENEMY_BY_ID.get('doubt')!;

describe('the bar in the damage pipeline', () => {
  it('a fresh projection starts at 50 %: its health is its maximum, and the bar is half full', () => {
    const { spawn } = rig();
    const e = spawn(doubt(), 10);
    expect(e.hp).toBe(e.maxHp);
    expect(barShare(e.hp, e.maxHp)).toBe(0.5);
  });

  it('a positive hit raises the bar by the whole damage, a negative hit lowers it by the whole damage', () => {
    const { spawn, shoot } = rig();
    const e = spawn(doubt(), 10);
    const start = e.hp;
    shoot(e, 'positive');
    expect(e.hp).toBeCloseTo(start + DAMAGE);
    shoot(e, 'negative');
    shoot(e, 'negative');
    expect(e.hp).toBeCloseTo(start - DAMAGE);
    expect(e.faction).toBe('projection');
  });

  it('follows the shot type both ways, and nothing ends until an end is reached', () => {
    const { spawn, shoot, events } = rig();
    const e = spawn(doubt(), 10);
    const path: number[] = [];
    for (const p of ['positive', 'positive', 'positive', 'negative', 'negative', 'positive', 'negative'] as Polarity[]) {
      shoot(e, p);
      path.push(Math.round((e.hp - e.maxHp) / DAMAGE));
    }
    expect(path).toEqual([1, 2, 3, 2, 1, 2, 1]);
    expect(events.filter(x => x.type !== 'factionChange')).toEqual([]);
  });

  it('reaching 0 releases it: projectionDestroyed, as before', () => {
    const { spawn, shoot, events } = rig();
    const e = spawn(doubt(), 10);
    const hits = Math.ceil(e.maxHp / DAMAGE);
    for (let i = 0; i < hits - 1; i++) shoot(e, 'negative');
    expect(e.alive).toBe(true);
    shoot(e, 'negative');
    expect(e.alive).toBe(false);
    expect(events).toEqual([{ type: 'projectionDestroyed', payload: expect.objectContaining({ def: 'doubt', boss: false }) }]);
  });

  it('reaching 2 × maxHp converts it: projectionConverted, as before, with half its health as an ally', () => {
    const { spawn, shoot, events } = rig();
    const e = spawn(doubt(), 10);
    const hits = Math.ceil(e.maxHp / DAMAGE);
    for (let i = 0; i < hits - 1; i++) shoot(e, 'positive');
    expect(e.faction).toBe('projection');
    expect(e.hp).toBeLessThan(barTop(e.maxHp));
    shoot(e, 'positive');
    expect(e.alive).toBe(true);
    expect(e.faction).toBe('self');
    expect(e.hp).toBe(e.maxHp / 2);
    expect(events.map(x => x.type)).toEqual(['factionChange', 'projectionConverted']);
    expect(events[1].payload).toEqual(expect.objectContaining({ def: 'doubt', boss: false }));
  });

  it('killing and converting a fresh projection take the same number of hits', () => {
    for (const id of ['noise', 'doubt', 'gloom', 'backlog']) {
      const kill = rig(), turn = rig();
      const a = kill.spawn(ENEMY_BY_ID.get(id)!, 10), b = turn.spawn(ENEMY_BY_ID.get(id)!, 10);
      let toKill = 0, toTurn = 0;
      while (a.alive) { kill.shoot(a, 'negative'); toKill++; }
      while (b.faction === 'projection') { turn.shoot(b, 'positive'); toTurn++; }
      expect(toTurn).toBe(toKill);
    }
  });

  it('two beings of different life at the same share answer the same: the bar does not care how much life it has', () => {
    const { spawn, shoot } = rig();
    const small = spawn(doubt(), 10, 20), big = spawn(doubt(), 11, 200);
    // the same hits, each a tenth of its own life
    for (const p of ['positive', 'negative', 'negative', 'positive', 'positive', 'positive'] as Polarity[]) {
      shoot(small, p, 2);
      shoot(big, p, 20);
      expect(barShare(small.hp, small.maxHp)).toBeCloseTo(barShare(big.hp, big.maxHp));
    }
    // they stand at 12 tenths of their life; eight more tenths of love reach the top, and both turn on the same hit
    let n = 0;
    while (small.faction === 'projection') { shoot(small, 'positive', 2); shoot(big, 'positive', 20); n++; expect(big.faction).toBe(small.faction); }
    expect(n).toBe(8);
  });

  it('the actorDamage hooks still decide the amount: a hook that doubles love doubles the bar\'s move', () => {
    const { spawn, shoot, bus } = rig();
    bus.on('actorDamage', { priority: 100, source: 'item', fn: ev => { if (ev.polarity === 'positive') ev.amount *= 2; } });
    const e = spawn(doubt(), 10);
    shoot(e, 'positive');
    expect(e.hp).toBeCloseTo(e.maxHp + 2 * DAMAGE);
    shoot(e, 'negative');
    expect(e.hp).toBeCloseTo(e.maxHp + DAMAGE);
  });

  it('plain harm with no intention (a bomb, a fall of fire) drains the same bar', () => {
    const { g, spawn } = rig();
    const e = spawn(doubt(), 10);
    g.damageActor(e, 6, 'explosion', 'bomb', 0);
    expect(e.hp).toBeCloseTo(e.maxHp - 6);
  });

  it('an ally brought to zero by harm relapses with its bar in the middle', () => {
    const { spawn, shoot } = rig();
    const e = spawn(doubt(), 10);
    while (e.faction === 'projection') shoot(e, 'positive');
    while (e.faction === 'self') shoot(e, 'negative');
    expect(e.alive).toBe(true);
    expect(e.faction).toBe('projection');
    expect(e.hp).toBe(barStart(e.maxHp));
  });
});

describe('a boss runs on the same bar', () => {
  it('converts at twice its health (bossOvercome converted) after as many good hits as bad ones would release it', () => {
    const boss = [...BOSS_BY_ID.values()].find(b => b.id !== 'shadow')!;
    const turn = rig(), kill = rig();
    const a = turn.spawn(boss, 20, 140), b = kill.spawn(boss, 20, 140);
    expect(barShare(a.hp, a.maxHp)).toBe(0.5);
    let toTurn = 0, toKill = 0;
    while (a.faction === 'projection') { turn.shoot(a, 'positive', 10); toTurn++; }
    while (b.alive) { kill.shoot(b, 'negative', 10); toKill++; }
    expect(toTurn).toBe(14);
    expect(toKill).toBe(14);
    expect(turn.downs).toEqual(['converted']);
    expect(turn.events.map(x => x.type)).toContain('projectionConverted');
    expect(turn.events.find(x => x.type === 'projectionConverted')!.payload).toEqual(expect.objectContaining({ boss: true }));
    expect(kill.downs).toEqual(['destroyed']);
    expect(kill.events.find(x => x.type === 'projectionDestroyed')!.payload).toEqual(expect.objectContaining({ boss: true }));
  });

  it('the Shadow converts through the same bar', () => {
    const { spawn, shoot, downs } = rig();
    const e = spawn(BOSS_BY_ID.get('shadow')!, 30, 48);
    let n = 0;
    while (e.faction === 'projection') { shoot(e, 'positive', 4); n++; }
    expect(n).toBe(12);
    expect(downs).toEqual(['converted']);
  });
});

describe('the bar over a projection', () => {
  it('shows over a hostile projection only: never on a boss (it has the HUD bar), an ally, a creature or one still forming', () => {
    const { spawn, shoot } = rig();
    const e = spawn(doubt(), 10);
    expect(showsBar(e)).toBe(true);
    expect(showsBar({ ...e, spawning: 0.2 })).toBe(false);
    expect(showsBar({ ...e, hidden: true })).toBe(false);
    expect(showsBar(spawn([...BOSS_BY_ID.values()][0], 20, 140))).toBe(false);
    while (e.faction === 'projection') shoot(e, 'positive');
    expect(showsBar(e)).toBe(false);
  });

  it('draws the cold fill up to the middle and the captive fill past it', () => {
    const W = 12 / 16;
    expect(barFills(24, 24)).toEqual({ harm: W / 2, love: 0 });
    expect(barFills(12, 24)).toEqual({ harm: W / 4, love: 0 });
    expect(barFills(36, 24).harm).toBe(W / 2);
    expect(barFills(36, 24).love).toBeCloseTo(W / 4);
    expect(barFills(0, 24)).toEqual({ harm: 0, love: 0 });
  });
});
