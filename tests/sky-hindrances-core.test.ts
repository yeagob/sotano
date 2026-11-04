// The hindrance runner, the shared effect rules, knockback and wind (docs/architecture/SKY.md §6, H0).
// Every hindrance: no effect before its full telegraph; a placed block is never changed; the effect ends;
// no damage (only the player's push is called, never a drain, a trip or a practice taken); each positive
// answer works where it should; a block between source and player shelters. The tint of the sky's marks
// is ΔE ≥ 20 from the reserved colours (no red, no warning, no gold), and a tinted strike never hits.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Hazards, type HazardHost, type Shape as HazardShape } from '../src/enemies/attacks';
import type { Actor } from '../src/entities/actors';
import { PALETTE, pal, type PalToken } from '../src/content/palette';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { AIR, MAT } from '../src/content/materials';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { KICK_SECONDS, KNOCKBACK_PAINT, SOFT } from '../src/sky/hindrances/knockback';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { WIND_PAINT } from '../src/sky/hindrances/wind';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import { ExceptionKind, MIN_TELEGRAPH, type HindranceCtx, type KnockbackParams, type Shape, type SkyHost, type Vec3, type WindParams } from '../src/sky/types';
import type { Body } from '../src/physics/voxel-collide';

const { stone, dirt } = MAT;
/** A slab of stone from x 0 to 40 and z 0 to 40, two blocks deep (box bounds are inclusive): its top is y 2, where the player stands. */
const FLOOR: Shape = { k: 'box', x0: 0, y0: 0, z0: 0, x1: 40, y1: 1, z1: 40, m: stone };
/** A wall at x 16 and 17, across the floor from z 15 to 25, three blocks high above it. */
const WALL: Shape = { k: 'box', x0: 16, y0: 2, z0: 15, x1: 17, y1: 4, z1: 25, m: stone };

/** The sky's world for one test: the floor, and a wall when asked for. */
function worldOf(wall = false) {
  return new SkyWorld(buildIndex(wall ? [FLOOR, WALL] : [FLOOR]));
}

/** A player standing at (x, 2, z), and a host that records every call it receives. */
function rig(world: SkyWorld, x: number, z: number) {
  let now = 0;
  const body: Body = { x, y: 2, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const pushes: number[][] = [];
  const calls = new Set<string>();
  const spy = (name: string) => (...args: unknown[]) => { calls.add(name); return args; };
  const player = {
    body, eye: { x, y: 3.6, z }, aim: { x: 0, y: 0, z: 1 }, hand: [],
    push: (vx: number, vy: number, vz: number) => { calls.add('player.push'); pushes.push([vx, vy, vz]); },
    slow: spy('player.slow'), hold: spy('player.hold'), carry: spy('player.carry'),
  };
  const actor = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hostFx: HazardHost = {
    actors: () => [actor],
    hurt: spy('hazard.hurt') as HazardHost['hurt'],
    affect: spy('hazard.affect') as HazardHost['affect'],
    push: spy('hazard.push') as HazardHost['push'],
    live: () => {},
    particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hostFx);
  const host = {
    time: () => now,
    player: () => player,
    world: () => world,
    hazards: () => hazards,
    fx: () => {}, cue: () => {}, toast: () => {}, card: () => {}, bar: () => {}, place: () => {}, gift: () => {},
    travel: spy('host.travel'), drainSpirit: spy('host.drainSpirit'), spirit: () => 100,
    takeRandomPractice: spy('host.takeRandomPractice'), sendUnderground: spy('host.sendUnderground'),
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const ctx = { host, effects, hazards, time: () => now } as HindranceCtx;
  const runner = new HindranceRunner(ctx);
  /** One frame: the runner and the hazards move on together, as the sky's frame will drive them. */
  const frame = (dt: number) => { runner.update(dt); hazards.update(dt); now += dt; };
  const run = (seconds: number) => { for (let t = 0; t < seconds - 1e-9; t += 0.05) frame(0.05); };
  return { world, body, pushes, calls, player, host, hazards, effects, runner, frame, run, actor };
}

const KNOCK = (over: Partial<KnockbackParams> = {}): KnockbackParams => ({
  from: { x: 14, y: 2, z: 20 } as Vec3, shape: 'ring' as const, radius: 6, strength: 10, ...over,
});
const GUST = (over: Partial<WindParams> = {}): WindParams => ({
  from: { x: 10, y: 2.5, z: 20 } as Vec3, to: { x: 30, y: 2.5, z: 20 } as Vec3, radius: 3, strength: 12, seconds: 2, ...over,
});
const HIT = (x: number, y: number, z: number, warm = true) => ({ x, y, z, cell: -1, actor: -1, weapon: 'intent' as const, warm });

// CIE Lab (normal vision), the maths of tests/sky-materials.test.ts
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function lab(n: number): number[] {
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: PalToken, b: PalToken) => {
  const p = lab(pal(a)), q = lab(pal(b));
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

describe('the hindrance runner', () => {
  it('shows the telegraph first: no effect before its full length', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 1.2, 1);
    r.run(1.1);
    expect(r.pushes).toEqual([]);
    expect(r.runner.active()[0]).toMatchObject({ id: 'knockback', source: 1, phase: 'telegraph' });
    r.run(0.3);
    expect(r.pushes.length).toBe(1);
    expect(r.runner.active()[0].phase).toBe('effect');
  });

  it('never runs a telegraph shorter than the minimum', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 0.1, 1);
    r.run(MIN_TELEGRAPH - 0.1);
    expect(r.pushes).toEqual([]);
    r.run(0.2);
    expect(r.pushes.length).toBe(1);
  });

  it('ends its effect by itself and leaves nothing running', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 1, 1);
    r.run(1 + KICK_SECONDS + 0.1);
    expect(r.runner.active()).toEqual([]);
    expect(r.hazards.size).toBe(0);
  });

  it('stop ends a run in its telegraph: no effect follows', () => {
    const r = rig(worldOf(), 18, 20);
    const id = r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(0.5);
    r.runner.stop(id);
    r.run(2);
    expect(r.pushes).toEqual([]);
    expect(r.runner.active()).toEqual([]);
    expect(r.hazards.size).toBe(0);
  });

  it('answers nothing that is not a warm touch', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 1, 1);
    expect(r.runner.positiveHit(HIT(14, 2, 20, false))).toBe(false);
    expect(r.runner.positiveHit(HIT(14, 2, 20, true))).toBe(true);
  });
});

