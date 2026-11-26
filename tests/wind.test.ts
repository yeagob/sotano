// The wind above the crown (issue #373, docs/design/built/levels/giant-tree/WIND.md): it starts on the first row
// over the crown's leaves, pushes an airborne body with 1.1 times its own air control force, turns every 3 seconds
// on the run's seeded forks, never touches a body standing on anything, can be cancelled by a filter on the air's
// forces (the hook the Lion's practice will use), and its white motes stay above the crown and clear of the view.
import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { seedFx } from '../src/core/fx';
import { Rng, RunRandom } from '../src/core/rng';
import { BASE_STATS } from '../src/core/stats';
import type { Input } from '../src/input/input';
import { airControlForce, Player, type PlayerHooks } from '../src/entities/player';
import { AirForces, type AirForce } from '../src/physics/air-forces';
import { AIR_CONTROL, WALK } from '../src/physics/jump';
import { MOTE_CLEAR, MOTE_MAX, MOTE_SPAWN, MOTE_THICK, MOTE_TOKEN, WindMotes } from '../src/render/wind-view';
import { Wind, WIND_FACTOR, WIND_FROM, WIND_PERIOD, WIND_TURN_MIN, windFloor } from '../src/game/wind';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { GiantTree, TREE_STORIES, TREE_ZONES } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';

const runWind = (seed: number) => { const r = new RunRandom(seed); return new Wind(n => r.fork('wind', n)); };
const angle = (v: { x: number; z: number }) => Math.atan2(v.z, v.x);
const turn = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.abs(Math.atan2(Math.sin(angle(b) - angle(a)), Math.cos(angle(b) - angle(a))));

/** A player in open air (or over a floor at y ≤ `ground`), with the wind as the only air force. */
function rig(feetY: number, opts: { ground?: number; wind?: Wind; forces?: AirForces } = {}) {
  const solid = (_x: number, y: number) => opts.ground !== undefined && y <= opts.ground;
  const p = new Player();
  p.spawnAt(100.5, feetY, 100.5);
  p.body.onGround = opts.ground !== undefined && feetY === opts.ground + 1;
  const move = { x: 0, y: 0 };
  const input = { hit: () => false, held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 1 } as unknown as Input;
  const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v };
  const wind = opts.wind ?? runWind(7);
  const forces = opts.forces ?? new AirForces();
  if (!opts.forces) forces.add(wind);
  const step = (dt = 1 / 60) => { wind.advance(dt); p.update(dt, input, BASE_STATS, solid, hooks, undefined, { air: forces }); };
  return { p, move, wind, forces, step };
}

describe('where the wind starts', () => {
  it('is the first row above the crown: 146 blocks over the tree base, the stars story', () => {
    expect(WIND_FROM).toBe(SURFACE_Y + 1 + 146);
    expect(windFloor(SURFACE_Y + 1)).toBe(SURFACE_Y + 1 + TREE_ZONES.heaven);
    const stars = TREE_STORIES.find(s => s.key === 'stars')!;
    expect(WIND_FROM).toBe(SURFACE_Y + 1 + stars.y0);
  });

  it('the crown\'s leaves end on the row just under it', () => {
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    const t = new GiantTree(w, SURFACE_Y, i => new Rng(5 * 31 + i));
    const canopy = TREE_STORIES.findIndex(s => s.key === 'canopy');
    t.grow(canopy);
    const [, y1] = t.range(canopy);
    expect(y1).toBe(WIND_FROM - 1);
    let top = -1;
    for (let y = y1 - 4; y <= y1 + 4; y++) for (let z = t.cz - 60; z <= t.cz + 60; z++) for (let x = t.cx - 60; x <= t.cx + 60; x++) {
      const m = w.get(x, y, z);
      if (m === MAT.leaves || m === MAT.youngleaf) top = Math.max(top, y);
    }
    expect(top).toBeGreaterThanOrEqual(WIND_FROM - 3);
    expect(top).toBeLessThan(WIND_FROM);
  });

  it('blows at the floor and above, never below it', () => {
    const w = runWind(1), q = { x: 0, z: 0, control: 10 };
    expect(w.at({ ...q, y: WIND_FROM })).not.toBeNull();
    expect(w.at({ ...q, y: WIND_FROM + 80 })).not.toBeNull();
    expect(w.at({ ...q, y: WIND_FROM - 0.01 })).toBeNull();
    expect(w.at({ ...q, y: SURFACE_Y + 5 })).toBeNull();
  });
});

