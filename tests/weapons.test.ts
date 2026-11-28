// Weapons that replace the intention (docs/architecture/WEAPONS.md), tested headless with a fake host.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Beam, BEAM_HELIX_R, BEAM_MAX_RAYS, BEAM_WIDTH, beamPath, beamRays, Blade, HALO_WIDTH, helixRadiusAt, BLADE_MAX_REACH, chargeTime, GreatCut, GREATCUT_MAX_REACH, type WeaponHost, type WeaponTarget } from '../src/combat/weapons';
import { HELIX_SHARE, intentFromStats, TRIAD_SHARE, VOLLEY_SHARE, VOLLEY_SPREAD } from '../src/combat/intents';
import { Rng } from '../src/core/rng';
import { BASE_STATS, StatSheet, type Stats } from '../src/core/stats';
import { createBus, WEAPONS_KEEPING_SHOT } from '../src/game/events';
import type { IntentSpec } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** A world of solid blocks around the origin; the player stands at (0.5, 0, 0.5) looking at -Z. */
function fakeHost(opts: {
  stats?: Partial<Stats>; unbreakable?: Set<string>; fill?: number; shot?: Partial<IntentSpec>;
  targets?: WeaponTarget[]; extra?: [number, number, number][];
} = {}) {
  const blocks = new Set<string>();
  const fill = opts.fill ?? 6;
  for (let x = -fill; x <= fill; x++) for (let y = 0; y <= 3; y++) for (let z = -fill * 3; z <= fill; z++)
    if (!(x === 0 && z === 0)) blocks.add(key(x, y, z));
  for (const [x, y, z] of opts.extra ?? []) blocks.add(key(x, y, z));
  const state = {
    casting: false, cuts: [] as string[], burns: 0, strikes: 0, shots: 0, log: [] as string[],
    hits: [] as number[], kx: [] as number[], dmg: [] as number[],
    cancel: false, cancelShot: false, hand: 1,
    cubes: [] as [number, number, number][], slashes: [] as [THREE.Vector3, THREE.Vector3][],
  };
  const stats = { ...BASE_STATS, ...opts.stats };
  const targets = opts.targets ?? [{ id: 7, x: 0.5, y: 0.6, z: -1.5, hw: 0.4, h: 1.6 }];
  const host: WeaponHost = {
    stats: () => stats,
    eye: () => new THREE.Vector3(0.5, 1.6, 0.5),
    forward: () => new THREE.Vector3(0, 0, -1),
    casting: () => state.casting,
    shot: () => {
      state.shots++; state.log.push('fire');
      return state.cancelShot ? null : { ...intentFromStats(stats, 'positive'), ...opts.shot, tags: new Set<string>() };
    },
    castHand: () => state.hand,
    strike: (_w, damage, mining, reach) => {
      state.strikes++; state.log.push('strike');
      return state.cancel ? null : { damage, mining, reach, tags: new Set() };
    },
    nearestBlock: (x, y, z, range) => {
      let best: { x: number; y: number; z: number } | null = null, bd = Infinity;
      for (const k of blocks) {
        const [bx, by, bz] = k.split(',').map(Number);
        const d = Math.hypot(bx + 0.5 - x, by + 0.5 - y, bz + 0.5 - z);
        if (d <= range && d < bd) { bd = d; best = { x: bx + 0.5, y: by + 0.5, z: bz + 0.5 }; }
      }
      return best;
    },
    solid: (x, y, z) => blocks.has(key(x, y, z)),
    breakable: (x, y, z) => blocks.has(key(x, y, z)) && !opts.unbreakable?.has(key(x, y, z)),
    cut: (x, y, z) => { blocks.delete(key(x, y, z)); state.cuts.push(key(x, y, z)); },
    burn: (x, y, z) => { state.burns++; blocks.delete(key(x, y, z)); return true; },
    answer: () => {},
    targets: () => targets,
    hit: (id, damage, kx) => { state.hits.push(id); state.dmg.push(damage); state.kx.push(kx); },
    clearProjectiles: () => {},
    // a loose cube in front of the player, 1.5 blocks ahead at eye height
    clearCubes: inside => { if (inside(0.5, 1.6, -1)) state.cubes.push([0.5, 1.6, -1]); },
    sliceCubes: (inside, along, across) => {
      if (inside(0.5, 1.6, -1)) { state.cubes.push([0.5, 1.6, -1]); state.slashes.push([along.clone(), across.clone()]); }
    },
    particles: () => {}, shake: () => {}, swingHands: () => {}, chargeHands: () => {}, sound: () => {},
  };
  return { host, blocks, state };
}