describe('knockback', () => {
  it('pushes the player away from the source along an arc, once', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK({ strength: 10 }), 1, 1);
    r.run(1.2);
    expect(r.pushes.length).toBe(1);
    const [vx, vy, vz] = r.pushes[0];
    expect(vx).toBeCloseTo(10, 6);
    expect(vy).toBeCloseTo(10 * 0.45, 6);
    expect(vz).toBeCloseTo(0, 6);
  });

  it('does nothing to a player outside its reach', () => {
    const r = rig(worldOf(), 30, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 1, 1);
    r.run(1.2);
    expect(r.pushes).toEqual([]);
  });

  it('a line kick pushes along its aim and reaches only what lies on the line', () => {
    const line = KNOCK({ shape: 'line', dir: { x: 1, y: 0, z: 0 }, radius: 8 });
    const on = rig(worldOf(), 18, 20);
    on.runner.start(HINDRANCES.knockback, line, 1, 1);
    on.run(1.2);
    expect(on.pushes[0][0]).toBeCloseTo(10, 6);
    const off = rig(worldOf(), 18, 24);
    off.runner.start(HINDRANCES.knockback, line, 1, 1);
    off.run(1.2);
    expect(off.pushes).toEqual([]);
  });

  it('a block between the source and the player shelters them', () => {
    const r = rig(worldOf(true), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK(), 1, 1);
    r.run(1.2);
    expect(r.pushes).toEqual([]);
  });

  it('a positive shot on the source during the telegraph softens the kick to the soft push', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK({ strength: 10 }), 1, 1);
    r.run(0.4);
    expect(r.runner.positiveHit(HIT(15, 2.5, 20))).toBe(true);
    r.run(0.7);
    expect(r.pushes[0][0]).toBeCloseTo(10 * SOFT, 6);
  });

  it('a positive shot far from the source does not soften it', () => {
    const r = rig(worldOf(), 18, 20);
    r.runner.start(HINDRANCES.knockback, KNOCK({ strength: 10 }), 1, 1);
    expect(r.runner.positiveHit(HIT(30, 2.5, 20))).toBe(false);
    r.run(1.2);
    expect(r.pushes[0][0]).toBeCloseTo(10, 6);
  });
});

describe('wind', () => {
  it('pushes along its line while the player is in the gust, and only then', () => {
    const r = rig(worldOf(), 20, 20);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(0.9);
    expect(r.pushes).toEqual([]);
    r.run(0.5);
    expect(r.pushes.length).toBeGreaterThan(0);
    for (const [vx, vy, vz] of r.pushes) {
      expect(vx).toBeGreaterThan(0);
      expect(vy).toBe(0);
      expect(vz).toBeCloseTo(0, 6);
    }
  });

  it('pushes nothing when the player stands out of the capsule', () => {
    const r = rig(worldOf(), 20, 30);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(3.5);
    expect(r.pushes).toEqual([]);
  });

  it('ends when its length is over: no push after it, nothing left running', () => {
    const r = rig(worldOf(), 20, 20);
    r.runner.start(HINDRANCES.wind, GUST({ seconds: 1 }), 1, 1);
    r.run(2.2);
    const n = r.pushes.length;
    expect(n).toBeGreaterThan(0);
    expect(r.runner.active()).toEqual([]);
    r.run(1);
    expect(r.pushes.length).toBe(n);
  });

  it('a block in the line shelters the player', () => {
    const r = rig(worldOf(true), 20, 20);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(2.5);
    expect(r.pushes).toEqual([]);
  });

  it('a positive shot on the source ends a gust that is already blowing', () => {
    const r = rig(worldOf(), 20, 20);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(1.3);
    const before = r.pushes.length;
    expect(before).toBeGreaterThan(0);
    expect(r.runner.positiveHit(HIT(10, 2.5, 20))).toBe(true);
    r.run(1.5);
    expect(r.pushes.length).toBe(before);
    expect(r.runner.active()).toEqual([]);
  });

  it('a positive shot on the source during the warning cancels the gust before it begins', () => {
    const r = rig(worldOf(), 20, 20);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.run(0.3);
    expect(r.runner.positiveHit(HIT(10, 2.5, 20))).toBe(true);
    r.run(3);
    expect(r.pushes).toEqual([]);
    expect(r.runner.active()).toEqual([]);
    expect(r.hazards.size).toBe(0);
  });
});

