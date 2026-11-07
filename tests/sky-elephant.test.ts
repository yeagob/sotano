// The elephant, guardian of sky floor 3, headless on its real floor (docs/design/not-built/sky/guardians/ELEPHANT.md
// B2–B5, B3b; docs/architecture/SKY.md §5.3–§5.5). The telegraph comes first and its marks from its first frame;
// Memory aims where the player stood longest; the drains land after the longer telegraph and only through the
// spirit gate; the rest between attacks; the rim guard; the capture and its answer; defeat by 36 positive hits; the
// herd wades out, shoulders, turns and carries; the plush tokens keep clear of the reserved colours. Everything runs
// at a fixed dt and repeats exactly.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PALETTE, type PalToken } from '../src/content/palette';
import { SKY_ELEPHANT_PALETTE } from '../src/content/palette/sky-elephant';
import { MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { Deity } from '../src/sky/creatures/deity';
import {
  CAPTURE_EXTRA, DRAIN_EXTRA, DUST_SPIRIT, ELEPHANT_ATTACKS, HITS, LIFT_TOAST, RUMBLE_SPIRIT, WON_TOAST, elephantDeity,
  mindOf, remembered,
} from '../src/sky/creatures/deities/elephant';
import { TowerKnock } from '../src/sky/creatures/knock';
import { Minion, ALLY } from '../src/sky/creatures/minion';
import { elephantMinion } from '../src/sky/creatures/minions/elephant';
import { Puff } from '../src/sky/creatures/puff';
import { elephant } from '../src/sky/floors/elephant';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { SpiritLaw } from '../src/sky/laws/spirit';
import {
  CAPTURE_TIME, SPIRIT_MAX, type AttackDef, type CreatureDeps, type DeityCtx, type DeityDef, type SkyActor, type SkyHost,
} from '../src/sky/types';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import type { Body } from '../src/physics/voxel-collide';

const DT = 1 / 30;
const O = { x: 128, y: 110, z: 128 };
const PLAN = elephant.generate(new Rng(1), O);
const CX = PLAN.seat.x + 0.5, CZ = PLAN.seat.z + 0.5, BASE = PLAN.y0;
/** A point at radius r and angle a (degrees) round the axis, on the surface h. */
const ringPoint = (r: number, deg: number, h: number) => {
  const t = (deg * Math.PI) / 180;
  return { x: Math.floor(CX + Math.cos(t) * r) + 0.5, y: BASE + h, z: Math.floor(CZ + Math.sin(t) * r) + 0.5 };
};

function rig(def: DeityDef = elephantDeity) {
  // the hall's slab under the floor (the sky tree's), so nothing falls out of the waterhole
  const slab = { k: 'box' as const, x0: O.x - 30, y0: O.y - 3, z0: O.z - 30, x1: O.x + 30, y1: O.y - 1, z1: O.z + 30, m: MAT.heartwood };
  const world = new SkyWorld(buildIndex([slab, ...PLAN.shapes]));
  let now = 0;
  let spirit = SPIRIT_MAX, heldUntil = -Infinity;
  const body: Body = { x: CX + 21, y: BASE + 2, z: CZ + 0.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = { pushes: [] as number[][], holds: [] as number[], carries: [] as number[][], drains: [] as [number, number][], toasts: [] as string[], taken: 0, slows: 0 };
  const player = {
    body, get eye() { return { x: body.x, y: body.y + 1.6, z: body.z }; }, aim: { x: 0, y: 0, z: 1 }, hand: [],
    get held() { return heldUntil > now; },
    push: (vx: number, vy: number, vz: number) => { log.pushes.push([vx, vy, vz]); },
    slow: () => { log.slows++; },
    hold: (s: number) => { log.holds.push(s); heldUntil = now + s; },
    carry: (to: { x: number; y: number; z: number }) => { log.carries.push([to.x, to.y, to.z]); },
  };
  const target = { id: 999, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [target], hurt: (() => {}) as unknown as HazardHost['hurt'], affect: (() => {}) as unknown as HazardHost['affect'],
    push: (() => {}) as unknown as HazardHost['push'], live: () => {}, particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const host = {
    time: () => now, player: () => player, actors: () => actors, world: () => world,
    debris: () => ({ spawn: () => 0 }), hazards: () => hazards, fork: (...p: (string | number)[]) => new Rng(p.length + 3),
    fx: () => {}, cue: () => {}, toast: (k: string) => { log.toasts.push(k); }, card: () => {}, bar: () => {}, place: () => {},
    gift: () => {}, travel: () => {}, enterUnity: () => {},
    drainSpirit: (n: number) => { spirit -= n; log.drains.push([now, n]); }, spirit: () => spirit, refillSpirit: () => { spirit = SPIRIT_MAX; },
    takeRandomPractice: () => { log.taken++; return 'x'; }, sendUnderground: () => true,
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  const spiritLaw = new SpiritLaw(host);
  const deps: CreatureDeps = { actors, runner, effects, puff: new Puff(host), knock: new TowerKnock(host, effects), spirit: spiritLaw };
  const actor: SkyActor = {
    id: actors.newId(), kind: 'sky', def: 'elephant', role: 'deity', animal: 'elephant', faction: 'neutral', hp: 1,
    body: { x: CX, y: PLAN.seat.y + 1, z: CZ, vx: 0, vy: 0, vz: 0, hw: def.model.hw, h: def.model.h, onGround: false },
    tags: new Set(), room: -1, alive: true, spawning: 0, side: 'wild', state: 'Idle', t: 0, hits: 0, parked: false,
  };
  actors.register(actor as unknown as Actor, 'sky');
  const deity = new Deity(actor, def, PLAN, deps, host, new Rng(5));
  const states: [number, string][] = [];
  const frame = () => {
    spiritLaw.update();
    deity.update(DT);
    runner.update(DT);
    hazards.update(DT);
    effects.update(DT);
    now += DT;
    world.expire(now);
    if (states[states.length - 1]?.[1] !== actor.state) states.push([now, actor.state]);
  };
  const run = (s: number) => { for (let t = 0; t < s - 1e-9; t += DT) frame(); };
  const stand = (p: { x: number; y: number; z: number }) => { body.x = p.x; body.y = p.y; body.z = p.z; body.vx = body.vz = 0; body.onGround = true; };
  return { world, body, host, deity, actor, deps, runner, hazards, effects, log, states, frame, run, stand, now: () => now };
}

/** The elephant with one attack only, from the first stage (so the test chooses it). */
function only(id: string, extra: Partial<AttackDef> = {}): DeityDef {
  const a = ELEPHANT_ATTACKS.find(x => x.id === id)!;
  return { ...elephantDeity, attacks: [{ ...a, stage: 0, ...extra }] };
}

/** Runs until the deity enters Attacking; returns the host time it did. */
function untilAttack(r: ReturnType<typeof rig>, max = 20): number {
  for (let t = 0; t < max; t += DT) {
    r.frame();
    if (r.actor.state === 'Attacking') return r.now();
  }
  throw new Error('no attack');
}

const SHORE = ringPoint(5.5, 30, 26);
const THIRD = ringPoint(8.5, 30, 20);

describe('the elephant deity (ELEPHANT.md B2–B4)', () => {
  it('rests its stage time before the first telegraph, and its telegraph is the floor’s 1.1 s', () => {
    const r = rig(only('mud-wallow'));
    r.stand(THIRD);
    const start = untilAttack(r);
    // Idle → Watching (the whole hall in sight) → 3 s of rest
    expect(start).toBeGreaterThanOrEqual(3 - 1e-6);
    expect(r.runner.active()).toHaveLength(0);
    r.run(1.1 - 2 * DT);
    expect(r.runner.active()).toHaveLength(0);
    r.run(3 * DT);
    expect(r.runner.active().map(a => a.id)).toEqual(['dense-ground']);
  });

  it('drinks (Recovering 2.5 s) after each attack, then rests again before the next', () => {
    const r = rig(only('mud-wallow'));
    r.stand(THIRD);
    r.run(20);
    const attacks = r.states.filter(([, s]) => s === 'Attacking').map(([t]) => t);
    expect(attacks.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < attacks.length; i++) expect(attacks[i] - attacks[i - 1]).toBeGreaterThanOrEqual(1.1 + 2.5 + 3 - 0.1);
  });

  it('remembers where the player stood longest in the last 10 s', () => {
    const r = rig(only('mud-wallow'));
    const a = ringPoint(21, 300, 2), b = ringPoint(21, 330, 2);
    r.stand(a); r.run(6);
    r.stand(b); r.run(2);
    const ctx = { host: r.host, deity: r.actor } as unknown as DeityCtx;
    expect(remembered(ctx, mindOf(r.actor))).toMatchObject({ x: a.x, z: a.z });
    r.run(9);
    expect(remembered(ctx, mindOf(r.actor))).toMatchObject({ x: b.x, z: b.z });
  });

  it('Dust bath: the circle is drawn from the telegraph’s first frame, and it drains 16 only after 1.3 s, where the player rested', () => {
    const r = rig(only('dust-bath'));
    r.stand(THIRD);
    const t0 = untilAttack(r);
    r.frame();
    expect(mindOf(r.actor).run?.kind).toBe('dust-bath');
    while (r.now() < t0 + 1.1 + DRAIN_EXTRA - 2 * DT) { r.frame(); expect(r.log.drains).toHaveLength(0); }
    r.run(4 * DT);
    expect(r.log.drains.map(([, n]) => n)).toEqual([DUST_SPIRIT]);
  });

  it('Dust bath misses a player who moved 3 blocks, and one under a block', () => {
    const moved = rig(only('dust-bath'));
    moved.stand(THIRD);
    untilAttack(moved);
    moved.stand({ ...THIRD, x: THIRD.x + 3 });
    moved.run(2);
    expect(moved.log.drains).toHaveLength(0);

    const roofed = rig(only('dust-bath'));
    roofed.stand(THIRD);
    roofed.world.set(Math.floor(THIRD.x), Math.floor(THIRD.y) + 3, Math.floor(THIRD.z), MAT.palestone);
    untilAttack(roofed);
    roofed.run(2);
    expect(roofed.log.drains).toHaveLength(0);
  });

  it('the spirit gate: drains are at least 6 s apart, and none lands while the player is held', () => {
    const r = rig(only('dust-bath'));
    r.stand(THIRD);
    r.run(40);
    const times = r.log.drains.map(([t]) => t);
    expect(times.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(6 - 1e-6);

    const held = rig(only('dust-bath'));
    held.stand(THIRD);
    held.host.player().hold(1000);
    held.run(20);
    expect(held.log.drains).toHaveLength(0);
  });

  it('Low rumble drains 12 when its edge passes a player on the original ground, and not one on a placed block', () => {
    const r = rig(only('low-rumble'));
    const p = ringPoint(8.5, 60, 20);
    r.stand(p);
    untilAttack(r);
    r.run(5);
    expect(r.log.drains.map(([, n]) => n)).toEqual([RUMBLE_SPIRIT]);

    const placed = rig(only('low-rumble'));
    const x = Math.floor(p.x), z = Math.floor(p.z), y = Math.floor(p.y);
    placed.world.placing = true;
    placed.world.set(x, y, z, MAT.palestone);
    placed.world.placing = false;
    placed.stand({ ...p, y: p.y + 1 });
    untilAttack(placed);
    placed.run(5);
    expect(placed.log.drains).toHaveLength(0);
  });

  it('Trunk lift captures a still player in reach after 1.6 s: held 3 s and one practice taken, at most once in 30 s', () => {
    const r = rig(only('trunk-lift'));
    r.stand(THIRD);
    const t0 = untilAttack(r);
    while (r.now() < t0 + 1.1 + CAPTURE_EXTRA - 2 * DT) { r.frame(); expect(r.log.holds).toHaveLength(0); }
    r.run(4 * DT);
    expect(r.log.holds).toEqual([CAPTURE_TIME]);
    expect(r.log.taken).toBe(1);
    expect(r.log.toasts).toContain(LIFT_TOAST);
    r.run(25);
    expect(r.log.taken).toBe(1);
  });

  it('Trunk lift: a positive hit on the deity during its telegraph curls the trunk back (no capture)', () => {
    const r = rig(only('trunk-lift'));
    r.stand(THIRD);
    untilAttack(r);
    r.frame();
    r.deity.touch('positive', true, { x: r.actor.body.x, y: r.actor.body.y + 2, z: r.actor.body.z }, 'intent');
    r.run(2);
    expect(r.log.holds).toHaveLength(0);
    expect(r.log.taken).toBe(0);
  });

  it('Memory stone lands a sky stone on the remembered place for 8 s, then it dissolves', () => {
    const r = rig(only('memory-stone'));
    const rest = ringPoint(8.5, 120, 20);
    r.stand(rest);
    r.run(6);
    r.stand(THIRD);
    const t0 = untilAttack(r);
    r.run(1.2);
    const [x, y, z] = [Math.floor(rest.x), Math.floor(rest.y), Math.floor(rest.z)];
    expect(r.world.get(x, y, z)).toBe(MAT.palestone);
    while (r.now() < t0 + 1.1 + 8.2) r.frame();
    expect(r.world.solid(x, y, z)).toBe(false);
  });

  it('the rim: a hit from the shore puffs, from one block up it counts', () => {
    const r = rig(only('mud-wallow'));
    r.stand(SHORE);
    r.run(0.5);
    const p = { x: r.actor.body.x, y: r.actor.body.y + 0.7, z: r.actor.body.z };
    r.deity.touch('positive', true, p, 'intent');
    expect(r.actor.hits).toBe(0);
    r.stand({ ...SHORE, y: SHORE.y + 1 });
    r.deity.touch('positive', true, p, 'intent');
    expect(r.actor.hits).toBe(1);
  });

  it('the rim: the head counts from the shore only while the trunk is raised (Trumpet)', () => {
    const r = rig(only('trumpet'));
    r.stand(SHORE);
    r.run(0.5);
    const head = () => ({ x: r.actor.body.x, y: r.actor.body.y + 2, z: r.actor.body.z });
    r.deity.touch('positive', true, head(), 'intent');
    expect(r.actor.hits).toBe(0);
    untilAttack(r);
    r.frame();
    r.deity.touch('positive', true, head(), 'intent');
    expect(r.actor.hits).toBe(1);
  });

  it('is won by 36 positive hits, never more: it turns ally, says so, and its stones dissolve', () => {
    const r = rig(only('memory-stone'));
    r.stand({ ...SHORE, y: SHORE.y + 1 });
    let won = 0;
    r.deity.onWon = () => { won++; };
    for (let i = 0; i < HITS + 5; i++) {
      r.deity.touch('positive', true, { x: r.actor.body.x, y: r.actor.body.y + 0.7, z: r.actor.body.z }, 'intent');
      r.run(0.4);
    }
    expect(r.actor.hits).toBe(HITS);
    expect(r.deity.won).toBe(true);
    expect(r.actor.side).toBe('ally');
    expect(r.actor.alive).toBe(true);
    expect(won).toBe(1);
    expect(r.log.toasts).toContain(WON_TOAST);
    expect(mindOf(r.actor).stones).toHaveLength(0);
  });

  it('a negative touch only puffs', () => {
    const r = rig();
    r.stand({ ...SHORE, y: SHORE.y + 1 });
    r.deity.touch('negative', true, { x: r.actor.body.x, y: r.actor.body.y + 0.7, z: r.actor.body.z }, 'intent');
    expect(r.actor.hits).toBe(0);
  });

  it('the whole elephant repeats exactly under a fixed dt', () => {
    const go = () => {
      const r = rig();
      r.stand(THIRD);
      r.run(30);
      return { states: r.states.map(([t, s]) => `${t.toFixed(4)} ${s}`), drains: r.log.drains, pushes: r.log.pushes.length };
    };
    expect(go()).toEqual(go());
  });
});

describe('the herd (ELEPHANT.md B5)', () => {
  function calf(r: ReturnType<typeof rig>, at = PLAN.spawns[0]) {
    const a: SkyActor = {
      id: r.deps.actors.newId(), kind: 'sky', def: 'elephant', role: 'minion', animal: 'elephant', faction: 'neutral', hp: 1,
      body: { x: at.x + 0.5, y: at.y, z: at.z + 0.5, vx: 0, vy: 0, vz: 0, hw: elephantMinion.model.hw, h: elephantMinion.model.h, onGround: true },
      tags: new Set(), room: -1, alive: true, spawning: 0, side: 'wild', state: 'Spawning', t: 0, hits: 0, parked: false,
    };
    return { a, m: new Minion(a, elephantMinion, PLAN, r.deps, r.host, new Rng(9)) };
  }
  const tick = (r: ReturnType<typeof rig>, c: ReturnType<typeof calf>, s: number) => {
    for (let t = 0; t < s - 1e-9; t += DT) { c.m.update(DT, null, []); r.frame(); }
  };

  it('a calf wades out of the waterhole onto the ground ring and walks the herd’s path', () => {
    const r = rig();
    r.stand(ringPoint(8.5, 30, 20));
    const c = calf(r);
    tick(r, c, 20);
    expect(c.a.body.y).toBeCloseTo(BASE + 2, 1);
    expect(Math.hypot(c.a.body.x - (PLAN.spawns[0].x + 0.5), c.a.body.z - (PLAN.spawns[0].z + 0.5))).toBeGreaterThan(3);
  });

  it('shoulders a player who stands in its path, after its ear flap; a negative touch only puffs; five positive hits turn it', () => {
    const r = rig();
    const spot = ringPoint(21.5, 300, 2);
    const c = calf(r, { ...PLAN.spawns[0], x: Math.floor(spot.x), y: BASE + 2, z: Math.floor(spot.z) });
    r.stand({ x: spot.x + 1.2, y: BASE + 2, z: spot.z });
    tick(r, c, 2 + 1.1 + 0.5);
    expect(r.log.pushes.length).toBeGreaterThan(0);
    c.m.touch('negative', true, c.a.body, 'intent');
    expect(c.a.hits).toBe(0);
    for (let i = 0; i < 5; i++) { c.m.touch('positive', true, c.a.body, 'intent'); tick(r, c, 0.7); }
    expect(c.a.side).toBe('ally');
    expect(c.a.state).toBe(ALLY);
  });

  it('an ally lifts a player who stands in front of it one terrace up, onto ground', () => {
    const r = rig();
    const spot = ringPoint(19.5, 300, 2);
    const c = calf(r, { ...PLAN.spawns[0], x: Math.floor(spot.x), y: BASE + 2, z: Math.floor(spot.z) });
    tick(r, c, 2.5);
    for (let i = 0; i < 5; i++) c.m.touch('positive', true, c.a.body, 'intent');
    r.stand({ x: c.a.body.x + 0.6, y: BASE + 2, z: c.a.body.z });
    tick(r, c, 2);
    expect(r.log.carries.length).toBe(1);
    const [x, y, z] = r.log.carries[0];
    expect(y).toBe(BASE + 8);
    expect(r.world.solid(Math.floor(x), y - 1, Math.floor(z))).toBe(true);
    expect(r.world.solid(Math.floor(x), y, Math.floor(z))).toBe(false);
  });
});

describe('the elephant’s art (docs/art/sky/elephant.md, pending owner review)', () => {
  const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lab = (hex: string) => {
    const n = parseInt(hex.slice(1), 16), r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
    const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  };
  const dE = (a: string, b: string) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

  it('keeps every token ΔE ≥ 20 from harm and the gold, and ≥ 15 from the cold (sky rulings 2–4)', () => {
    for (const hex of Object.values(SKY_ELEPHANT_PALETTE)) {
      for (const t of ['life.heart', 'attack.red.base', 'attack.red.dim', 'attack.warn.base', 'light.gold'] as PalToken[]) expect(dE(hex, PALETTE[t]), `${hex} ${t}`).toBeGreaterThanOrEqual(20);
      for (const t of ['cold.body', 'cold.rim', 'cold.dim', 'cold.deep'] as PalToken[]) expect(dE(hex, PALETTE[t]), `${hex} ${t}`).toBeGreaterThanOrEqual(15);
    }
  });

  it('builds a plush deity about 3 high with a head about 2.2 times its body, and a calf about one block, in whole texels', () => {
    const body = elephantDeity.model.body.find(p => p.name === 'body')!, head = elephantDeity.model.head.find(p => p.name === 'head')!;
    expect(head.size[0] / body.size[0]).toBeGreaterThanOrEqual(2);
    expect(elephantDeity.model.h).toBe(3);
    expect(elephantMinion.model.h).toBeLessThanOrEqual(1.3);
    for (const p of [...elephantDeity.model.body, ...elephantDeity.model.head, ...elephantMinion.model.parts]) {
      // sizes in whole texels; an inlay sits half a texel out on its host's face
      for (const v of p.size) expect(Math.abs(v * 16 - Math.round(v * 16)), `${p.name}`).toBeLessThan(1e-9);
      for (const v of p.pos) expect(Math.abs(v * 32 - Math.round(v * 32)), `${p.name}`).toBeLessThan(1e-9);
    }
  });
});