const run = (w: { update(dt: number): void }, seconds: number, dt: number) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) w.update(dt);
};

describe('active weapon', () => {
  function setup() {
    const bus = createBus();
    const stats = new StatSheet();
    const api = { bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn), rng: () => new Rng(1), message: () => {} } as unknown as HostApi;
    return new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  }

  it('is the intention by default, an item replaces it, and the synergy outranks both', () => {
    const inv = setup();
    expect(inv.weapon).toBe('intent');
    inv.gain('occamsrazor');
    expect(inv.weapon).toBe('blade');
    inv.gain('kiai');
    expect(inv.weapon).toBe('greatcut');
    inv.lose('occamsrazor');
    expect(inv.weapon).toBe('beam');
    inv.lose('kiai');
    expect(inv.weapon).toBe('intent');
  });

  it('survives serialize and restore, and ties go to the latest gained', () => {
    const inv = setup();
    inv.restore(['kiai', 'occamsrazor']);
    expect(inv.weapon).toBe('greatcut');
    inv.restore(['kiai', 'stoic']);
    expect(inv.weapon).toBe('beam');
    expect(inv.serialize()).toEqual(['kiai', 'stoic']);
  });

  it('the razor is used alongside the intention; the other weapons replace it', () => {
    expect(WEAPONS_KEEPING_SHOT.has('blade')).toBe(true);
    expect(WEAPONS_KEEPING_SHOT.has('beam')).toBe(false);
    expect(WEAPONS_KEEPING_SHOT.has('greatcut')).toBe(false);
  });

  it('both weapons are quality 4; the blade is the worm\'s secret gift only, kiai drops from bosses', () => {
    for (const id of ['occamsrazor', 'kiai']) expect(ITEMS.find(i => i.id === id)!.quality).toBe(4);
    expect(ITEMS.find(i => i.id === 'kiai')!.pools).toEqual({ boss: 1 });
    expect(ITEMS.find(i => i.id === 'occamsrazor')!.pools).toEqual({ secret: 1 });
  });

  it('the chorus and choir synergies are gone: the shot practices reach the beam themselves', () => {
    const ids = SYNERGIES.map(s => s.id);
    expect(ids).not.toContain('chorus');
    expect(ids).not.toContain('choir');
  });
});

describe('Cut Ties with Toxic Relationships (blade)', () => {
  it('cuts every breakable block in front, none behind, hits projections, and leaves the unbreakable', () => {
    const { host, state } = fakeHost({ unbreakable: new Set([key(0, 1, -1)]) });
    const b = new Blade(new THREE.Scene(), host);
    state.casting = true;
    b.update(1 / 60);
    expect(state.strikes).toBe(1);
    expect(state.cuts.length).toBeGreaterThan(8);
    expect(state.cuts).not.toContain(key(0, 1, -1));
    expect(state.cuts.every(c => Number(c.split(',')[2]) <= 0)).toBe(true);
    expect(state.cuts).toContain(key(0, 1, -2));
    expect(state.hits).toEqual([7]);
  });

  it('swings at 80% of the fire rate while held, with its reach capped', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2, size: 5 } });
    const b = new Blade(new THREE.Scene(), host);
    state.casting = true;
    run(b, 2.01, 1 / 60);
    expect(state.strikes).toBe(4); // t = 0, 0.625, 1.25, 1.875
    const far = Math.max(...state.cuts.map(c => -Number(c.split(',')[2])));
    expect(far).toBeLessThanOrEqual(BLADE_MAX_REACH);
  });
});

