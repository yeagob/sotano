// Walk Slowly (Camina Despacio, issue #340): crouched on the ground the world runs at half speed
// (docs/design/built/practices/body/WALK-SLOWLY.md, src/game/time-scale.ts).

import { beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { WALK_SLOW_SCALE, worldFrame, worldTimeScale, type TimeState } from '../src/game/time-scale';
import { Kairos, KAIROS_STOP_SECONDS } from '../src/game/kairos';
import { Player, type PlayerHooks } from '../src/entities/player';
import { BASE_STATS, computeStats, type Stats } from '../src/core/stats';
import { DebrisSystem } from '../src/physics/debris';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import distraction from '../src/content/enemies/distraction';
import type { Actor } from '../src/entities/actors';
import { birthHp, type Enemy } from '../src/enemies/types';
import { fx, seedFx } from '../src/core/fx';
import { Rng, RunRandom } from '../src/core/rng';
import type { Input } from '../src/input/input';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import { ItemPools, isHandedOut, isUnlockGift } from '../src/items/pool';
import { validateItem } from '../src/items/validate';
import { LOCALES } from '../src/i18n/locales';
import { EN } from '../src/i18n/locales/en';

const DT = 1 / 60;
const ground = (s: Partial<TimeState> = {}): TimeState => ({ kairosStopped: false, walkSlow: 1, onGround: true, crouching: true, ...s });

describe('the time scale', () => {
  it('is 0.5 only while the practice is held, the feet are on the ground and the body is crouched', () => {
    for (const walkSlow of [0, 1]) for (const onGround of [false, true]) for (const crouching of [false, true]) {
      const want = walkSlow && onGround && crouching ? WALK_SLOW_SCALE : 1;
      expect(worldTimeScale({ walkSlow, onGround, crouching }), JSON.stringify({ walkSlow, onGround, crouching })).toBe(want);
    }
    expect(WALK_SLOW_SCALE).toBe(0.5);
  });

  it('halves the step the world runs', () => {
    expect(worldFrame(DT, ground())).toEqual({ kind: 'running', dt: DT * 0.5, scale: 0.5 });
    expect(worldFrame(DT, ground({ onGround: false }))).toEqual({ kind: 'running', dt: DT, scale: 1 });
  });

  it('leaves Kairos alone: a stopped frame gets the real step, crouched or not, and the stop lasts its full seconds', () => {
    for (const s of [ground(), ground({ walkSlow: 0 }), ground({ crouching: false })]) {
      expect(worldFrame(DT, { ...s, kairosStopped: true })).toEqual({ kind: 'stopped', dt: DT });
    }
    const count = (step: (k: Kairos) => number) => {
      const k = new Kairos();
      k.start();
      let frames = 0;
      while (!k.tick(step(k))) frames++;
      return frames + 1;
    };
    const crouched = count(k => worldFrame(DT, { ...ground(), kairosStopped: k.stopped }).dt);
    expect(crouched).toBe(count(() => DT));
    expect(crouched * DT).toBeCloseTo(KAIROS_STOP_SECONDS, 1);
  });
});

/** A crouching body on open ground (every cell at y <= 0 is solid), walking forward. */
function rig(stats: Partial<Stats>) {
  const p = new Player();
  p.spawnAt(0.5, 1, 0.5);
  p.body.onGround = true;
  const pressed = new Set<string>(), held = new Set<string>(['crouch']);
  const move = { x: 0, y: 1 };
  const input = {
    hit: (a: string) => pressed.has(a), held: (a: string) => held.has(a), move, lookDX: 0, lookDY: 0, sensitivity: 1,
  } as unknown as Input;
  const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v };
  const s = { ...BASE_STATS, ...stats };
  const solid = (_x: number, y: number) => y <= 0;
  /** One frame as Game.simulate runs it: the scale is read from the body before the body moves. */
  const frame = (dt = DT) => {
    const f = worldFrame(dt, { kairosStopped: false, walkSlow: s.walkSlow, onGround: p.body.onGround, crouching: p.crouching });
    if (f.kind === 'running') p.update(f.dt, input, s, solid, hooks);
    pressed.clear();
    return { dt: f.dt, scale: f.kind === 'running' ? f.scale : 0 };
  };
  const raw = (dt: number) => { p.update(dt, input, s, solid, hooks); pressed.clear(); };
  return { p, pressed, held, frame, raw };
}

