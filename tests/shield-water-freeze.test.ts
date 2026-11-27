import { describe, expect, it } from 'vitest';
import { ELEMENT_BY_KEY } from '../src/content/elements';
import shield from '../src/content/items/shield';
import { FREEZE_CADENCE, Freeze, freezeProjection } from '../src/core/freeze';
import { BASE_STATS, STAT_LIMITS, computeStats } from '../src/core/stats';
import { Player, type PlayerHooks, type PlayerMedium } from '../src/entities/player';
import type { Input } from '../src/input/input';
import { copyMods } from '../src/items/types';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { SpiritLaw } from '../src/sky/laws/spirit';
import { WATER_PACE, inWater, slowStep, waterPace } from '../src/sky/laws/water';
import type { SkyHost, SkyPlayer } from '../src/sky/types';

const DT = 1 / 60;
const flat = (_x: number, y: number) => y <= 0;
const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v };

function walker(medium?: PlayerMedium, shielded = false) {
  const p = new Player();
  p.spawnAt(0.5, 1, 0.5);
  p.body.onGround = true;
  p.airShield = shielded;
  const move = { x: 0, y: 0 };
  const input = { hit: () => false, held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 1 } as unknown as Input;
  const run = (s: number) => { for (let t = 0; t < s - 1e-9; t += DT) p.update(DT, input, BASE_STATS, flat, hooks, medium); };
  return { p, move, run };
}

function skyPlayer(p: Player): SkyPlayer {
  return {
    get body() { return p.body; }, eye: { x: 0, y: 0, z: 0 }, aim: { x: 0, y: 0, z: 1 }, hand: [],
    push: (x, y, z) => p.push(x, y, z), slow: (_f, s) => p.slow(s), hold: s => p.hold(s), carry: () => {},
    freeze: s => p.freeze(s), get held() { return p.heldT > 0; }, get shielded() { return p.shielded; },
  };
}

describe('the Shield, the lion gift (#357)', () => {
  it('is a 0/1 stat, base 0, that the lion alone gives', () => {
    expect(BASE_STATS.airShield).toBe(0);
    expect(STAT_LIMITS.airShield).toEqual([0, 1]);
    expect(computeStats(copyMods(shield, 0).map(s => ({ ...s, source: 'shield' }))).airShield).toBe(1);
  });

  it('shielded = the stat and the feet off the ground: the flag the wind above the tree reads', () => {
    const p = new Player();
    p.body.onGround = false;
    expect(p.shielded).toBe(false);
    p.airShield = true;
    expect(p.shielded).toBe(true);
    p.body.onGround = true;
    expect(p.shielded).toBe(false);
  });

  it('in the air no push, hold, slow or freeze takes; on the ground they all do', () => {
    const p = new Player();
    p.airShield = true;
    p.body.onGround = false;
    p.push(5, 5, 5);
    p.hold(2);
    p.slow(2);
    expect(p.freeze(2)).toBe(false);
    expect([p.body.vx, p.body.vy, p.body.vz, p.heldT, p.slowT]).toEqual([0, 0, 0, 0, 0]);
    p.body.onGround = true;
    p.push(5, 0, 0);
    p.hold(1);
    p.slow(1);
    expect(p.body.vx).toBe(5);
    expect([p.heldT, p.slowT]).toEqual([1, 1]);
  });

  it('in the air no drain lands: the spirit gate refuses it', () => {
    const p = new Player();
    p.airShield = true;
    p.body.onGround = false;
    let drained = 0;
    const host = { time: () => 100, player: () => skyPlayer(p), drainSpirit: (n: number) => { drained += n; }, spirit: () => 5 } as unknown as SkyHost;
    const law = new SpiritLaw(host);
    expect(law.canDrain()).toBe(false);
    expect(law.drain(2)).toBe(false);
    p.body.onGround = true;
    expect(law.drain(2)).toBe(true);
    expect(drained).toBe(2);
  });

  it('a paralysis ring (the lion roar) goes through the freeze, which the Shield refuses', () => {
    const p = new Player();
    p.airShield = true;
    p.body.onGround = false;
    const effects = new SkyEffects({ player: () => skyPlayer(p) } as unknown as SkyHost);
    expect(effects.freeze(1.5)).toBe(false);
    p.body.onGround = true;
    expect(effects.freeze(1.5)).toBe(true);
    expect(p.heldT).toBe(1.5);
  });
});

describe('water: every being moves at half speed (#357)', () => {
  it('the player in slow water walks at half the speed', () => {
    const water = ELEMENT_BY_KEY.water;
    const dry = walker(), wet = walker({ feet: { ...water, wade: WATER_PACE }, head: null });
    dry.move.y = 1; wet.move.y = 1;
    dry.run(1); wet.run(1);
    expect(WATER_PACE).toBe(0.5);
    expect(Math.hypot(wet.p.body.vx, wet.p.body.vz) / Math.hypot(dry.p.body.vx, dry.p.body.vz)).toBeCloseTo(0.5, 2);
  });

  it('a sky creature in water: its pace is 0.5, and a step it takes is halved', () => {
    const cells = new Set(['2,3,2']);
    const world = { elemAt: (x: number, y: number, z: number) => (cells.has(`${x},${y},${z}`) ? 1 << 6 | 8 : 0) };
    const body = { x: 2.5, y: 3, z: 2.5, h: 1, vx: 2, vz: 0 };
    expect(inWater(world, body)).toBe(true);
    expect(waterPace(world, body)).toBe(0.5);
    expect(waterPace(world, { ...body, x: 5.5 })).toBe(1);
    const b = { x: 3.5, z: 2.5, vx: 2, vz: 0 };
    slowStep(b, 2.5, 2.5, 0.5);
    expect([b.x, b.z, b.vx]).toEqual([3, 2.5, 1]);
  });
});

describe('the freeze family (#357)', () => {
  it('a freeze lasts its own time; after it ends, 3 s of cadence in which no freeze takes', () => {
    expect(FREEZE_CADENCE).toBe(3);
    const f = new Freeze();
    expect(f.start(2)).toBe(true);
    expect(f.start(3)).toBe(false);
    for (let t = 0; t < 2 - 1e-9; t += DT) f.tick(DT);
    f.tick(DT);
    expect(f.frozen).toBe(false);
    expect(f.start(3)).toBe(false);
    for (let t = 0; t < 2.9; t += DT) f.tick(DT);
    expect(f.start(3)).toBe(false);
    for (let t = 0; t < 0.2; t += DT) f.tick(DT);
    expect(f.start(3)).toBe(true);
  });

  it('the player: a freeze holds the body for its time, then the cadence refuses the next one', () => {
    const w = walker();
    expect(w.p.freeze(1)).toBe(true);
    w.move.y = 1;
    w.run(0.9);
    expect(Math.hypot(w.p.body.x - 0.5, w.p.body.z - 0.5)).toBeLessThan(1e-6);
    w.run(0.2);
    expect(w.p.freeze(1)).toBe(false);
    w.run(3);
    expect(w.p.freeze(1)).toBe(true);
  });

  it('a projection: frozen, then thawing 3 s, in which no freeze takes (Thought Stopping and the sphere alike)', () => {
    const e = { frozen: 0, thaw: 0 };
    expect(freezeProjection(e, 2)).toBe(true);
    expect(freezeProjection(e, 3)).toBe(false);
    e.frozen = 0; e.thaw = FREEZE_CADENCE;
    expect(freezeProjection(e, 3)).toBe(false);
    e.thaw = 0;
    expect(freezeProjection(e, 3)).toBe(true);
    expect(e.frozen).toBe(3);
  });
});