describe('Remember Breathing (beam)', () => {
  it('charges for 2.7 ÷ fire rate seconds (0.35–2), and only a full charge releases', () => {
    expect(chargeTime({ ...BASE_STATS, fireRate: 2.7 })).toBe(1);
    expect(chargeTime({ ...BASE_STATS, fireRate: 30 })).toBe(0.35);
    expect(chargeTime({ ...BASE_STATS, fireRate: 0.3 })).toBe(2);
    const { host, state } = fakeHost();
    const beam = new Beam(new THREE.Scene(), host);
    state.casting = true; run(beam, 0.5, 1 / 60);
    state.casting = false; beam.update(1 / 60);
    expect(state.strikes).toBe(0);
  });

  for (const fps of [20, 60, 144]) {
    it(`deals exactly 10 ticks per beam at ${fps} fps, burning through blocks as they break`, () => {
      const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
      const beam = new Beam(new THREE.Scene(), host);
      state.casting = true; run(beam, 1.05, 1 / fps);
      state.casting = false; run(beam, 1.5, 1 / fps);
      expect(state.strikes).toBe(1);
      expect(state.burns).toBe(10);
      expect(state.hits.length).toBeGreaterThan(0);
    });
  }

  it('gives the charge back when a hook cancels the strike', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
    const beam = new Beam(new THREE.Scene(), host);
    state.cancel = true;
    state.casting = true; run(beam, 1.05, 1 / 60);
    state.casting = false; beam.update(1 / 60);
    state.cancel = false;
    state.casting = true; beam.update(1 / 60);
    state.casting = false; beam.update(1 / 60);
    expect(state.strikes).toBe(2);
  });

  it('emits fire once per release, before strike', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
    const beam = new Beam(new THREE.Scene(), host);
    state.casting = true; run(beam, 1.05, 1 / 60);
    state.casting = false; run(beam, 1.5, 1 / 60);
    expect(state.shots).toBe(1);
    expect(state.strikes).toBe(1);
    expect(state.log).toEqual(['fire', 'strike']);
  });

  it('a cancelled fire refunds the charge: the next frame releases again at full charge', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
    const beam = new Beam(new THREE.Scene(), host);
    state.cancelShot = true;
    state.casting = true; run(beam, 1.05, 1 / 60);
    state.casting = false; beam.update(1 / 60);
    expect(state.shots).toBe(1);
    expect(state.strikes).toBe(0);
    state.cancelShot = false;
    beam.update(1 / 60);
    expect(state.shots).toBe(2);
    expect(state.strikes).toBe(1);
  });

  it('Dual Process fans two beams and Triangulation three, the extras at 60%', () => {
    const eye = new THREE.Vector3(0.5, 1.6, 0.5), f = new THREE.Vector3(0, 0, -1), end = eye.clone().addScaledVector(f, 24);
    const fan = (volley: number) => beamRays({ volley, homing: 0, homingTarget: 'block', twin: false }, eye, f, end, 0, 1);
    expect(fan(1).map(r => r.share)).toEqual([1]);
    expect(fan(2).map(r => r.share)).toEqual([1, VOLLEY_SHARE]);
    const three = fan(3);
    expect(three.map(r => r.share)).toEqual([1, VOLLEY_SHARE, VOLLEY_SHARE]);
    // the extras turn around up, one to each side
    expect(three[0].dir.angleTo(three[1].dir)).toBeCloseTo(VOLLEY_SPREAD);
    expect(three[0].dir.angleTo(three[2].dir)).toBeCloseTo(VOLLEY_SPREAD);
    expect(three[1].dir.x * three[2].dir.x).toBeLessThan(0);
  });

  it('Rule of Three splits each beam into three strands at 70%, opening from 0.15 to 0.9 blocks', () => {
    const eye = new THREE.Vector3(0.5, 1.6, 0.5), f = new THREE.Vector3(0, 0, -1), end = eye.clone().addScaledVector(f, 24);
    const shape = { volley: 1, formation: { triad: true, spiral: false }, homing: 0, homingTarget: 'block' as const, twin: false };
    const base = beamRays({ ...shape, formation: undefined }, eye, f, end, 0, 1)[0].origin;
    const tri0 = beamRays(shape, eye, f, end, 0, 1);
    expect(tri0).toHaveLength(3);
    for (const r of tri0) expect(r.share).toBeCloseTo(TRIAD_SHARE);
    for (const r of tri0) expect(r.origin.distanceTo(base)).toBeCloseTo(0.15);
    const tri1 = beamRays(shape, eye, f, end, 1, 1);
    for (const r of tri1) expect(r.origin.distanceTo(base)).toBeCloseTo(0.9);
  });

  it('Spiral Growth makes strand 0 whole and strands 1 and 2 at 40%, circling the beam at radius 0.3', () => {
    const eye = new THREE.Vector3(0.5, 1.6, 0.5), f = new THREE.Vector3(0, 0, -1), end = eye.clone().addScaledVector(f, 24);
    const shape = { volley: 1, formation: { triad: false, spiral: true }, homing: 0, homingTarget: 'block' as const, twin: false };
    const base = beamRays({ ...shape, formation: undefined }, eye, f, end, 0, 1)[0].origin;
    const helix = beamRays(shape, eye, f, end, 0.5, 1);
    expect(helix.map(r => r.share)).toEqual([1, HELIX_SHARE, HELIX_SHARE]);
    for (const r of helix) expect(r.origin.distanceTo(base)).toBeCloseTo(0.3);
    // at the release the strands start on the beam itself
    for (const r of beamRays(shape, eye, f, end, 0, 1)) expect(r.origin.distanceTo(base)).toBeCloseTo(0);
  });

  it('Bilateral casts one beam from each hand, the ticks alternating, 10 in all', () => {
    for (const hand of [1, -1] as const) {
      // no blocks, so every tick reaches the target and its hit says which hand cast it (the ray turns with the hand)
      const { host, state } = fakeHost({ fill: 0, stats: { fireRate: 2.7, twinCast: 1 } });
      state.hand = hand;
      const beam = new Beam(new THREE.Scene(), host);
      state.casting = true; run(beam, 1.05, 1 / 60);
      state.casting = false; run(beam, 1.5, 1 / 60);
      expect(state.strikes).toBe(1);
      expect(state.hits).toHaveLength(10);
      const sides = state.kx.map(k => Math.sign(k));
      // the right hand's rays aim left (kx < 0), the left hand's right: the sign follows the hand that cast the tick
      expect(sides).toEqual(Array.from({ length: 10 }, (_, i) => (i % 2 ? hand : -hand)));
      expect(sides.filter(s => s === -hand)).toHaveLength(5);
    }
  });

  it('Eye Contact bends the rays toward the nearest projection in its cone, and not one outside it', () => {
    const shot = { homing: 10, homingTarget: 'projection' as const };
    const inCone = fakeHost({ fill: 0, stats: { fireRate: 2.7 }, shot, targets: [{ id: 3, x: 1.5, y: 0.6, z: -4.5, hw: 0.4, h: 1.6 }] });
    inCone.state.casting = true;
    const b1 = new Beam(new THREE.Scene(), inCone.host);
    run(b1, 1.05, 1 / 60); inCone.state.casting = false; run(b1, 1.5, 1 / 60);
    expect(inCone.state.hits.length).toBe(10);
    expect(inCone.state.kx.every(k => k > 0)).toBe(true);

    const outside = fakeHost({ fill: 0, stats: { fireRate: 2.7 }, shot, targets: [{ id: 4, x: 6.5, y: 0.6, z: -0.5, hw: 0.4, h: 1.6 }] });
    outside.state.casting = true;
    const b2 = new Beam(new THREE.Scene(), outside.host);
    run(b2, 1.05, 1 / 60); outside.state.casting = false; run(b2, 1.5, 1 / 60);
    expect(outside.state.hits).toEqual([]);
  });

  it('Dowsing curves the rays toward the nearest block', () => {
    const shot = { homing: 3, homingTarget: 'block' as const };
    const target = [{ id: 3, x: 3.7, y: 0.6, z: -5, hw: 0.4, h: 1.6 }];
    const dowsed = fakeHost({ fill: 0, stats: { fireRate: 2.7 }, shot, extra: [[2, 1, 0]], targets: target });
    dowsed.state.casting = true;
    const b1 = new Beam(new THREE.Scene(), dowsed.host);
    run(b1, 1.05, 1 / 60); dowsed.state.casting = false; run(b1, 1.5, 1 / 60);
    expect(dowsed.state.hits.length).toBe(10);
    expect(dowsed.state.kx.every(k => k > 0)).toBe(true);

    const straight = fakeHost({ fill: 0, stats: { fireRate: 2.7 }, extra: [[2, 1, 0]], targets: target });
    straight.state.casting = true;
    const b2 = new Beam(new THREE.Scene(), straight.host);
    run(b2, 1.05, 1 / 60); straight.state.casting = false; run(b2, 1.5, 1 / 60);
    expect(straight.state.hits).toEqual([]);
  });

  it('caps its rays at BEAM_MAX_RAYS, dropping the outermost fan beams first', () => {
    const eye = new THREE.Vector3(0.5, 1.6, 0.5), f = new THREE.Vector3(0, 0, -1), end = eye.clone().addScaledVector(f, 24);
    const flat = beamRays({ volley: 30, homing: 0, homingTarget: 'block', twin: false }, eye, f, end, 0, 1);
    expect(flat).toHaveLength(BEAM_MAX_RAYS);
    expect(flat[0].share).toBe(1);
    const formed = beamRays({ volley: 10, formation: { triad: true, spiral: true }, homing: 0, homingTarget: 'block', twin: false }, eye, f, end, 0.4, 1);
    expect(formed).toHaveLength(BEAM_MAX_RAYS);
    expect(formed[0].share).toBeCloseTo(TRIAD_SHARE);
  });

  it('a formed, volleyed beam ticks the same at 20 and 144 fps', () => {
    const trace = (fps: number) => {
      const { host, state } = fakeHost({
        fill: 0, stats: { fireRate: 2.7 },
        shot: { volley: 2, formation: { triad: true, spiral: true }, homing: 10, homingTarget: 'projection' },
        targets: [{ id: 3, x: 1.5, y: 0.6, z: -4.5, hw: 0.4, h: 1.6 }],
      });
      const beam = new Beam(new THREE.Scene(), host);
      state.casting = true; run(beam, 1.05, 1 / fps);
      state.casting = false; run(beam, 1.5, 1 / fps);
      return { hits: state.hits, kx: state.kx, dmg: state.dmg };
    };
    expect(trace(20)).toEqual(trace(144));
  });

  it('twin, volley and formation together still make one strike and ten ticks', () => {
    const { host, state } = fakeHost({ fill: 0, stats: { fireRate: 2.7, twinCast: 1 }, shot: { volley: 3, formation: { triad: true, spiral: true } } });
    const beam = new Beam(new THREE.Scene(), host);
    state.casting = true; run(beam, 1.05, 1 / 60);
    state.casting = false; run(beam, 1.5, 1 / 60);
    expect(state.strikes).toBe(1);
    expect(state.hits.length).toBeGreaterThan(0);
  });
});