describe("the player's own body under the scale", () => {
  it('a crouched walk with the practice moves exactly as a walk stepped at half the step', () => {
    const slow = rig({ crouch: 1, walkSlow: 1 }), half = rig({ crouch: 1, walkSlow: 1 }), full = rig({ crouch: 1, walkSlow: 0 });
    slow.raw(DT); half.raw(DT); full.raw(DT);        // the first frame crouches the body
    for (let i = 0; i < 90; i++) { expect(slow.frame().scale).toBe(0.5); half.raw(DT / 2); if (i % 2) full.frame(); }
    expect(slow.p.body).toEqual(half.p.body);
    // 90 slowed frames are 0.75 s of the world: as far as 45 frames at full speed, half as far as 90 would go
    expect(slow.p.body.z).toBeLessThan(0.5 - 1);
    expect(slow.p.body.z).toBeCloseTo(full.p.body.z, 1);
  });

  it('the slow ends when the body leaves the ground: a jump runs the next frame at full speed', () => {
    const r = rig({ crouch: 1, walkSlow: 1 });
    r.raw(DT);
    expect(r.frame().scale).toBe(0.5);
    r.pressed.add('jump');
    r.frame();
    expect(r.p.body.onGround).toBe(false);
    expect(r.frame().scale).toBe(1);
  });

  it('standing up ends it, and without the practice the crouch does nothing to time', () => {
    const r = rig({ crouch: 1, walkSlow: 1 });
    r.raw(DT);
    r.held.delete('crouch');
    r.raw(DT);
    expect(r.p.crouching).toBe(false);
    expect(r.frame().scale).toBe(1);
    const plain = rig({ crouch: 1, walkSlow: 0 });
    plain.raw(DT);
    expect(plain.p.crouching).toBe(true);
    expect(plain.frame().scale).toBe(1);
  });
});

describe('the blocks and the projections under the scale', () => {
  beforeEach(() => seedFx(7));
  const slow = worldFrame(DT, ground()).dt;

  it('a loose cube advances exactly as it would by half the step', () => {
    const cube = () => { const d = new DebrisSystem(4, (_x, y) => y < 0, () => {}); const i = d.spawn(1, 0.5, 4, 0.5); d.launch(i, 3, 2, 0); return { d, i }; };
    seedFx(7); const a = cube();
    seedFx(7); const b = cube();
    seedFx(7); const c = cube();
    for (let k = 0; k < 30; k++) { a.d.update(slow); b.d.update(DT / 2); c.d.update(DT); }
    expect(Array.from(a.d.pos)).toEqual(Array.from(b.d.pos));
    expect(a.d.pos[a.i * 3 + 1]).toBeGreaterThan(c.d.pos[c.i * 3 + 1]);   // fell less far than at full speed
  });

  /** A closed room with one projection flying at a standing player; the fx stream is seeded per world. */
  const world = () => {
    seedFx(7);
    const actors: Actor[] = [];
    const host = {
      solid: (x: number, y: number, z: number) => y < 0 || y >= 8 || x < 0 || x >= 13 || z < 0 || z >= 7,
      worldVersion: () => 1, actors: () => actors, actor: (id: number) => actors.find(a => a.id === id),
      room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 }), elemVersion: () => 0,
      pickupsIn: () => [], hazard: () => null, contact: () => {}, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {}, rng: () => new Rng(1), projectileHit: () => {}, projectileBlock: () => false,
      smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
      affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
    } as EnemyHost;
    const en = new Enemies(new THREE.Scene(), host);
    actors.push({
      id: 1, kind: 'player', def: 'player', faction: 'self', hp: 24, tags: new Set<string>(), room: 0, alive: true, spawning: 0,
      body: { x: 10.5, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true },
    } as Actor);
    const e: Enemy = en.spawn(distraction, 2, 0, 2.5, 1, 2.5, birthHp(distraction), distraction.speed, distraction.contactDamage, new Set());
    e.spawning = 0;
    actors.push(e);
    return { en, e };
  };
  const flight = (step: number, frames: number) => {
    const w = world();
    for (let k = 0; k < frames; k++) w.en.update(step);
    return { x: w.e.body.x, y: w.e.body.y, z: w.e.body.z, vx: w.e.body.vx, vy: w.e.body.vy, vz: w.e.body.vz };
  };

  it('a projection advances exactly as it would by half the step', () => {
    const scaled = flight(slow, 40), half = flight(DT / 2, 40), full = flight(DT, 40);
    expect(scaled).toEqual(half);
    expect(Math.hypot(scaled.x - 2.5, scaled.z - 2.5)).toBeLessThan(Math.hypot(full.x - 2.5, full.z - 2.5));
  });
});