describe('the force', () => {
  it('is 1.1 times the body\'s own air control force, along the wind', () => {
    const w = runWind(3);
    const control = airControlForce(AIR_CONTROL, WALK);
    expect(control).toBeCloseTo(14 * 0.35 * 4.6, 10);
    const f = w.at({ x: 0, y: WIND_FROM + 10, z: 0, control })!;
    expect(Math.hypot(f.x, f.z)).toBeCloseTo(WIND_FACTOR * control, 10);
    expect(WIND_FACTOR).toBe(1.1);
    const d = w.direction;
    expect(f.x / Math.hypot(f.x, f.z)).toBeCloseTo(d.x, 10);
  });

  it('the player feeds its own air control force, and feels exactly the wind', () => {
    const r = rig(WIND_FROM + 30);
    r.step();
    expect(r.p.body.onGround).toBe(false);
    expect(r.p.airControl).toBeCloseTo(airControlForce(AIR_CONTROL, WALK), 10);
    expect(Math.hypot(r.p.airForce.x, r.p.airForce.z)).toBeCloseTo(1.1 * r.p.airControl, 10);
  });

  it('a body pushing straight against it still drifts with it, by 0.1 of the walk speed; idle it drifts at 1.1', () => {
    for (const against of [true, false]) {
      const r = rig(WIND_FROM + 200);
      // within one period the wind keeps its direction: read it, then hold the stick against it
      const d = r.wind.direction;
      // the stick's forward is -z at yaw 0: turn the body to face against the wind
      r.p.yaw = Math.atan2(d.x, d.z);
      r.move.y = against ? 1 : 0;
      for (let i = 0; i < 330; i++) r.step(1 / 120);
      expect(r.wind.period).toBe(0);
      const along = r.p.body.vx * d.x + r.p.body.vz * d.z;
      expect(along).toBeCloseTo((against ? 0.1 : 1.1) * WALK, 2);
    }
  });
});

describe('the direction clock', () => {
  it('keeps one direction for 3 seconds and turns exactly at each multiple of 3', () => {
    const w = runWind(11);
    expect(WIND_PERIOD).toBe(3);
    const d0 = w.direction;
    w.advance(2.999);
    expect(w.period).toBe(0);
    expect(w.direction).toEqual(d0);
    w.advance(0.001);
    expect(w.period).toBe(1);
    const d1 = w.direction;
    expect(turn(d0, d1)).toBeGreaterThanOrEqual(WIND_TURN_MIN - 1e-9);
    w.advance(3);
    expect(w.period).toBe(2);
    expect(turn(d1, w.direction)).toBeGreaterThanOrEqual(WIND_TURN_MIN - 1e-9);
  });

  it('is a unit vector, the same for the same seed and different for another seed', () => {
    const a = runWind(42), b = runWind(42), c = runWind(43);
    const seq = (w: Wind) => Array.from({ length: 20 }, (_, n) => w.directionAt(n));
    const sa = seq(a), sb = seq(b), sc = seq(c);
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    for (const v of sa) expect(Math.hypot(v.x, v.z)).toBeCloseTo(1, 12);
    for (let n = 1; n < sa.length; n++) expect(turn(sa[n - 1], sa[n])).toBeGreaterThanOrEqual(WIND_TURN_MIN - 1e-9);
  });

  it('reads the same however the clock is stepped (frame by frame or in one jump)', () => {
    const a = runWind(9), b = runWind(9);
    for (let i = 0; i < 60 * 10; i++) a.advance(1 / 60);
    b.advance(10);
    expect(a.period).toBe(b.period);
    expect(a.direction).toEqual(b.direction);
    // asking an earlier period again recomputes it from the forks
    expect(a.directionAt(1)).toEqual(runWind(9).directionAt(1));
  });
});

describe('no push on any surface, and none below the crown', () => {
  it('standing on the ground above the crown: no force and no drift', () => {
    const ground = WIND_FROM + 20;
    const r = rig(ground + 1, { ground });
    r.step();
    expect(r.p.body.onGround).toBe(true);
    for (let i = 0; i < 120; i++) r.step();
    expect(r.p.airForce).toEqual({ x: 0, z: 0 });
    expect(Math.hypot(r.p.body.vx, r.p.body.vz)).toBe(0);
    expect(r.p.body.x).toBe(100.5);
  });

  it('standing on a one-block platform (a star pad) above the crown: no push', () => {
    const top = WIND_FROM + 40;
    const p = new Player();
    p.spawnAt(10.5, top + 1, 10.5);
    p.body.onGround = true;
    const solid = (x: number, y: number, z: number) => x === 10 && z === 10 && y === top;
    const wind = runWind(2), forces = new AirForces();
    forces.add(wind);
    const input = { hit: () => false, held: () => false, move: { x: 0, y: 0 }, lookDX: 0, lookDY: 0, sensitivity: 1 } as unknown as Input;
    for (let i = 0; i < 300; i++) { wind.advance(1 / 60); p.update(1 / 60, input, BASE_STATS, solid, { jump: v => v, land: () => {}, bump: v => v }, undefined, { air: forces }); }
    expect(p.body.onGround).toBe(true);
    expect(p.body.x).toBe(10.5);
    expect(p.body.z).toBe(10.5);
  });

  it('falling below the crown: no push', () => {
    const r = rig(WIND_FROM - 30);
    for (let i = 0; i < 30; i++) r.step();
    expect(r.p.body.onGround).toBe(false);
    expect(r.p.airForce).toEqual({ x: 0, z: 0 });
    expect(r.p.body.vx).toBe(0);
    expect(r.p.body.vz).toBe(0);
  });

  it('the same body in the air above the crown is pushed', () => {
    const r = rig(WIND_FROM + 30);
    for (let i = 0; i < 30; i++) r.step();
    expect(Math.hypot(r.p.body.vx, r.p.body.vz)).toBeGreaterThan(1);
  });
});