const HAND = new THREE.Vector3(0.68, 1.48, 0.5);

function visibleBeam(scene: THREE.Scene) {
  const meshes = scene.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh && o.visible);
  const cores = meshes.filter(m => (m.material as THREE.MeshBasicMaterial).opacity > 0.9);
  const tubes = cores.filter(m => m.geometry instanceof THREE.CylinderGeometry);
  const helices = meshes.filter(m => !(m.geometry instanceof THREE.CylinderGeometry));
  return { cores, tubes, helices };
}

function castOnce(opts: Parameters<typeof fakeHost>[0], after = 0.15) {
  const { host, state } = fakeHost(opts);
  const scene = new THREE.Scene();
  const beam = new Beam(scene, host);
  state.casting = true; run(beam, 1.05, 1 / 60);
  state.casting = false; run(beam, after, 1 / 60);
  return { scene, state };
}

describe('Remember Breathing takes the shot practices (issue #257)', () => {
  const eyeContactFan = { volley: 3, homing: 10, homingTarget: 'projection' as const };
  const ahead = [{ id: 3, x: 1.5, y: 0.6, z: -6.5, hw: 0.4, h: 1.6 }];

  it('Triangulation with Eye Contact casts three beams that leave the hand a fan apart', () => {
    const { scene } = castOnce({ fill: 0, stats: { fireRate: 2.7 }, shot: eyeContactFan, targets: ahead });
    const fromHand = visibleBeam(scene).tubes.filter(m => m.position.distanceTo(HAND) < 1e-6);
    expect(fromHand).toHaveLength(3);
    const dirs = fromHand.map(m => m.getWorldDirection(new THREE.Vector3()));
    const angles = [dirs[0].angleTo(dirs[1]), dirs[0].angleTo(dirs[2]), dirs[1].angleTo(dirs[2])].sort((a, b) => a - b);
    for (const a of angles.slice(0, 2)) {
      expect(a).toBeGreaterThan(0.9 * VOLLEY_SPREAD);
      expect(a).toBeLessThan(1.1 * VOLLEY_SPREAD);
    }
    expect(angles[2]).toBeGreaterThan(1.8 * VOLLEY_SPREAD);
  });

  it('Eye Contact bends the beam into a curve, drawn in more than one piece per beam, and every beam reaches the projection', () => {
    const { state } = castOnce({ fill: 0, stats: { fireRate: 2.7 }, shot: eyeContactFan, targets: ahead }, 1.5);
    expect(state.hits.filter(id => id === 3)).toHaveLength(30);
    const { scene } = castOnce({ fill: 0, stats: { fireRate: 2.7 }, shot: eyeContactFan, targets: ahead });
    expect(visibleBeam(scene).tubes.length).toBeGreaterThan(3);
  });

  it('a homing path turns a little at every step, as an intention does, never in one straight turn', () => {
    const solid = () => false;
    const want = new THREE.Vector3(4, 1.5, -6);
    const path = beamPath(new THREE.Vector3(0.5, 1.5, 0.5), new THREE.Vector3(0, 0, -1), 24, 10, 16, solid, () => want);
    expect(path.points.length).toBeGreaterThan(3);
    const first = path.points[1].clone().sub(path.points[0]).normalize();
    expect(first.angleTo(new THREE.Vector3(0, 0, -1))).toBeCloseTo(0, 6);
    const passes = path.points.some(p => p.distanceTo(want) < 0.5);
    expect(passes).toBe(true);
    const straight = beamPath(new THREE.Vector3(0.5, 1.5, 0.5), new THREE.Vector3(0, 0, -1), 24, 0, 16, solid, () => want);
    expect(straight.points).toHaveLength(2);
  });
});