describe('determinism without the practice', () => {
  /** A fixed sequence of uneven frames, as a real browser gives them. */
  const FRAMES = Array.from({ length: 240 }, (_, i) => [1 / 60, 1 / 144, 1 / 30, 0.05, 1 / 90][i % 5]);

  it('every frame is the very same step, crouched on the ground or not', () => {
    for (const s of [ground({ walkSlow: 0 }), ground({ walkSlow: 0, onGround: false }), ground({ crouching: false })]) {
      for (const dt of FRAMES) {
        const f = worldFrame(dt, s);
        expect(f.kind).toBe('running');
        expect(Object.is(f.dt, dt)).toBe(true);
      }
    }
  });

  it('the body and the cubes end bit for bit where the raw steps leave them', () => {
    const a = rig({ crouch: 1, walkSlow: 0 }), b = rig({ crouch: 1, walkSlow: 0 });
    seedFx(3); const da = new DebrisSystem(8, (_x, y) => y < 0, () => {}); da.launch(da.spawn(1, 0.5, 3, 0.5), 2, 1, 1);
    seedFx(3); const db = new DebrisSystem(8, (_x, y) => y < 0, () => {}); db.launch(db.spawn(1, 0.5, 3, 0.5), 2, 1, 1);
    for (const dt of FRAMES) {
      const f = a.frame(dt);
      expect(f.scale).toBe(1);
      b.raw(dt);
      seedFx(11); da.update(worldFrame(dt, ground({ walkSlow: 0 })).dt);
      seedFx(11); db.update(dt);
    }
    expect(a.p.body).toEqual(b.p.body);
    expect(Array.from(da.pos)).toEqual(Array.from(db.pos));
    expect(Array.from(da.vel)).toEqual(Array.from(db.vel));
  });

  it('the scale draws from no random stream', () => {
    seedFx(5);
    const before = [fx.random(), fx.random()];
    seedFx(5);
    for (const dt of FRAMES) { worldFrame(dt, ground()); worldFrame(dt, ground({ walkSlow: 0 })); }
    expect([fx.random(), fx.random()]).toEqual(before);
    const r1 = new RunRandom(9).fork('loot'), r2 = new RunRandom(9).fork('loot');
    for (const dt of FRAMES) worldFrame(dt, ground());
    expect([r1.next(), r1.next()]).toEqual([r2.next(), r2.next()]);
  });
});

describe('the practice Walk Slowly', () => {
  const def = ITEM_BY_ID.get('walk-slow')!;

  it('is a valid quality 4 body practice that gives the slow and the crouch', () => {
    expect(def).toBeDefined();
    expect(validateItem(def)).toEqual([]);
    expect(def.quality).toBe(4);
    expect(def.tags).toEqual(['body', 'movement']);
    const s = computeStats(def.stats!.map(m => ({ ...m, source: def.id })));
    expect(s.walkSlow).toBe(1);
    expect(s.crouch).toBe(1);
  });

  it('is never drawn: its only pool is the unlock, and no pool or reservation hands it out', () => {
    expect(Object.keys(def.pools)).toEqual(['unlock']);
    expect(isUnlockGift(def)).toBe(true);
    expect(isHandedOut(def)).toBe(true);
    expect(ITEMS.filter(isUnlockGift).map(i => i.id)).toEqual(['walk-slow']);
    const pools = new ItemPools(ITEMS);
    const rng = new RunRandom(1).fork('probe');
    for (let i = 0; i < 200; i++) for (const p of ['treasure', 'boss', 'vault', 'unlock'] as const) expect(pools.drawRuntime(p, rng)).not.toBe('walk-slow');
  });

  it('has its texts in English and Spanish, with the quote and its credit', () => {
    expect(def.name).toBe('Walk Slowly');
    expect(def.effect).toContain('50%');
    expect(def.inspiredBy).toContain('Santiago Dopazo');
    expect(EN.messages['teach.walk-slow.quote']).toBe('The most revolutionary act you can carry out is to walk slowly.');
    const es = LOCALES.find(c => c.code === 'es')!;
    const tr = es.content.items['walk-slow'];
    expect(tr?.name).toBe('Camina despacio');
    expect(tr?.effect).toContain('50%');
    expect(tr?.inspiredBy).toContain('«El acto más revolucionario que puedes llevar a cabo es caminar despacio»');
    expect(tr?.inspiredBy).toContain('Santiago Dopazo');
    expect(es.messages['teach.walk-slow.quote']).toBe('El acto más revolucionario que puedes llevar a cabo es caminar despacio.');
    for (const c of LOCALES) for (const k of ['teach.walk-slow.quote', 'teach.walk-slow.lesson', 'stat.walkSlow'] as const) expect(c.messages[k], `${c.code} ${k}`).toBeTruthy();
  });
});