describe('the cancel hook (the Lion\'s shield, not built)', () => {
  it('a filter that cancels the wind leaves the body unpushed, and removing it brings the wind back', () => {
    const r = rig(WIND_FROM + 60);
    const off = r.forces.filter('lion-stub', source => (source === 'wind' ? null : { x: 0, z: 0 }));
    for (let i = 0; i < 30; i++) r.step();
    expect(r.p.airForce).toEqual({ x: 0, z: 0 });
    expect(r.p.body.vx).toBe(0);
    expect(r.p.body.vz).toBe(0);
    off();
    r.step();
    expect(Math.hypot(r.p.airForce.x, r.p.airForce.z)).toBeCloseTo(1.1 * r.p.airControl, 10);
  });

  it('a filter sees each source by id and can cancel one and keep another', () => {
    const f = new AirForces();
    const stub: AirForce = { id: 'stub', at: () => ({ x: 0, z: 2 }) };
    f.add(runWind(4));
    f.add(stub);
    f.filter('lion-stub', (id, v) => (id === 'wind' ? null : v));
    const q = { x: 0, y: WIND_FROM + 5, z: 0, control: 20 };
    expect(f.forceOf('wind', q)).toBeNull();
    expect(f.total(q)).toEqual({ x: 0, z: 2 });
  });
});

describe('the motes', () => {
  const eye = (y: number) => ({ x: 100, y, z: 100 });

  it('are born only above the crown, and none while the eye is far below it', () => {
    seedFx(373);
    const m = new WindMotes(WIND_FROM);
    for (let i = 0; i < 240; i++) m.update(1 / 60, eye(WIND_FROM + 2), { x: 1, z: 0 });
    expect(m.list.length).toBeGreaterThan(0);
    for (const mote of m.list) expect(mote.y).toBeGreaterThanOrEqual(WIND_FROM);
    const low = new WindMotes(WIND_FROM);
    for (let i = 0; i < 240; i++) low.update(1 / 60, eye(WIND_FROM - 40), { x: 1, z: 0 });
    expect(low.list.length).toBe(0);
    seedFx(null);
  });

  it('keep a fixed budget, keep clear of the eye, and are thin and white', () => {
    seedFx(374);
    const m = new WindMotes(WIND_FROM);
    let prev = 0;
    for (let i = 0; i < 600; i++) {
      const e = eye(WIND_FROM + 10 + Math.sin(i / 30) * 4);
      m.update(1 / 60, e, i < 300 ? { x: 1, z: 0 } : { x: 0, z: -1 });
      expect(m.list.length).toBeLessThanOrEqual(MOTE_MAX);
      expect(m.list.length - prev).toBeLessThanOrEqual(MOTE_SPAWN);
      prev = m.list.length;
      for (const mote of m.list) {
        const d = Math.hypot(mote.x - e.x, mote.y - e.y, mote.z - e.z);
        const k = m.scale(mote, e);
        expect(k).toBeGreaterThanOrEqual(0);
        expect(k).toBeLessThanOrEqual(1);
        if (d <= MOTE_CLEAR) expect(k).toBe(0);
        if (mote.y <= WIND_FROM) expect(k).toBe(0);
      }
    }
    expect(MOTE_THICK).toBeLessThanOrEqual(0.05);
    expect(MOTE_TOKEN).toBe('cold.white');
    seedFx(null);
  });

  it('swing round to the new wind after a turn', () => {
    seedFx(375);
    const m = new WindMotes(WIND_FROM);
    for (let i = 0; i < 60; i++) m.update(1 / 60, eye(WIND_FROM + 5), { x: 1, z: 0 });
    for (let i = 0; i < 60; i++) m.update(1 / 60, eye(WIND_FROM + 5), { x: 0, z: 1 });
    expect(m.look.z).toBeCloseTo(1, 3);
    seedFx(null);
  });
});