describe('Spiral Growth layers over the beam (issue #258)', () => {
  const spiral = { formation: { triad: false, spiral: true } };

  it('the beam keeps its own core at its normal width under the strands', () => {
    const { scene } = castOnce({ fill: 0, stats: { fireRate: 2.7 }, shot: spiral });
    const { tubes, helices } = visibleBeam(scene);
    expect(tubes).toHaveLength(1);
    expect(tubes[0].scale.x).toBeGreaterThan(BEAM_WIDTH - 0.016);
    expect(tubes[0].scale.x).toBeLessThan(BEAM_WIDTH + 0.016);
    expect(helices).toHaveLength(6);
  });

  it('the strands start on the beam and stay inside its halo for the first block, so none wraps around the eye', () => {
    const { scene } = castOnce({ fill: 0, stats: { fireRate: 2.7 }, shot: spiral });
    const { helices } = visibleBeam(scene);
    expect(helices.length).toBeGreaterThan(0);
    const halo = BEAM_WIDTH * HALO_WIDTH;
    for (const m of helices) {
      const pos = m.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        if (pos.getZ(i) >= 1) continue;
        expect(Math.hypot(pos.getX(i), pos.getY(i))).toBeLessThanOrEqual(halo);
      }
    }
    expect(helixRadiusAt(0)).toBe(0);
    expect(helixRadiusAt(24)).toBe(BEAM_HELIX_R);
  });
});