describe('the shared effect rules', () => {
  it('a placed block is never changed, and a protected cell is not either', () => {
    const w = worldOf();
    w.placing = true; w.set(20, 3, 20, dirt); w.placing = false;
    const r = rig(w, 20, 20);
    const placed = w.idx(20, 3, 20), open = w.idx(22, 3, 22);
    expect(w.kindAt(placed)).toBe(ExceptionKind.Placed);
    expect(r.effects.transient([placed], AIR, 5, 7)).toEqual([]);
    expect(w.kindAt(placed)).toBe(ExceptionKind.Placed);
    r.effects.protect([open], 4);
    expect(r.effects.isProtected(open)).toBe(true);
    expect(r.effects.transient([open], AIR, 5, 7)).toEqual([]);
    r.effects.release(4);
    expect(r.effects.transient([open], AIR, 5, 7)).toEqual([open]);
  });

  it('a transient change of the formula is undone by its owner', () => {
    const w = worldOf();
    const r = rig(w, 20, 20);
    const i = w.idx(20, 1, 20);
    expect(w.getAt(i)).toBe(stone);
    expect(r.effects.transient([i], AIR, 30, 9)).toEqual([i]);
    expect(w.getAt(i)).toBe(AIR);
    r.effects.restore(9);
    expect(w.getAt(i)).toBe(stone);
    expect(w.kindAt(i)).toBe(0);
  });

  it('source water fills open air and is removed by its owner', () => {
    const w = worldOf();
    const r = rig(w, 20, 20);
    const i = w.idx(20, 5, 20);
    expect(r.effects.water([i], 11)).toEqual([i]);
    expect(w.elemAtIndex(i)).toBe(elemByte(EL_WATER, SOURCE));
    r.effects.dry(11);
    expect(w.elemAtIndex(i)).toBe(0);
  });

  it('nothing in a hindrance cycle calls a damaging or a state-taking verb', () => {
    const w = worldOf();
    const r = rig(w, 20, 20);
    r.runner.start(HINDRANCES.wind, GUST(), 1, 1);
    r.runner.start(HINDRANCES.knockback, KNOCK({ strength: 10 }), 1, 2);
    r.run(4);
    expect(r.calls.has('player.push')).toBe(true);
    for (const forbidden of ['host.drainSpirit', 'host.sendUnderground', 'host.takeRandomPractice', 'host.travel', 'player.hold', 'player.carry', 'hazard.hurt']) {
      expect(r.calls.has(forbidden), forbidden).toBe(false);
    }
  });
});

describe('the sky tint of the marks', () => {
  it('colours the marks in the tint and never strikes a tinted shape', () => {
    const r = rig(worldOf(), 14, 20);
    const ring: HazardShape = { kind: 'ring', x: 14, y: 2, z: 20, r: 0.5, grow: 0, width: 0.15, height: 1.2 };
    r.hazards.add(-50, 'neutral', 'sky', { lead: 0, live: 1, damage: 5, shape: ring, tint: WIND_PAINT });
    r.hazards.update(0.1);
    const mesh = (r.hazards as unknown as { mesh: THREE.InstancedMesh }).mesh;
    expect(mesh.count).toBeGreaterThan(0);
    const c = new THREE.Color();
    c.fromBufferAttribute(mesh.instanceColor!, 0);
    expect(c.getHex()).toBe(pal(WIND_PAINT.live));
    r.hazards.update(0.5);
    expect(r.calls.has('hazard.hurt')).toBe(false);
  });

  it('the sky tones are ΔE ≥ 20 from the reserved colours of harm, warning and gold', () => {
    const reserved: PalToken[] = ['life.heart', 'attack.red.base', 'attack.warn.base', 'light.gold'];
    for (const paint of [KNOCKBACK_PAINT, WIND_PAINT]) {
      for (const t of [paint.tell, paint.live, paint.reach, ...paint.motes]) {
        expect(PALETTE[t], t).toBeDefined();
        expect(t.startsWith('cold.') || t.startsWith('attack.') || t.startsWith('life.') || t.startsWith('light.'), t).toBe(false);
        for (const z of reserved) expect(dE(t, z), `${t} vs ${z}`).toBeGreaterThanOrEqual(20);
      }
    }
  });
});