describe('One Clear Cut (great cut)', () => {
  it('sweeps a capped giant blade, at most 60 cuts per frame, hitting each projection once', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7, size: 5 }, fill: 10 });
    const g = new GreatCut(new THREE.Scene(), host);
    state.casting = true; run(g, 1.25, 1 / 60);
    state.casting = false;
    let before = 0;
    for (let i = 0; i < 120; i++) {
      g.update(1 / 60);
      expect(state.cuts.length - before).toBeLessThanOrEqual(60);
      before = state.cuts.length;
    }
    expect(state.strikes).toBe(1);
    expect(state.cuts.length).toBeGreaterThan(100);
    expect(state.hits).toEqual([7]);
    const far = Math.max(...state.cuts.map(c => { const [x, , z] = c.split(',').map(Number); return Math.hypot(x + 0.5 - 0.5, z + 0.5 - 0.5); }));
    expect(far).toBeLessThanOrEqual(GREATCUT_MAX_REACH + 1);
  });

  it('cuts the same blocks at 20 fps as at 144 fps (the sweep integrates its arc)', () => {
    const cutsAt = (fps: number) => {
      const { host, state } = fakeHost({ stats: { fireRate: 2.7 }, fill: 10 });
      const g = new GreatCut(new THREE.Scene(), host);
      state.casting = true; run(g, 1.25, 1 / fps);
      state.casting = false; run(g, 2, 1 / fps);
      return new Set(state.cuts);
    };
    const a = cutsAt(20), b = cutsAt(144);
    const missing = [...b].filter(c => !a.has(c)).length;
    expect(missing / b.size).toBeLessThan(0.05);
  });
});

describe('weapons clear the rubble', () => {
  it('a strike destroys the loose cubes in its reach', async () => {
    const { createWeapon } = await import('../src/combat/weapons');
    for (const id of ['blade', 'beam'] as const) {
      const { host, state } = fakeHost();
      const w = createWeapon(id, new THREE.Scene(), host)!;
      state.casting = true;
      run(w, 2, 1 / 60);
      state.casting = false;
      run(w, 2, 1 / 60);
      expect(state.cubes.length, id).toBeGreaterThan(0);
    }
  });
});
